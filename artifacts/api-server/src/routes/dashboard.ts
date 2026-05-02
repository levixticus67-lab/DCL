import { Router, type IRouter } from "express";
import { desc, sql, eq } from "drizzle-orm";
import {
  db,
  branchesTable,
  peopleTable,
  departmentsTable,
  announcementsTable,
  financeTransactionsTable,
  attendanceServicesTable,
  storageItemsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res) => {
  const [{ branches }] = await db
    .select({ branches: sql<number>`count(*)::int` })
    .from(branchesTable);
  const [{ departments }] = await db
    .select({ departments: sql<number>`count(*)::int` })
    .from(departmentsTable);
  const [{ announcements }] = await db
    .select({ announcements: sql<number>`count(*)::int` })
    .from(announcementsTable);
  const [{ storageItems }] = await db
    .select({ storageItems: sql<number>`count(*)::int` })
    .from(storageItemsTable);

  const peopleByRole = await db
    .select({ role: peopleTable.role, count: sql<number>`count(*)::int` })
    .from(peopleTable)
    .groupBy(peopleTable.role);

  const roleCount = (role: string) =>
    peopleByRole.find((r) => r.role === role)?.count ?? 0;

  const fin = await db.select().from(financeTransactionsTable);
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of fin) {
    const a = Number(r.amount);
    if (r.kind === "expense") totalExpense += a;
    else totalIncome += a;
  }

  const att = await db
    .select()
    .from(attendanceServicesTable)
    .orderBy(desc(attendanceServicesTable.serviceDate));
  const latestServices = att.slice(0, 4);
  const latestTotal = latestServices.reduce(
    (s, r) => s + r.adultCount + r.youthCount + r.childrenCount,
    0,
  );
  const weeksTracked = att.length;

  const allBranches = await db.select().from(branchesTable);
  const branchStats = await Promise.all(
    allBranches.map(async (b) => {
      const [{ members }] = await db
        .select({ members: sql<number>`count(*)::int` })
        .from(peopleTable)
        .where(eq(peopleTable.branchId, b.id));
      return { name: b.name, members };
    }),
  );

  res.json({
    totals: {
      pastors: roleCount("pastor"),
      ministers: roleCount("minister"),
      members: roleCount("member"),
      leaders: roleCount("leader"),
      branches,
      departments,
      announcements,
      storageItems,
    },
    finance: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      currency: "UGX",
    },
    attendance: { weeksTracked, latestTotal },
    branches: branchStats,
  });
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

  const items = [
    ...recentAnnouncements.map((a) => ({
      id: a.id,
      kind: "announcement",
      title: a.title,
      subtitle: null as string | null,
      occurredAt: a.createdAt.toISOString(),
    })),
    ...recentFinance.map((f) => ({
      id: f.id,
      kind: "finance",
      title: `${f.kind} — ${Number(f.amount).toLocaleString()} ${f.currency}`,
      subtitle: f.description ?? null,
      occurredAt: f.createdAt.toISOString(),
    })),
    ...recentAttendance.map((a) => ({
      id: a.id,
      kind: "attendance",
      title: a.title,
      subtitle: `${a.adultCount + a.youthCount + a.childrenCount} attended`,
      occurredAt: a.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 12);

  res.json(items);
});

export default router;
