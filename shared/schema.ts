import { pgTable, serial, text, boolean, timestamp, integer, decimal } from "drizzle-orm/pg-core";
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
