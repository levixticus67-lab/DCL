import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, attendanceServicesTable } from "@workspace/db";
import {
  ListAttendanceServicesResponse,
  CreateAttendanceServiceBody,
  UpdateAttendanceServiceBody,
  UpdateAttendanceServiceResponse,
  GetAttendanceSummaryResponse,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireAttendanceRecord,
  requireNotGuest,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

const DETAIL_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];

router.get("/attendance/current-week", requireNotGuest, async (_req, res) => {
  const { monday, sunday } = currentWeekRange();
  const rows = await db
    .select()
    .from(attendanceServicesTable)
    .where(
      and(
        gte(attendanceServicesTable.serviceDate, monday),
        lte(attendanceServicesTable.serviceDate, sunday),
      ),
    );
  const total = rows.reduce(
    (acc, r) => acc + r.adultCount + r.youthCount + r.childrenCount,
    0,
  );
  const services = rows.length;
  res.json({ week: monday, total, services });
});

router.get("/attendance/services", requireAuth, async (req, res) => {
  const role = req.user?.role ?? "member";
  const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;

  if (role === "member" || role === "guest") {
    const { monday, sunday } = currentWeekRange();
    const filters = [
      gte(attendanceServicesTable.serviceDate, monday),
      lte(attendanceServicesTable.serviceDate, sunday),
    ] as ReturnType<typeof eq>[];
    if (branchId) filters.push(eq(attendanceServicesTable.branchId, branchId));

    const rows = await db
      .select()
      .from(attendanceServicesTable)
      .where(and(...filters))
      .orderBy(desc(attendanceServicesTable.serviceDate));
    res.json(ListAttendanceServicesResponse.parse(rows.map(serialize)));
    return;
  }

  const filters = branchId ? [eq(attendanceServicesTable.branchId, branchId)] : [];
  const rows = await db
    .select()
    .from(attendanceServicesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(attendanceServicesTable.serviceDate));
  res.json(ListAttendanceServicesResponse.parse(rows.map(serialize)));
});

router.post("/attendance/services", requireAttendanceRecord, async (req, res) => {
  const body = CreateAttendanceServiceBody.parse(req.body);
  const [row] = await db
    .insert(attendanceServicesTable)
    .values({ ...body, serviceDate: toDateOnly(body.serviceDate) })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch("/attendance/services/:id", requireAttendanceRecord, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateAttendanceServiceBody.parse(req.body);
  const { serviceDate, ...rest } = body;
  const update: Record<string, unknown> = { ...rest };
  if (serviceDate !== undefined) update.serviceDate = toDateOnly(serviceDate);
  const [row] = await db
    .update(attendanceServicesTable)
    .set(update)
    .where(eq(attendanceServicesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateAttendanceServiceResponse.parse(serialize(row)));
});

router.delete("/attendance/services/:id", requireAttendanceRecord, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(attendanceServicesTable).where(eq(attendanceServicesTable.id, id));
  res.status(204).send();
});

router.get("/attendance/summary", requireNotGuest, async (req, res) => {
  const role = req.user?.role ?? "member";
  const rows = await db.select().from(attendanceServicesTable);

  const byBranchMap = new Map<number | "unassigned", number>();
  const byWeekMap = new Map<string, number>();
  let totalAdults = 0;
  let totalYouth = 0;
  let totalChildren = 0;

  const { monday } = currentWeekRange();

  const filteredRows = role === "member"
    ? rows.filter((r) => String(r.serviceDate) >= monday)
    : rows;

  for (const r of filteredRows) {
    const total = r.adultCount + r.youthCount + r.childrenCount;
    totalAdults += r.adultCount;
    totalYouth += r.youthCount;
    totalChildren += r.childrenCount;
    const bk = r.branchId ?? "unassigned";
    byBranchMap.set(bk, (byBranchMap.get(bk) ?? 0) + total);
    const week = weekKey(String(r.serviceDate));
    byWeekMap.set(week, (byWeekMap.get(week) ?? 0) + total);
  }

  res.json(
    GetAttendanceSummaryResponse.parse({
      totalAdults,
      totalYouth,
      totalChildren,
      grandTotal: totalAdults + totalYouth + totalChildren,
      byBranch: Array.from(byBranchMap.entries()).map(([branchId, total]) => ({
        branchId: branchId === "unassigned" ? null : branchId,
        total,
      })),
      byWeek: Array.from(byWeekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, total]) => ({ week, total })),
    }),
  );
});

function currentWeekRange(): { monday: string; sunday: string } {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
  };
}

function weekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  const monday = new Date(d);
  monday.setUTCDate(diff);
  return monday.toISOString().slice(0, 10);
}

function serialize(row: typeof attendanceServicesTable.$inferSelect) {
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
