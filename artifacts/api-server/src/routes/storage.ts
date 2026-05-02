import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, storageItemsTable } from "@workspace/db";
import {
  ListStorageItemsResponse,
  CreateStorageItemBody,
  UpdateStorageItemBody,
  UpdateStorageItemResponse,
} from "@workspace/api-zod";
import {
  requireStorageView,
  requireStorageAdd,
  requireStorageEdit,
  requireStorageDelete,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/storage/items", requireStorageView, async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const sortBy = (req.query.sortBy as string) || "date";
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

  const filters = [] as ReturnType<typeof eq>[];
  if (category && category !== "all")
    filters.push(eq(storageItemsTable.category, category));
  if (search) {
    const like = `%${search}%`;
    const sf = or(
      ilike(storageItemsTable.title, like),
      ilike(storageItemsTable.description, like),
    );
    if (sf) filters.push(sf as ReturnType<typeof eq>);
  }

  const orderCol =
    sortBy === "title"
      ? storageItemsTable.title
      : sortBy === "category"
        ? storageItemsTable.category
        : storageItemsTable.createdAt;

  const rows = await db
    .select()
    .from(storageItemsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(sortDir === "asc" ? asc(orderCol) : desc(orderCol));

  res.json(ListStorageItemsResponse.parse(rows.map(serialize)));
});

router.post("/storage/items", requireStorageAdd, async (req, res) => {
  const body = CreateStorageItemBody.parse(req.body);
  const [row] = await db.insert(storageItemsTable).values(body).returning();
  res.status(201).json(serialize(row));
});

router.patch("/storage/items/:id", requireStorageEdit, async (req, res) => {
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

router.delete("/storage/items/:id", requireStorageDelete, async (req, res) => {
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
