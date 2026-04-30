import { Router, type IRouter } from "express";
import { asc, desc, eq, and } from "drizzle-orm";
import {
  db,
  branchesTable,
  peopleTable,
  announcementsTable,
  socialLinksTable,
  siteSettingsTable,
} from "@workspace/db";
import { GetPublicSiteResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(siteSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(siteSettingsTable)
    .values({
      churchName: "Deliverance Church Lugazi",
      abbreviation: "DCL",
      tagline: "Lifting the name of Jesus over Lugazi",
      missionStatement:
        "To know Christ and to make Him known across Lugazi and beyond.",
      visionStatement:
        "A community of believers transformed by the power of the Gospel.",
      coreValues: ["Worship", "Word", "Witness", "Community", "Compassion"],
    })
    .returning();
  return created;
}

router.get("/public/site", async (_req, res) => {
  const settings = await getOrCreateSettings();
  const branches = await db
    .select()
    .from(branchesTable)
    .orderBy(desc(branchesTable.isMain), asc(branchesTable.name));
  const leaders = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.isLeader, true))
    .orderBy(asc(peopleTable.role), asc(peopleTable.fullName));
  const announcements = await db
    .select()
    .from(announcementsTable)
    .where(
      and(
        eq(announcementsTable.isPublic, true),
      ),
    )
    .orderBy(
      desc(announcementsTable.isPinned),
      desc(announcementsTable.createdAt),
    )
    .limit(8);
  const socials = await db
    .select()
    .from(socialLinksTable)
    .where(eq(socialLinksTable.isActive, true))
    .orderBy(asc(socialLinksTable.sortOrder));

  res.json(
    GetPublicSiteResponse.parse({
      settings: { ...settings, updatedAt: settings.updatedAt.toISOString() },
      branches: branches.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
      leadership: leaders.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      announcements: announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      socialLinks: socials.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    }),
  );
});

export default router;
