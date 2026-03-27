import { pgTable, serial, text, boolean, timestamp, integer, decimal, date, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const shoutboxMessages = pgTable("shoutbox_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShoutboxMessageSchema = createInsertSchema(shoutboxMessages).omit({
  id: true,
  createdAt: true,
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id"),
  authorUuid: text("author_uuid"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  isPremium: boolean("is_premium").default(false),
  location: text("location"),
  contactInfo: text("contact_info"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  tags: text("tags").array(),
  images: text("images").array(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type ShoutboxMessage = typeof shoutboxMessages.$inferSelect;
export type Ad = typeof ads.$inferSelect;

// === BIZ: IMPREZY CYKLICZNE ===
// Repertuar tygodniowy – jeden rekord na dzień tygodnia (0=Nd, 1=Pon…6=Sb)
export const bizEvents = pgTable("biz_events", {
  id: serial("id").primaryKey(),
  dayOfWeek: smallint("day_of_week").notNull(),          // 0–6 (0=Nd)
  eventName: text("event_name").notNull(),
  description: text("description"),
  hoursStart: text("hours_start").notNull(),             // "14:00"
  hoursEnd: text("hours_end").notNull(),                 // "23:00"
  priceRegular: integer("price_regular").notNull(),      // w zł
  priceWeekend: integer("price_weekend"),                // null = tak samo jak regular
});

export const insertBizEventSchema = createInsertSchema(bizEvents).omit({ id: true });
export type BizEvent = typeof bizEvents.$inferSelect;

// === BIZ: IMPREZY SPECJALNE ===
// Konkretne daty – nadpisują rekord cykliczny dla danego dnia
export const bizSpecialEvents = pgTable("biz_special_events", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),                 // "2025-04-18"
  eventName: text("event_name").notNull(),
  description: text("description"),
  hoursStart: text("hours_start").notNull(),
  hoursEnd: text("hours_end").notNull(),
  price: integer("price").notNull(),
});

export const insertBizSpecialEventSchema = createInsertSchema(bizSpecialEvents).omit({ id: true });
export type BizSpecialEvent = typeof bizSpecialEvents.$inferSelect;

// === BIZ: OGŁOSZENIE RECEPCJI ===
// Pojedynczy pinned message widoczny w chacie
export const bizPinnedMessage = pgTable("biz_pinned_message", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export type BizPinnedMessage = typeof bizPinnedMessage.$inferSelect;
