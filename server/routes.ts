import type { Express, Request, Response } from "express";
import { db } from "./db.js";
import { shoutboxMessages, ads, groupMemberships, privateMessages, userGallery, pushSubscriptions, bizGroups, groupActivity } from "../shared/schema.js";
import { desc, eq, and, sql, or } from "drizzle-orm";
import { isAuthenticated, isAdmin, isAdminEmail, supabaseAdmin } from "./auth.js";
import webpush from "web-push";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@bizarriusz.pl",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export function registerRoutes(app: Express) {

  // === AUTH ===
  app.get("/api/auth/user", isAuthenticated, (req: any, res: Response) => {
    res.json({ id: req.user.id, email: req.user.email, isAdmin: isAdminEmail(req.user.email) });
  });

  // GET /api/users/:userId/profile - public profile
  app.get("/api/users/:userId/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!supaUser) return res.status(404).json({ message: "Nie znaleziono użytkownika" });
      const m = supaUser.user_metadata || {};
      res.json({
        id: userId,
        displayName: m.full_name || m.name || supaUser.email?.split("@")[0] || "Użytkownik",
        avatarUrl: m.avatar_url || null,
        age: m.age || null,
        height: m.height || null,
        weight: m.weight || null,
        about: m.about || null,
        lookingFor: m.looking_for || null,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
      const result = await db.insert(groupMemberships).values({ userId: req.user.id, groupSlug: slug })
        .onConflictDoNothing().returning();

      if (result.length > 0) {
        await db.update(bizGroups).set({ memberCount: sql`member_count + 1` }).where(eq(bizGroups.slug, slug));

        let username = req.user.email?.split("@")[0] || "Anonim";
        let groupName = slug;
        try {
          const { data: { user: su } } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
          const m = su?.user_metadata || {};
          username = m.full_name || m.name || username;
          const [g] = await db.select({ name: bizGroups.name }).from(bizGroups).where(eq(bizGroups.slug, slug)).limit(1);
          if (g) groupName = g.name;
        } catch (_) {}

        await db.insert(groupActivity).values({ groupSlug: slug, groupName, userId: req.user.id, username, type: "joined" });
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/groups/:slug/leave", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const deleted = await db.delete(groupMemberships)
        .where(and(eq(groupMemberships.userId, req.user.id), eq(groupMemberships.groupSlug, slug)))
        .returning();

      if (deleted.length > 0) {
        await db.update(bizGroups).set({ memberCount: sql`greatest(member_count - 1, 0)` }).where(eq(bizGroups.slug, slug));
      }

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

      try {
        const [g] = await db.select({ name: bizGroups.name }).from(bizGroups).where(eq(bizGroups.slug, slug)).limit(1);
        const groupName = g?.name || slug;
        await db.insert(groupActivity).values({
          groupSlug: slug,
          groupName,
          userId: req.user.id,
          username,
          type: "message",
          payload: content.trim().slice(0, 100),
        });
      } catch (_) {}

      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === GROUPS: LIST & CREATE ===
  app.get("/api/groups", async (req: Request, res: Response) => {
    try {
      const groups = await db.select().from(bizGroups)
        .orderBy(desc(bizGroups.memberCount), desc(bizGroups.createdAt));
      res.json(groups);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/groups", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { name, description, coverEmoji, isPublic } = req.body;
      if (!name?.trim() || name.trim().length < 3) {
        return res.status(400).json({ message: "Nazwa musi mieć co najmniej 3 znaki" });
      }

      let username = req.user.email?.split("@")[0] || "Anonim";
      try {
        const { data: { user: su } } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const m = su?.user_metadata || {};
        username = m.full_name || m.name || username;
      } catch (_) {}

      const slug = name.trim()
        .toLowerCase()
        .replace(/[ąćęłńóśźż]/g, (c: string) => ({ ą:"a",ć:"c",ę:"e",ł:"l",ń:"n",ó:"o",ś:"s",ź:"z",ż:"z" }[c] ?? c))
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        + "-" + Date.now().toString(36);

      const [group] = await db.insert(bizGroups).values({
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        coverEmoji: coverEmoji || "👥",
        createdById: req.user.id,
        createdByName: username,
        isPublic: isPublic !== false,
        memberCount: 1,
      }).returning();

      await db.insert(groupMemberships).values({ userId: req.user.id, groupSlug: slug }).onConflictDoNothing();

      await db.insert(groupActivity).values({
        groupSlug: slug,
        groupName: group.name,
        userId: req.user.id,
        username,
        type: "created",
      });

      res.status(201).json(group);
    } catch (err: any) {
      console.error("[POST /api/groups] error:", err);
      res.status(500).json({ message: err.message, detail: err.detail ?? null });
    }
  });

  // === ACTIVITY FEED ===
  app.get("/api/activity", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
      const items = await db.select().from(groupActivity)
        .orderBy(desc(groupActivity.createdAt))
        .limit(limit);
      res.json(items);
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

      // Send push to all subscribers when pinning
      if (pinned && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        const [msg] = await db.select().from(shoutboxMessages).where(eq(shoutboxMessages.id, id)).limit(1);
        const subs = await db.select().from(pushSubscriptions);
        const payload = JSON.stringify({
          title: "📌 Wiadomość od recepcji",
          body: msg?.content?.slice(0, 100) || "",
          url: "/",
        });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (pushErr: any) {
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
            }
          }
        }
      }
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

      // Fetch avatars for unique authors in parallel
      const uniqueUuids = [...new Set(result.map(a => a.authorUuid).filter(Boolean))] as string[];
      const avatarMap = new Map<string, string | null>();
      await Promise.all(uniqueUuids.map(async (uuid) => {
        try {
          const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(uuid);
          avatarMap.set(uuid, u?.user_metadata?.avatar_url || null);
        } catch { avatarMap.set(uuid, null); }
      }));

      res.json(result.map(a => ({ ...a, authorAvatarUrl: a.authorUuid ? avatarMap.get(a.authorUuid) ?? null : null })));
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
      const convMap = new Map<string, { partnerId: string; partnerName: string; partnerAvatar: string | null; lastMessage: string; lastTime: string; unreadCount: number }>();
      for (const msg of allMsgs) {
        const isOwn = msg.senderId === userId;
        const partnerId = isOwn ? msg.recipientId : msg.senderId;
        const partnerName = isOwn ? msg.recipientName : msg.senderName;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            partnerName,
            partnerAvatar: null,
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

      // Fetch avatars for all partners in parallel
      await Promise.all(Array.from(convMap.keys()).map(async (partnerId) => {
        try {
          const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(partnerId);
          convMap.get(partnerId)!.partnerAvatar = u?.user_metadata?.avatar_url || null;
        } catch { /* leave null */ }
      }));

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
      const { content, recipientName, adId, adTitle, imageUrl } = req.body;
      if (!content?.trim() && !imageUrl) return res.status(400).json({ message: "Treść wiadomości jest wymagana" });

      let senderName = req.user.email?.split("@")[0] || "Anonim";
      let recipientDisplayName = "Użytkownik";
      try {
        const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const meta = supaUser?.user_metadata || {};
        senderName = meta.full_name || meta.name || senderName;
      } catch (_) {}
      try {
        const { data: { user: recipientUser } } = await supabaseAdmin.auth.admin.getUserById(partnerId);
        const meta = recipientUser?.user_metadata || {};
        recipientDisplayName = meta.full_name || meta.name || recipientUser?.email?.split("@")[0] || recipientDisplayName;
      } catch (_) {}

      const [msg] = await db.insert(privateMessages).values({
        senderId: userId,
        senderName,
        recipientId: partnerId,
        recipientName: recipientDisplayName,
        content: content?.trim() || "",
        adId: adId || null,
        adTitle: adTitle || null,
        imageUrl: imageUrl || null,
        isRead: false,
      }).returning();

      res.status(201).json(msg);

      // Send push notification to recipient (non-blocking)
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, partnerId))
          .then(async (subs) => {
            const payload = JSON.stringify({
              title: `Wiadomość od ${senderName}`,
              body: imageUrl ? "📷 Zdjęcie" : (content?.trim() || "").slice(0, 100),
              url: "/wiadomosci",
            });
            for (const sub of subs) {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload
                );
              } catch (pushErr: any) {
                // Remove expired/invalid subscriptions
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === USER GALLERY ===

  // GET /api/gallery - get current user's gallery
  app.get("/api/gallery", isAuthenticated, async (req: any, res: Response) => {
    try {
      const photos = await db.select().from(userGallery)
        .where(eq(userGallery.userId, req.user.id))
        .orderBy(userGallery.createdAt);
      res.json(photos);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/gallery - add photo URL to gallery (upload done client-side)
  app.post("/api/gallery", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "imageUrl jest wymagany" });

      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(userGallery).where(eq(userGallery.userId, req.user.id));
      if (count >= 5) return res.status(400).json({ message: "Maksymalnie 5 zdjęć w galerii" });

      const [photo] = await db.insert(userGallery).values({
        userId: req.user.id,
        imageUrl,
      }).returning();
      res.status(201).json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /api/gallery/:id - remove photo from gallery
  app.delete("/api/gallery/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [photo] = await db.select().from(userGallery).where(eq(userGallery.id, id)).limit(1);
      if (!photo) return res.status(404).json({ message: "Nie znaleziono" });
      if (photo.userId !== req.user.id) return res.status(403).json({ message: "Brak dostępu" });
      await db.delete(userGallery).where(eq(userGallery.id, id));
      res.json({ ok: true });
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

  // === BLOG ===
  app.get("/api/blog", async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("articles")
        .select("id, title, slug, excerpt, content, author, status, featured, cover_image, created_at, tags, category_slug")
        .eq("site", "bizarriusz")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/blog", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("articles")
        .select("id, title, slug, excerpt, content, author, status, featured, cover_image, created_at, updated_at, tags, category_slug")
        .eq("site", "bizarriusz")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/blog", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { title, slug, excerpt, content, status, featured, cover_image, tags, category_slug } = req.body;
      if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Tytuł i treść są wymagane" });
      const finalSlug = (slug?.trim() ||
        title.trim().toLowerCase()
          .replace(/ą/g,"a").replace(/ę/g,"e").replace(/ó/g,"o").replace(/ś/g,"s")
          .replace(/ł/g,"l").replace(/ż/g,"z").replace(/ź/g,"z").replace(/ć/g,"c").replace(/ń/g,"n")
          .replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")
      ) + "-" + Date.now();
      const { data, error } = await supabaseAdmin
        .from("articles")
        .insert({ title: title.trim(), slug: finalSlug, excerpt: excerpt?.trim() || null, content: content.trim(), status: status || "draft", featured: !!featured, cover_image: cover_image?.trim() || null, tags: tags || null, category_slug: category_slug?.trim() || null, site: "bizarriusz", author: req.user.email?.split("@")[0] || "Admin" })
        .select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message, detail: (err as any).detail ?? null });
    }
  });

  app.put("/api/admin/blog/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title, slug, excerpt, content, status, featured, cover_image, tags, category_slug } = req.body;
      const { data, error } = await supabaseAdmin
        .from("articles")
        .update({ title, slug, excerpt, content, status, featured: !!featured, cover_image, tags, category_slug, updated_at: new Date().toISOString() })
        .eq("id", id).eq("site", "bizarriusz")
        .select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/blog/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { error } = await supabaseAdmin.from("articles").delete().eq("id", parseInt(req.params.id)).eq("site", "bizarriusz");
      if (error) throw error;
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === ADMIN: USERS ===
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.user_metadata?.full_name || u.user_metadata?.name || null,
        avatarUrl: u.user_metadata?.avatar_url || null,
        bannedUntil: (u as any).banned_until || null,
        createdAt: u.created_at,
      })));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/users/:id/ban", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const { ban } = req.body;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        ban_duration: ban ? "876000h" : "none",
      } as any);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === ADMIN: ADS ===
  app.get("/api/admin/ads", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await db.select().from(ads).where(eq(ads.source, "bizarriusz")).orderBy(desc(ads.createdAt)).limit(200);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/ads/:id", isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      await db.delete(ads).where(eq(ads.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === PUSH NOTIFICATIONS ===

  app.get("/api/push/public-key", (_req: Request, res: Response) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(503).json({ message: "Push not configured" });
    res.json({ publicKey: key });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Nieprawidłowa subskrypcja" });
      }
      await db.insert(pushSubscriptions).values({
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }).onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth },
      });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/push/unsubscribe", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await db.delete(pushSubscriptions)
          .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, req.user.id)));
      } else {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, req.user.id));
      }
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
