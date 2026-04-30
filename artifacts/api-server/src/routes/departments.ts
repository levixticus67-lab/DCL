import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, departmentsTable } from "@workspace/db";
import {
  ListDepartmentsResponse,
  CreateDepartmentBody,
  GetDepartmentResponse,
  UpdateDepartmentBody,
  UpdateDepartmentResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/departments", async (req, res) => {
  const branchId = req.query.branchId
    ? Number(req.query.branchId)
    : undefined;
  const filters = branchId
    ? [eq(departmentsTable.branchId, branchId)]
    : [];
  const rows = await db
    .select()
    .from(departmentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(departmentsTable.name);
  res.json(ListDepartmentsResponse.parse(rows.map(serialize)));
});

router.post("/departments", requireAdmin, async (req, res) => {
  const body = CreateDepartmentBody.parse(req.body);
  const [row] = await db.insert(departmentsTable).values(body).returning();
  res.status(201).json(GetDepartmentResponse.parse(serialize(row)));
});

router.get("/departments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(departmentsTable)
    .where(eq(departmentsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetDepartmentResponse.parse(serialize(row)));
});

router.patch("/departments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateDepartmentBody.parse(req.body);
  const [row] = await db
    .update(departmentsTable)
    .set(body)
    .where(eq(departmentsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateDepartmentResponse.parse(serialize(row)));
});

router.delete("/departments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof departmentsTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
