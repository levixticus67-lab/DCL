import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  branchId: integer("branch_id"),
  leaderId: integer("leader_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Department = typeof departmentsTable.$inferSelect;
export type InsertDepartment = typeof departmentsTable.$inferInsert;
