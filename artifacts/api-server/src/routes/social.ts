import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, socialLinksTable } from "@workspace/db";
import {
  ListSocialLinksResponse,
  CreateSocialLinkBody,
  UpdateSocialLinkBody,
  UpdateSocialLinkResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/social-links", async (_req, res) => {
  const rows = await db
    .select()
    .from(socialLinksTable)
    .orderBy(asc(socialLinksTable.sortOrder), asc(socialLinksTable.platform));
  res.json(ListSocialLinksResponse.parse(rows.map(serialize)));
});

router.post("/social-links", requireAdmin, async (req, res) => {
  const body = CreateSocialLinkBody.parse(req.body);
  const [row] = await db.insert(socialLinksTable).values(body).returning();
  res.status(201).json(serialize(row));
});

router.patch("/social-links/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateSocialLinkBody.parse(req.body);
  const [row] = await db
    .update(socialLinksTable)
    .set(body)
    .where(eq(socialLinksTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateSocialLinkResponse.parse(serialize(row)));
});

router.delete("/social-links/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(socialLinksTable).where(eq(socialLinksTable.id, id));
  res.status(204).send();
});

function serialize(row: typeof socialLinksTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
