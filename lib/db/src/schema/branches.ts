import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isMain: boolean("is_main").notNull().default(false),
  location: text("location").notNull(),
  pastorInChargeName: text("pastor_in_charge_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Branch = typeof branchesTable.$inferSelect;
export type InsertBranch = typeof branchesTable.$inferInsert;
