import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import {
  GetSiteSettingsResponse,
  UpdateSiteSettingsBody,
  UpdateSiteSettingsResponse,
} from "@workspace/api-zod";
import { requireMainAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getOrCreate() {
  const [existing] = await db.select().from(siteSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(siteSettingsTable)
    .values({
      churchName: "Deliverance Church Lugazi",
      abbreviation: "DCL",
      missionStatement:
        "To know Christ and to make Him known across Lugazi and beyond.",
      visionStatement:
        "A community of believers transformed by the power of the Gospel.",
      coreValues: ["Worship", "Word", "Witness", "Community", "Compassion"],
    })
    .returning();
  return created;
}

router.get("/settings", async (_req, res) => {
  const row = await getOrCreate();
  res.json(GetSiteSettingsResponse.parse(serialize(row)));
});

router.put("/settings", requireMainAdmin, async (req, res) => {
  const body = UpdateSiteSettingsBody.parse(req.body);
  const existing = await getOrCreate();
  const [row] = await db
    .update(siteSettingsTable)
    .set(body)
    .where(eq(siteSettingsTable.id, existing.id))
    .returning();
  res.json(UpdateSiteSettingsResponse.parse(serialize(row)));
});

function serialize(row: typeof siteSettingsTable.$inferSelect) {
  return {
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
