import { useState } from "react";
import {
  useListFinanceTransactions,
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
  useGetFinanceSummary,
  useListBranches,
  getListFinanceTransactionsQueryKey,
  getGetFinanceSummaryQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, toDateInput } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Kind =
  | "tithe"
  | "offering"
  | "pledge"
  | "donation"
  | "expense"
  | "other_income";

const KIND_LABELS: Record<Kind, string> = {
  tithe: "Tithe",
  offering: "Offering",
  pledge: "Pledge",
  donation: "Donation",
  expense: "Expense",
  other_income: "Other income",
};

interface FinForm {
  kind: Kind;
  amount: string;
  branchId: number | null;
  occurredOn: string;
  description: string;
}
const empty = (): FinForm => ({
  kind: "tithe",
  amount: "",
  branchId: null,
  occurredOn: toDateInput(new Date()),
  description: "",
});

export default function FinancePage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data: txns } = useListFinanceTransactions();
  const { data: summary } = useGetFinanceSummary();
  const { data: branches } = useListBranches();
  const create = useCreateFinanceTransaction();
  const update = useUpdateFinanceTransaction();
  const remove = useDeleteFinanceTransaction();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FinForm>(empty());

  function openCreate() {
    setEditingId(null);
    setForm(empty());
    setOpen(true);
  }
  function openEdit(t: NonNullable<typeof txns>[number]) {
    setEditingId(t.id);
    setForm({
      kind: t.kind,
      amount: String(t.amount),
      branchId: t.branchId,
      occurredOn: toDateInput(t.occurredOn),
      description: t.description ?? "",
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListFinanceTransactionsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    const payload = {
      kind: form.kind,
      amount: amt,
      branchId: form.branchId,
      occurredOn: form.occurredOn,
      description: form.description.trim() || null,
    };
    try {
      if (editingId) await update.mutateAsync({ id: editingId, data: payload });
      else await create.mutateAsync({ data: payload });
      toast.success("Saved");
      setOpen(false);
      await invalidate();
    } catch {
      toast.error("Could not save");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Deleted");
      await invalidate();
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="Finance"
        subtitle="Tithes, offerings, donations and expenses"
        actions={
          editable ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-transaction"
            >
              <Plus className="size-4 mr-1" />
              New transaction
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryTile
          icon={<TrendingUp />}
          label="Income"
          value={formatCurrency(summary?.totalIncome ?? 0, summary?.currency)}
          tone="positive"
        />
        <SummaryTile
          icon={<TrendingDown />}
          label="Expense"
          value={formatCurrency(summary?.totalExpense ?? 0, summary?.currency)}
          tone="negative"
        />
        <SummaryTile
          icon={<Wallet />}
          label="Balance"
          value={formatCurrency(summary?.balance ?? 0, summary?.currency)}
          tone="primary"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Monthly income vs expense">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(199,89%,45%)"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(0,75%,55%)"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="By branch">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.byBranch ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="branchName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="hsl(199,89%,53%)" radius={[6,6,0,0]} />
                <Bar dataKey="expense" fill="hsl(0,75%,60%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="glass-strong rounded-2xl p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {editable && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns?.map((t) => {
              const branch = branches?.find((b) => b.id === t.branchId);
              const isExpense = t.kind === "expense";
              return (
                <TableRow key={t.id} data-testid={`row-txn-${t.id}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(t.occurredOn)}
                  </TableCell>
                  <TableCell>{KIND_LABELS[t.kind]}</TableCell>
                  <TableCell className="text-xs">
                    {branch?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">
                    {t.description ?? "—"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium whitespace-nowrap ${
                      isExpense ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatCurrency(t.amount, t.currency)}
                  </TableCell>
                  {editable && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(t)}
                          data-testid={`button-edit-txn-${t.id}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(t.id)}
                          className="text-rose-700"
                          data-testid={`button-delete-txn-${t.id}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit transaction" : "New transaction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kind">
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v as Kind })}
                >
                  <SelectTrigger data-testid="select-fin-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (UGX)">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  required
                  data-testid="input-fin-amount"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <Select
                  value={form.branchId?.toString() ?? "none"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      branchId: v === "none" ? null : Number(v),
                    })
                  }
                >
                  <SelectTrigger data-testid="select-fin-branch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={form.occurredOn}
                  onChange={(e) =>
                    setForm({ ...form, occurredOn: e.target.value })
                  }
                  required
                  data-testid="input-fin-date"
                />
              </Field>
            </div>
            <Field label="Description">
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                data-testid="input-fin-description"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white"
                disabled={create.isPending || update.isPending}
                data-testid="button-save-txn"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "positive" | "negative" | "primary";
}) {
  const colors = {
    positive: "from-emerald-500 to-teal-500",
    negative: "from-rose-500 to-orange-500",
    primary: "from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)]",
  };
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div
        className={`size-10 rounded-xl bg-gradient-to-br ${colors[tone]} text-white grid place-items-center mb-3`}
      >
        {icon}
      </div>
      <div className="text-xs uppercase tracking-widest text-[hsl(215,40%,40%)]">
        {label}
      </div>
      <div className="font-serif text-2xl text-[hsl(215,80%,22%)] mt-1">
        {value}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-[hsl(215,40%,28%)]">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
