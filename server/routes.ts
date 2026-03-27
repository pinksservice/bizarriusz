import type { Express, Request, Response } from "express";
import { db } from "./db.js";
import { shoutboxMessages, ads } from "../shared/schema.js";
import { desc, eq, and } from "drizzle-orm";
import { isAuthenticated, supabaseAdmin } from "./auth.js";

export function registerRoutes(app: Express) {

  // === AUTH ===
  app.get("/api/auth/user", isAuthenticated, (req: any, res: Response) => {
    res.json({ id: req.user.id, email: req.user.email });
  });

  // === SHOUTBOX ===
  app.get("/api/shoutbox", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const msgs = await db.select().from(shoutboxMessages)
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

  app.get("/api/ads", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const conditions = [eq(ads.status, "active")];
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
}
