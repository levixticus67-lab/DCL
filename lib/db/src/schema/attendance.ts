import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";

export const attendanceServicesTable = pgTable("attendance_services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  branchId: integer("branch_id"),
  serviceDate: date("service_date").notNull(),
  adultCount: integer("adult_count").notNull().default(0),
  youthCount: integer("youth_count").notNull().default(0),
  childrenCount: integer("children_count").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AttendanceService = typeof attendanceServicesTable.$inferSelect;
export type InsertAttendanceService = typeof attendanceServicesTable.$inferInsert;
