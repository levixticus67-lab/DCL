import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const storageItemsTable = pgTable("storage_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type StorageItem = typeof storageItemsTable.$inferSelect;
export type InsertStorageItem = typeof storageItemsTable.$inferInsert;
