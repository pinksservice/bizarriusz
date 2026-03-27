import type { Express, Request, Response } from "express";
import { db } from "./db.js";
import { shoutboxMessages, ads, groupMemberships, privateMessages } from "../shared/schema.js";
import { desc, eq, and, sql, or } from "drizzle-orm";
import { isAuthenticated, isAdmin, isAdminEmail, supabaseAdmin } from "./auth.js";

export function registerRoutes(app: Express) {

  // === AUTH ===
  app.get("/api/auth/user", isAuthenticated, (req: any, res: Response) => {
    res.json({ id: req.user.id, email: req.user.email, isAdmin: isAdminEmail(req.user.email) });
  });

  // === SHOUTBOX ===
  app.get("/api/shoutbox", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const msgs = await db.select().from(shoutboxMessages)
        .where(eq(shoutboxMessages.source, "bizarriusz"))
        .orderBy(desc(shoutboxMessages.createdAt))
        .limit(limit);
      res.json(msgs.reverse());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/shoutbox", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { content } = req.body;
      if (!content?.trim() || content.trim().length > 500) {
        return res.status(400).json({ message: "Invalid content" });
      }

      // Get display name from Supabase (optional – fallback to email prefix)
      let username = req.user.email?.split("@")[0] || "Anonim";
      try {
        const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const meta = supaUser?.user_metadata || {};
        username = meta.full_name || meta.name || username;
      } catch (_) { /* use fallback */ }

      const [msg] = await db.insert(shoutboxMessages).values({
        userId: req.user.id,
        username,
        avatarUrl: null,
        content: content.trim(),
        source: "bizarriusz",
      }).returning();

      res.status(201).json(msg);
    } catch (err: any) {
      console.error("[POST /api/shoutbox] error:", err);
      res.status(500).json({ message: err.message, detail: err.detail ?? null });
    }
  });

  // === ADS ===
  app.post("/api/ads", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { title, description, category, location, contactInfo } = req.body;
      if (!title?.trim() || !description?.trim() || !category?.trim()) {
        return res.status(400).json({ message: "Wypełnij wymagane pola" });
      }
      const [ad] = await db.insert(ads).values({
        authorId: null,
        authorUuid: req.user.id,
        source: "bizarriusz",
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location?.trim() || null,
        contactInfo: contactInfo?.trim() || null,
        status: "active",
      }).returning();
      res.status(201).json(ad);
    } catch (err: any) {
      console.error("[POST /api/ads] error:", err);
      res.status(500).json({ message: err.message, detail: err.detail ?? null });
    }
  });

  app.delete("/api/ads/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [ad] = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
      if (!ad) return res.status(404).json({ message: "Nie znaleziono" });
      if (ad.authorUuid !== req.user.id) return res.status(403).json({ message: "Brak dostępu" });
      await db.delete(ads).where(eq(ads.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === GROUPS ===
  app.get("/api/groups/:slug/info", async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const token = req.headers.authorization?.replace("Bearer ", "");
      let isMember = false;
      let userId: string | null = null;

      if (token) {
        try {
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) {
            userId = user.id;
            const [m] = await db.select().from(groupMemberships)
              .where(and(eq(groupMemberships.userId, user.id), eq(groupMemberships.groupSlug, slug)))
              .limit(1);
            isMember = !!m;
          }
        } catch (_) {}
      }

      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(groupMemberships).where(eq(groupMemberships.groupSlug, slug));

      res.json({ isMember, memberCount: count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/groups/:slug/join", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      await db.insert(groupMemberships).values({ userId: req.user.id, groupSlug: slug })
        .onConflictDoNothing();
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/groups/:slug/leave", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      await db.delete(groupMemberships)
        .where(and(eq(groupMemberships.userId, req.user.id), eq(groupMemberships.groupSlug, slug)));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/groups/:slug/messages", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const msgs = await db.select().from(shoutboxMessages)
        .where(and(eq(shoutboxMessages.source, "bizarriusz"), eq(shoutboxMessages.groupSlug, slug)))
        .orderBy(desc(shoutboxMessages.createdAt))
        .limit(50);
      res.json(msgs.reverse());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/groups/:slug/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const { content } = req.body;
      if (!content?.trim() || content.trim().length > 500) {
        return res.status(400).json({ message: "Invalid content" });
      }

      // Must be member
      const [membership] = await db.select().from(groupMemberships)
        .where(and(eq(groupMemberships.userId, req.user.id), eq(groupMemberships.groupSlug, slug)))
        .limit(1);
      if (!membership) return res.status(403).json({ message: "Musisz być członkiem grupy" });

      let username = req.user.email?.split("@")[0] || "Anonim";
      try {
        const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const meta = supaUser?.user_metadata || {};
        username = meta.full_name || meta.name || username;
      } catch (_) {}

      const [msg] = await db.insert(shoutboxMessages).values({
        userId: req.user.id,
        username,
        avatarUrl: null,
        content: content.trim(),
        source: "bizarriusz",
        groupSlug: slug,
      }).returning();

      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === ADMIN: SHOUTBOX ===
  app.get("/api/admin/shoutbox", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const msgs = await db.select().from(shoutboxMessages)
        .where(eq(shoutboxMessages.source, "bizarriusz"))
        .orderBy(desc(shoutboxMessages.createdAt))
        .limit(100);
      res.json(msgs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/shoutbox/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      await db.delete(shoutboxMessages).where(eq(shoutboxMessages.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/shoutbox/:id/pin", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pinned = Boolean(req.body.pinned);
      if (pinned) {
        await db.update(shoutboxMessages).set({ isPinned: false }).where(eq(shoutboxMessages.source, "bizarriusz"));
      }
      await db.update(shoutboxMessages).set({ isPinned: pinned }).where(eq(shoutboxMessages.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/ads", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const conditions = [eq(ads.status, "active"), eq(ads.source, "bizarriusz")];
      if (category) conditions.push(eq(ads.category, category));

      const result = await db.select().from(ads)
        .where(and(...conditions))
        .orderBy(desc(ads.createdAt))
        .limit(50);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === PRIVATE MESSAGES ===

  // GET /api/messages/unread-count - must be before /api/messages/:partnerId
  app.get("/api/messages/unread-count", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(privateMessages)
        .where(and(eq(privateMessages.recipientId, userId), eq(privateMessages.isRead, false)));
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/messages - inbox: last message per conversation + unread count
  app.get("/api/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const allMsgs = await db.select().from(privateMessages)
        .where(or(eq(privateMessages.senderId, userId), eq(privateMessages.recipientId, userId)))
        .orderBy(desc(privateMessages.createdAt));

      // Group by conversation partner
      const convMap = new Map<string, { partnerId: string; partnerName: string; lastMessage: string; lastTime: string; unreadCount: number }>();
      for (const msg of allMsgs) {
        const isOwn = msg.senderId === userId;
        const partnerId = isOwn ? msg.recipientId : msg.senderId;
        const partnerName = isOwn ? msg.recipientName : msg.senderName;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            partnerName,
            lastMessage: msg.content,
            lastTime: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
            unreadCount: 0,
          });
        }
        if (!isOwn && !msg.isRead) {
          const conv = convMap.get(partnerId)!;
          conv.unreadCount += 1;
        }
      }

      res.json(Array.from(convMap.values()));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/messages/:partnerId - full conversation
  app.get("/api/messages/:partnerId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;
      const msgs = await db.select().from(privateMessages)
        .where(
          or(
            and(eq(privateMessages.senderId, userId), eq(privateMessages.recipientId, partnerId)),
            and(eq(privateMessages.senderId, partnerId), eq(privateMessages.recipientId, userId))
          )
        )
        .orderBy(privateMessages.createdAt);
      res.json(msgs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/messages/:partnerId - send message
  app.post("/api/messages/:partnerId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;
      const { content, recipientName, adId, adTitle } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: "Treść wiadomości jest wymagana" });

      let senderName = req.user.email?.split("@")[0] || "Anonim";
      try {
        const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const meta = supaUser?.user_metadata || {};
        senderName = meta.full_name || meta.name || senderName;
      } catch (_) {}

      const [msg] = await db.insert(privateMessages).values({
        senderId: userId,
        senderName,
        recipientId: partnerId,
        recipientName: recipientName || "Użytkownik",
        content: content.trim(),
        adId: adId || null,
        adTitle: adTitle || null,
        isRead: false,
      }).returning();

      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // PATCH /api/messages/:partnerId/read - mark messages as read
  app.patch("/api/messages/:partnerId/read", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;
      await db.update(privateMessages)
        .set({ isRead: true })
        .where(and(eq(privateMessages.senderId, partnerId), eq(privateMessages.recipientId, userId), eq(privateMessages.isRead, false)));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
