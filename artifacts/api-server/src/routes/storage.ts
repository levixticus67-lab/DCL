import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, storageItemsTable } from "@workspace/db";
import {
  ListStorageItemsResponse,
  CreateStorageItemBody,
  UpdateStorageItemBody,
  UpdateStorageItemResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/storage", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const filters = category ? [eq(storageItemsTable.category, category)] : [];
  const rows = await db
    .select()
    .from(storageItemsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(storageItemsTable.createdAt));
  res.json(ListStorageItemsResponse.parse(rows.map(serialize)));
});

router.post("/storage", requireAdmin, async (req, res) => {
  const body = CreateStorageItemBody.parse(req.body);
  const [row] = await db.insert(storageItemsTable).values(body).returning();
  res.status(201).json(serialize(row));
});

router.patch("/storage/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateStorageItemBody.parse(req.body);
  const [row] = await db
    .update(storageItemsTable)
    .set(body)
    .where(eq(storageItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateStorageItemResponse.parse(serialize(row)));
});

router.delete("/storage/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(storageItemsTable).where(eq(storageItemsTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof storageItemsTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
