import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";
import {
  ListBranchesResponse,
  CreateBranchBody,
  GetBranchResponse,
  UpdateBranchBody,
  UpdateBranchResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireMainAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/branches", async (_req, res) => {
  const rows = await db.select().from(branchesTable).orderBy(branchesTable.id);
  res.json(ListBranchesResponse.parse(rows.map(serialize)));
});

router.post("/branches", requireAdmin, async (req, res) => {
  const body = CreateBranchBody.parse(req.body);
  const [row] = await db.insert(branchesTable).values(body).returning();
  res.status(201).json(GetBranchResponse.parse(serialize(row)));
});

router.get("/branches/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetBranchResponse.parse(serialize(row)));
});

router.patch("/branches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateBranchBody.parse(req.body);
  const [row] = await db
    .update(branchesTable)
    .set(body)
    .where(eq(branchesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateBranchResponse.parse(serialize(row)));
});

router.delete("/branches/:id", requireMainAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(branchesTable).where(eq(branchesTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof branchesTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
