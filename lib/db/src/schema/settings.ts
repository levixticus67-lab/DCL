import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  churchName: text("church_name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  tagline: text("tagline"),
  missionStatement: text("mission_statement").notNull(),
  visionStatement: text("vision_statement").notNull(),
  coreValues: text("core_values").array().notNull().default([]),
  address: text("address"),
  primaryPhone: text("primary_phone"),
  primaryEmail: text("primary_email"),
  heroImageUrl: text("hero_image_url"),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;
