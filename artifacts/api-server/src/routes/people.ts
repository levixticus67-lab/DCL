import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, peopleTable } from "@workspace/db";
import {
  ListPeopleResponse,
  CreatePersonBody,
  GetPersonResponse,
  UpdatePersonBody,
  UpdatePersonResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/people", async (req, res) => {
  const role = req.query.role as string | undefined;
  const branchId = req.query.branchId
    ? Number(req.query.branchId)
    : undefined;
  const departmentId = req.query.departmentId
    ? Number(req.query.departmentId)
    : undefined;
  const search = req.query.search as string | undefined;
  const filters = [] as ReturnType<typeof eq>[];
  if (role) filters.push(eq(peopleTable.role, role));
  if (branchId) filters.push(eq(peopleTable.branchId, branchId));
  if (departmentId) filters.push(eq(peopleTable.departmentId, departmentId));
  if (search) {
    const like = `%${search}%`;
    const sf = or(
      ilike(peopleTable.fullName, like),
      ilike(peopleTable.email, like),
    );
    if (sf) filters.push(sf as ReturnType<typeof eq>);
  }
  const rows = await db
    .select()
    .from(peopleTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(peopleTable.fullName);
  res.json(ListPeopleResponse.parse(rows.map(serialize)));
});

router.post("/people", requireAdmin, async (req, res) => {
  const body = CreatePersonBody.parse(req.body);
  const insertData = {
    ...body,
    joinedOn: body.joinedOn ? toDateOnly(body.joinedOn) : null,
  };
  const [row] = await db.insert(peopleTable).values(insertData).returning();
  res.status(201).json(GetPersonResponse.parse(serialize(row)));
});

router.get("/people/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetPersonResponse.parse(serialize(row)));
});

router.patch("/people/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdatePersonBody.parse(req.body);
  const { joinedOn, ...rest } = body;
  const update: Record<string, unknown> = { ...rest };
  if (joinedOn !== undefined)
    update.joinedOn = joinedOn ? toDateOnly(joinedOn) : null;
  const [row] = await db
    .update(peopleTable)
    .set(update)
    .where(eq(peopleTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdatePersonResponse.parse(serialize(row)));
});

router.delete("/people/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(peopleTable).where(eq(peopleTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof peopleTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDateOnly(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default router;
