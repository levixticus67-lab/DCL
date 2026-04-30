import { pgTable, serial, text, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";

export const peopleTable = pgTable("people", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // pastor | minister | member
  isLeader: boolean("is_leader").notNull().default(false),
  branchId: integer("branch_id"),
  departmentId: integer("department_id"),
  email: text("email"),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  joinedOn: date("joined_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Person = typeof peopleTable.$inferSelect;
export type InsertPerson = typeof peopleTable.$inferInsert;
