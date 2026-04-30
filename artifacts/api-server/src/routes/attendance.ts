import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, attendanceServicesTable } from "@workspace/db";
import {
  ListAttendanceServicesResponse,
  CreateAttendanceServiceBody,
  UpdateAttendanceServiceBody,
  UpdateAttendanceServiceResponse,
  GetAttendanceSummaryResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/attendance/services", requireAuth, async (req, res) => {
  const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
  const filters = branchId
    ? [eq(attendanceServicesTable.branchId, branchId)]
    : [];
  const rows = await db
    .select()
    .from(attendanceServicesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(attendanceServicesTable.serviceDate));
  res.json(ListAttendanceServicesResponse.parse(rows.map(serialize)));
});

router.post("/attendance/services", requireAdmin, async (req, res) => {
  const body = CreateAttendanceServiceBody.parse(req.body);
  const [row] = await db
    .insert(attendanceServicesTable)
    .values({ ...body, serviceDate: toDateOnly(body.serviceDate) })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch("/attendance/services/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateAttendanceServiceBody.parse(req.body);
  const { serviceDate, ...rest } = body;
  const update: Record<string, unknown> = { ...rest };
  if (serviceDate !== undefined)
    update.serviceDate = toDateOnly(serviceDate);
  const [row] = await db
    .update(attendanceServicesTable)
    .set(update)
    .where(eq(attendanceServicesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateAttendanceServiceResponse.parse(serialize(row)));
});

router.delete("/attendance/services/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(attendanceServicesTable)
    .where(eq(attendanceServicesTable.id, id));
  res.status(204).send();
});

router.get("/attendance/summary", requireAuth, async (_req, res) => {
  const rows = await db.select().from(attendanceServicesTable);
  const byBranchMap = new Map<number | "unassigned", number>();
  const byWeekMap = new Map<string, number>();
  let totalAdults = 0;
  let totalYouth = 0;
  let totalChildren = 0;
  for (const r of rows) {
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
