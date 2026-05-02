import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, financeTransactionsTable } from "@workspace/db";
import {
  ListFinanceTransactionsResponse,
  CreateFinanceTransactionBody,
  UpdateFinanceTransactionBody,
  UpdateFinanceTransactionResponse,
  GetFinanceSummaryResponse,
} from "@workspace/api-zod";
import { requireFinanceAccess, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/finance/transactions", requireAuth, async (req, res) => {
  const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
  const kind = req.query.kind as string | undefined;
  const filters = [] as ReturnType<typeof eq>[];
  if (branchId) filters.push(eq(financeTransactionsTable.branchId, branchId));
  if (kind) filters.push(eq(financeTransactionsTable.kind, kind));
  const rows = await db
    .select()
    .from(financeTransactionsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(financeTransactionsTable.occurredOn));
  res.json(ListFinanceTransactionsResponse.parse(rows.map(serialize)));
});

router.post("/finance/transactions", requireFinanceAccess, async (req, res) => {
  const body = CreateFinanceTransactionBody.parse(req.body);
  const [row] = await db
    .insert(financeTransactionsTable)
    .values({
      ...body,
      amount: String(body.amount),
      occurredOn: toDateOnly(body.occurredOn),
    })
    .returning();
  res.status(201).json(serialize(row));
});

router.patch(
  "/finance/transactions/:id",
  requireFinanceAccess,
  async (req, res) => {
    const id = Number(req.params.id);
    const body = UpdateFinanceTransactionBody.parse(req.body);
    const { amount, occurredOn, ...rest } = body;
    const update: Record<string, unknown> = { ...rest };
    if (amount !== undefined) update.amount = String(amount);
    if (occurredOn !== undefined) update.occurredOn = toDateOnly(occurredOn);
    const [row] = await db
      .update(financeTransactionsTable)
      .set(update)
      .where(eq(financeTransactionsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(UpdateFinanceTransactionResponse.parse(serialize(row)));
  },
);

router.delete(
  "/finance/transactions/:id",
  requireFinanceAccess,
  async (req, res) => {
    const id = Number(req.params.id);
    await db
      .delete(financeTransactionsTable)
      .where(eq(financeTransactionsTable.id, id));
    res.status(204).send();
  },
);

router.get("/finance/summary", requireAuth, async (_req, res) => {
  const allRows = await db.select().from(financeTransactionsTable);
  const expenseKinds = new Set(["expense"]);
  let totalIncome = 0;
  let totalExpenses = 0;
  const byKindMap = new Map<string, number>();
  const byBranchMap = new Map<number | "unassigned", number>();
  const byMonthMap = new Map<string, { income: number; expense: number }>();
  for (const r of allRows) {
    const amt = Number(r.amount);
    if (expenseKinds.has(r.kind)) totalExpenses += amt;
    else totalIncome += amt;
    byKindMap.set(r.kind, (byKindMap.get(r.kind) ?? 0) + amt);
    const branchKey = r.branchId ?? "unassigned";
    byBranchMap.set(branchKey, (byBranchMap.get(branchKey) ?? 0) + amt);
    const month = String(r.occurredOn).slice(0, 7);
    const cur = byMonthMap.get(month) ?? { income: 0, expense: 0 };
    if (expenseKinds.has(r.kind)) cur.expense += amt;
    else cur.income += amt;
    byMonthMap.set(month, cur);
  }
  res.json(
    GetFinanceSummaryResponse.parse({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currency: "UGX",
      byKind: Array.from(byKindMap.entries()).map(([kind, total]) => ({
        kind,
        total,
      })),
      byBranch: Array.from(byBranchMap.entries()).map(([branchId, total]) => ({
        branchId: branchId === "unassigned" ? null : branchId,
        total,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, income: v.income, expense: v.expense })),
    }),
  );
});

function serialize(row: typeof financeTransactionsTable.$inferSelect) {
  return {
    ...row,
    amount: Number(row.amount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDateOnly(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

void sql;
export default router;
