import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // image | video | audio | null
  isPublic: boolean("is_public").notNull().default(true),
  isPinned: boolean("is_pinned").notNull().default(false),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Announcement = typeof announcementsTable.$inferSelect;
export type InsertAnnouncement = typeof announcementsTable.$inferInsert;
