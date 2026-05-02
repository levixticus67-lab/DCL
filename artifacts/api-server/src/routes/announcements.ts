import { Router, type IRouter } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import { db, announcementsTable } from "@workspace/db";
import {
  ListAnnouncementsResponse,
  CreateAnnouncementBody,
  GetAnnouncementResponse,
  UpdateAnnouncementBody,
  UpdateAnnouncementResponse,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireMainAdmin,
  requireAnnouncementCreate,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

const PASTOR_ROLES = ["main_admin", "pastor"];
const ANN_MANAGE_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];

router.get("/announcements", async (req, res) => {
  const pinned = req.query.pinned === "true";
  const publicOnly = req.query.publicOnly === "true";
  const pendingReview = req.query.pendingReview === "true";
  const filters = [] as ReturnType<typeof eq>[];

  if (req.query.pinned !== undefined)
    filters.push(eq(announcementsTable.isPinned, pinned));

  if (publicOnly) {
    filters.push(eq(announcementsTable.isPublic, true));
  } else if (pendingReview && req.isAuthenticated() && PASTOR_ROLES.includes(req.user?.role ?? "")) {
    filters.push(eq(announcementsTable.isPublic, false));
  }

  const rows = await db
    .select()
    .from(announcementsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));

  res.json(ListAnnouncementsResponse.parse(rows.map(serialize)));
});

router.post("/announcements", requireAnnouncementCreate, async (req, res) => {
  const body = CreateAnnouncementBody.parse(req.body);
  const role = req.user?.role ?? "";

  let payload = { ...body };

  if (!PASTOR_ROLES.includes(role)) {
    payload.isPublic = false;
  }

  if (payload.isPublic === false && !PASTOR_ROLES.includes(role)) {
    if (body.isPublic === true) {
      payload.title = `[Review Requested] ${payload.title}`;
    }
  }

  const [row] = await db.insert(announcementsTable).values(payload).returning();
  res.status(201).json(GetAnnouncementResponse.parse(serialize(row)));
});

router.get("/announcements/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetAnnouncementResponse.parse(serialize(row)));
});

router.patch("/announcements/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const role = req.user?.role ?? "";

  if (!ANN_MANAGE_ROLES.includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }

  const body = UpdateAnnouncementBody.parse(req.body);
  let payload = { ...body };

  if (body.isPublic === true && !PASTOR_ROLES.includes(role)) {
    payload.isPublic = false;
  }

  const [row] = await db
    .update(announcementsTable)
    .set(payload)
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateAnnouncementResponse.parse(serialize(row)));
});

router.delete("/announcements/:id", requireAuth, async (req, res) => {
  const role = req.user?.role ?? "";
  if (!ANN_MANAGE_ROLES.includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
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
