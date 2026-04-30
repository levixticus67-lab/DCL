import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import {
  db,
  branchesTable,
  peopleTable,
  departmentsTable,
  announcementsTable,
  financeTransactionsTable,
  attendanceServicesTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res) => {
  const [{ branches }] = await db
    .select({ branches: sql<number>`count(*)::int` })
    .from(branchesTable);
  const [{ people }] = await db
    .select({ people: sql<number>`count(*)::int` })
    .from(peopleTable);
  const [{ departments }] = await db
    .select({ departments: sql<number>`count(*)::int` })
    .from(departmentsTable);
  const [{ announcements }] = await db
    .select({ announcements: sql<number>`count(*)::int` })
    .from(announcementsTable);

  const peopleByRole = await db
    .select({
      role: peopleTable.role,
      count: sql<number>`count(*)::int`,
    })
    .from(peopleTable)
    .groupBy(peopleTable.role);

  const fin = await db.select().from(financeTransactionsTable);
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const r of fin) {
    const a = Number(r.amount);
    if (r.kind === "expense") totalExpenses += a;
    else totalIncome += a;
  }

  const att = await db.select().from(attendanceServicesTable);
  const attendanceTotal = att.reduce(
    (sum, r) => sum + r.adultCount + r.youthCount + r.childrenCount,
    0,
  );

  res.json(
    GetDashboardSummaryResponse.parse({
      counts: {
        branches,
        people,
        departments,
        announcements,
      },
      peopleByRole: peopleByRole.map((r) => ({ role: r.role, count: r.count })),
      finance: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        currency: "UGX",
      },
      attendanceTotal,
    }),
  );
});

router.get("/dashboard/recent-activity", requireAuth, async (_req, res) => {
  const recentAnnouncements = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.createdAt))
    .limit(5);
  const recentFinance = await db
    .select()
    .from(financeTransactionsTable)
    .orderBy(desc(financeTransactionsTable.createdAt))
    .limit(5);
  const recentAttendance = await db
    .select()
    .from(attendanceServicesTable)
    .orderBy(desc(attendanceServicesTable.createdAt))
    .limit(5);

  type Item = {
    kind: string;
    title: string;
    occurredAt: string;
    referenceId: number;
  };

  const items: Item[] = [
    ...recentAnnouncements.map((a) => ({
      kind: "announcement",
      title: a.title,
      occurredAt: a.createdAt.toISOString(),
      referenceId: a.id,
    })),
    ...recentFinance.map((f) => ({
      kind: "finance",
      title: `${f.kind} — ${Number(f.amount).toLocaleString()} ${f.currency}`,
      occurredAt: f.createdAt.toISOString(),
      referenceId: f.id,
    })),
    ...recentAttendance.map((a) => ({
      kind: "attendance",
      title: `${a.title} — ${a.adultCount + a.youthCount + a.childrenCount} attended`,
      occurredAt: a.createdAt.toISOString(),
      referenceId: a.id,
    })),
  ]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 12);

  res.json(GetRecentActivityResponse.parse(items));
});

export default router;
