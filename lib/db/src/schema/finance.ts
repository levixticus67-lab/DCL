import { pgTable, serial, text, integer, timestamp, date, numeric } from "drizzle-orm/pg-core";

export const financeTransactionsTable = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // tithe | offering | pledge | donation | expense | other_income
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("UGX"),
  branchId: integer("branch_id"),
  occurredOn: date("occurred_on").notNull(),
  description: text("description"),
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type FinanceTransaction = typeof financeTransactionsTable.$inferSelect;
export type InsertFinanceTransaction = typeof financeTransactionsTable.$inferInsert;
