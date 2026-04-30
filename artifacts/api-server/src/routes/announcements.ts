import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, announcementsTable } from "@workspace/db";
import {
  ListAnnouncementsResponse,
  CreateAnnouncementBody,
  GetAnnouncementResponse,
  UpdateAnnouncementBody,
  UpdateAnnouncementResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/announcements", async (req, res) => {
  const pinned = req.query.pinned === "true";
  const publicOnly = req.query.publicOnly === "true";
  const filters = [] as ReturnType<typeof eq>[];
  if (req.query.pinned !== undefined)
    filters.push(eq(announcementsTable.isPinned, pinned));
  if (publicOnly) filters.push(eq(announcementsTable.isPublic, true));
  const rows = await db
    .select()
    .from(announcementsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));
  res.json(ListAnnouncementsResponse.parse(rows.map(serialize)));
});

router.post("/announcements", requireAdmin, async (req, res) => {
  const body = CreateAnnouncementBody.parse(req.body);
  const [row] = await db.insert(announcementsTable).values(body).returning();
  res.status(201).json(GetAnnouncementResponse.parse(serialize(row)));
});

router.get("/announcements/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetAnnouncementResponse.parse(serialize(row)));
});

router.patch("/announcements/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateAnnouncementBody.parse(req.body);
  const [row] = await db
    .update(announcementsTable)
    .set(body)
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateAnnouncementResponse.parse(serialize(row)));
});

router.delete("/announcements/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof announcementsTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
