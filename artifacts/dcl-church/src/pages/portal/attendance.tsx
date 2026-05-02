import { useState } from "react";
import {
  useListAttendanceServices,
  useCreateAttendanceService,
  useUpdateAttendanceService,
  useDeleteAttendanceService,
  useGetAttendanceSummary,
  useListBranches,
  getListAttendanceServicesQueryKey,
  getGetAttendanceSummaryQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDate, toDateInput } from "@/lib/format";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const RECORD_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
const DETAIL_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];

interface AttForm {
  title: string;
  branchId: number | null;
  serviceDate: string;
  adultCount: string;
  youthCount: string;
  childrenCount: string;
  notes: string;
}
const empty = (): AttForm => ({
  title: "Sunday Service",
  branchId: null,
  serviceDate: toDateInput(new Date()),
  adultCount: "0",
  youthCount: "0",
  childrenCount: "0",
  notes: "",
});

export default function AttendancePage() {
  const auth = useAuth();
  const role = auth.user?.role ?? "member";
  const canRecord = RECORD_ROLES.includes(role);
  const showDetail = DETAIL_ROLES.includes(role);

  const qc = useQueryClient();
  const { data: services } = useListAttendanceServices();
  const { data: summary } = useGetAttendanceSummary();
  const { data: branches } = useListBranches();
  const create = useCreateAttendanceService();
  const update = useUpdateAttendanceService();
  const remove = useDeleteAttendanceService();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AttForm>(empty());

  function openCreate() {
    setEditingId(null);
    setForm(empty());
    setOpen(true);
  }
  function openEdit(s: NonNullable<typeof services>[number]) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      branchId: s.branchId,
      serviceDate: toDateInput(s.serviceDate),
      adultCount: String(s.adultCount),
      youthCount: String(s.youthCount),
      childrenCount: String(s.childrenCount),
      notes: s.notes ?? "",
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListAttendanceServicesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetAttendanceSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title.trim() || "Service",
      branchId: form.branchId,
      serviceDate: form.serviceDate,
      adultCount: Number(form.adultCount) || 0,
      youthCount: Number(form.youthCount) || 0,
      childrenCount: Number(form.childrenCount) || 0,
      notes: form.notes.trim() || null,
    };
    try {
      if (editingId) await update.mutateAsync({ id: editingId, data: payload });
      else await create.mutateAsync({ data: payload });
      toast.success("Saved");
      setOpen(false);
      await invalidate();
    } catch { toast.error("Could not save"); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this attendance record?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Deleted");
      await invalidate();
    } catch { toast.error("Could not delete"); }
  }

  const trend = (summary?.byWeek ?? [])
    .slice(-8)
    .map((r) => ({ week: r.week, total: r.total }));

  const thisWeekServices = (services ?? []).filter((s) => {
    const d = new Date(s.serviceDate + "T00:00:00Z");
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getUTCDay();
    startOfWeek.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setUTCHours(0, 0, 0, 0);
    return d >= startOfWeek;
  });

  const thisWeekTotal = thisWeekServices.reduce(
    (acc, s) => acc + s.adultCount + s.youthCount + s.childrenCount, 0
  );

  return (
    <PortalLayout>
      <PortalHeader
        title="Attendance"
        subtitle={showDetail ? "Full attendance records" : "This week's attendance"}
        actions={
          canRecord ? (
            <Button onClick={openCreate} className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md" data-testid="button-add-attendance">
              <Plus className="size-4 mr-1" /> Record service
            </Button>
          ) : null
        }
      />

      {/* Current week summary — visible to all non-guests */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-strong rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-[hsl(215,40%,40%)] mb-1 flex items-center gap-1">
            <Calendar className="size-3" /> This week
          </div>
          <div className="font-serif text-3xl text-[hsl(215,80%,22%)]">{thisWeekTotal}</div>
          <div className="text-xs text-[hsl(215,40%,50%)]">total attendance</div>
        </div>
        <div className="glass-strong rounded-2xl p-4">
          <div className="text-xs text-[hsl(215,40%,40%)] mb-1">Services</div>
          <div className="font-serif text-2xl text-[hsl(215,80%,22%)]">{thisWeekServices.length}</div>
          <div className="text-xs text-[hsl(215,40%,50%)]">this week</div>
        </div>
        {showDetail && (
          <>
            <div className="glass-strong rounded-2xl p-4">
              <div className="text-xs text-[hsl(215,40%,40%)] mb-1">Total adults</div>
              <div className="font-serif text-2xl text-[hsl(215,80%,22%)]">{summary?.totalAdults ?? 0}</div>
              <div className="text-xs text-[hsl(215,40%,50%)]">all time</div>
            </div>
            <div className="glass-strong rounded-2xl p-4">
              <div className="text-xs text-[hsl(215,40%,40%)] mb-1">Grand total</div>
              <div className="font-serif text-2xl text-[hsl(215,80%,22%)]">{summary?.grandTotal ?? 0}</div>
              <div className="text-xs text-[hsl(215,40%,50%)]">all time</div>
            </div>
          </>
        )}
      </div>

      {/* This week's services — all members can see */}
      <div className="glass-strong rounded-2xl p-4 mb-6">
        <h3 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-3">
          {showDetail ? "All services" : "This week's services"}
        </h3>
        {thisWeekServices.length === 0 && (
          <p className="text-sm text-[hsl(215,40%,40%)]">No services recorded this week yet.</p>
        )}
        <div className="space-y-2">
          {(showDetail ? services : thisWeekServices)?.map((s) => {
            const branch = branches?.find((b) => b.id === s.branchId);
            const total = s.adultCount + s.youthCount + s.childrenCount;
            return (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/30 last:border-0" data-testid={`row-att-${s.id}`}>
                <div>
                  <div className="font-medium text-sm text-[hsl(215,80%,22%)]">{s.title}</div>
                  <div className="text-xs text-[hsl(215,40%,40%)]">
                    {formatDate(s.serviceDate)}{branch ? ` • ${branch.name}` : ""}
                  </div>
                  {showDetail && (
                    <div className="text-xs text-[hsl(215,40%,50%)] mt-0.5">
                      Adults: {s.adultCount} · Youth: {s.youthCount} · Children: {s.childrenCount}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white border-0">
                    <Users className="size-3 mr-1" /> {total}
                  </Badge>
                  {canRecord && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)} data-testid={`button-edit-att-${s.id}`}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)} className="text-rose-700" data-testid={`button-delete-att-${s.id}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full analytics — portal roles only */}
      {showDetail && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-strong rounded-2xl p-5 lg:col-span-2">
            <h3 className="font-serif text-lg text-[hsl(215,80%,22%)]">Weekly trend</h3>
            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(199,89%,53%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(199,89%,53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="hsl(215,80%,32%)" strokeWidth={2.5} fill="url(#att)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-serif text-lg text-[hsl(215,80%,22%)]">By branch</h3>
            <div className="space-y-3 mt-4">
              {(summary?.byBranch ?? []).map((b) => (
                <div key={b.branchId} className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(215,40%,30%)]">{b.branchName ?? "Main"}</span>
                  <span className="font-serif text-[hsl(215,80%,22%)] text-lg">{b.total}</span>
                </div>
              ))}
              {(summary?.byBranch?.length ?? 0) === 0 && (
                <div className="text-sm text-[hsl(215,40%,40%)]">No data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Edit service" : "Record service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-att-title" />
              </Field>
              <Field label="Date">
                <Input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} required data-testid="input-att-date" />
              </Field>
            </div>
            <Field label="Branch">
              <Select value={form.branchId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, branchId: v === "none" ? null : Number(v) })}>
                <SelectTrigger data-testid="select-att-branch"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {branches?.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Adults">
                <Input type="number" min="0" value={form.adultCount} onChange={(e) => setForm({ ...form, adultCount: e.target.value })} data-testid="input-att-adults" />
              </Field>
              <Field label="Youth">
                <Input type="number" min="0" value={form.youthCount} onChange={(e) => setForm({ ...form, youthCount: e.target.value })} data-testid="input-att-youth" />
              </Field>
              <Field label="Children">
                <Input type="number" min="0" value={form.childrenCount} onChange={(e) => setForm({ ...form, childrenCount: e.target.value })} data-testid="input-att-children" />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} data-testid="input-att-notes" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white" disabled={create.isPending || update.isPending} data-testid="button-save-att">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PortalLayout>
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
