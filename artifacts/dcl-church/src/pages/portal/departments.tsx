import { useState } from "react";
import {
  useListDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useListBranches,
  useListPeople,
  getListDepartmentsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Boxes, Users } from "lucide-react";
import { toast } from "sonner";

const CAN_MANAGE_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head"];

interface DeptForm {
  name: string;
  description: string;
  branchId: number | null;
  leaderId: number | null;
}
const empty: DeptForm = { name: "", description: "", branchId: null, leaderId: null };

export default function DepartmentsPage() {
  const auth = useAuth();
  const role = auth.user?.role ?? "member";
  const canManage = CAN_MANAGE_ROLES.includes(role);

  const qc = useQueryClient();
  const { data: departments } = useListDepartments();
  const { data: branches } = useListBranches();
  const { data: people } = useListPeople();
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const remove = useDeleteDepartment();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DeptForm>(empty);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(d: NonNullable<typeof departments>[number]) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      description: d.description ?? "",
      branchId: d.branchId,
      leaderId: d.leaderId,
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      branchId: form.branchId,
      leaderId: form.leaderId,
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
    if (!confirm("Remove this department?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Removed");
      await invalidate();
    } catch { toast.error("Could not delete"); }
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="Departments"
        subtitle="Ministries and groups within DCL"
        actions={
          canManage ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-department"
            >
              <Plus className="size-4 mr-1" /> Add department
            </Button>
          ) : null
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments?.map((d) => {
          const branch = branches?.find((b) => b.id === d.branchId);
          const leader = people?.find((p) => p.id === d.leaderId);
          const memberCount = (people ?? []).filter((p) => p.departmentId === d.id).length;

          return (
            <div key={d.id} className="glass-strong rounded-2xl p-6" data-testid={`card-department-${d.id}`}>
              <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white mb-3">
                <Boxes className="size-5" />
              </div>
              <h3 className="font-serif text-lg text-[hsl(215,80%,22%)]">{d.name}</h3>
              {d.description && (
                <p className="mt-2 text-sm text-[hsl(215,40%,32%)]">{d.description}</p>
              )}
              <div className="mt-3 text-xs text-[hsl(215,40%,40%)] space-y-1">
                {branch && <div>Branch: {branch.name}</div>}
                {leader && <div>Leader: {leader.fullName}</div>}
                <div className="flex items-center gap-1">
                  <Users className="size-3" />
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </div>
              </div>

              {canManage && (
                <div className="flex gap-1 mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(d)}
                    className="flex-1"
                    data-testid={`button-edit-department-${d.id}`}
                  >
                    <Pencil className="size-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(d.id)}
                    className="text-rose-700"
                    data-testid={`button-delete-department-${d.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {departments && departments.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-10 text-center text-[hsl(215,40%,40%)]">
            No departments yet.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit department" : "Add department"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-dept-name" />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} data-testid="input-dept-description" />
            </Field>
            <Field label="Branch">
              <Select value={form.branchId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, branchId: v === "none" ? null : Number(v) })}>
                <SelectTrigger data-testid="select-dept-branch"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {branches?.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Department Head / Leader">
              <Select value={form.leaderId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, leaderId: v === "none" ? null : Number(v) })}>
                <SelectTrigger data-testid="select-dept-leader"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {people?.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white" disabled={create.isPending || update.isPending} data-testid="button-save-dept">
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
