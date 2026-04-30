import { useState } from "react";
import {
  useListBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  getListBranchesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetPublicSiteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Phone, Mail, UserCircle } from "lucide-react";
import { toast } from "sonner";

interface BranchForm {
  name: string;
  isMain: boolean;
  location: string;
  pastorInChargeName: string;
  contactPhone: string;
  contactEmail: string;
}
const empty: BranchForm = {
  name: "",
  isMain: false,
  location: "",
  pastorInChargeName: "",
  contactPhone: "",
  contactEmail: "",
};

export default function BranchesPage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data: branches } = useListBranches();
  const create = useCreateBranch();
  const update = useUpdateBranch();
  const remove = useDeleteBranch();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BranchForm>(empty);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(b: NonNullable<typeof branches>[number]) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      isMain: b.isMain,
      location: b.location,
      pastorInChargeName: b.pastorInChargeName ?? "",
      contactPhone: b.contactPhone ?? "",
      contactEmail: b.contactEmail ?? "",
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListBranchesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      isMain: form.isMain,
      location: form.location.trim(),
      pastorInChargeName: form.pastorInChargeName.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
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
    if (!confirm("Remove this branch?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Removed");
      await invalidate();
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="Branches"
        subtitle="Manage all DCL locations"
        actions={
          editable ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-branch"
            >
              <Plus className="size-4 mr-1" />
              Add branch
            </Button>
          ) : null
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches?.map((b) => (
          <div
            key={b.id}
            className="glass-strong rounded-2xl p-6"
            data-testid={`card-branch-${b.id}`}
          >
            {b.isMain && (
              <Badge className="mb-3 bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white border-0">
                Main Branch
              </Badge>
            )}
            <h3 className="font-serif text-xl text-[hsl(215,80%,22%)]">
              {b.name}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-[hsl(215,40%,30%)]">
              {b.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                  {b.location}
                </div>
              )}
              {b.pastorInChargeName && (
                <div className="flex items-center gap-2">
                  <UserCircle className="size-4" />
                  {b.pastorInChargeName}
                </div>
              )}
              {b.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {b.contactPhone}
                </div>
              )}
              {b.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span className="break-all">{b.contactEmail}</span>
                </div>
              )}
            </div>
            {editable && (
              <div className="flex gap-1 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(b)}
                  className="flex-1"
                  data-testid={`button-edit-branch-${b.id}`}
                >
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </Button>
                {!b.isMain && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(b.id)}
                    className="text-rose-700"
                    data-testid={`button-delete-branch-${b.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingId ? "Edit branch" : "Add branch"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-testid="input-branch-name"
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                data-testid="input-location"
              />
            </Field>
            <Field label="Pastor in charge">
              <Input
                value={form.pastorInChargeName}
                onChange={(e) =>
                  setForm({ ...form, pastorInChargeName: e.target.value })
                }
                data-testid="input-pastor"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <Input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  data-testid="input-branch-phone"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  data-testid="input-branch-email"
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white/50">
              <Switch
                checked={form.isMain}
                onCheckedChange={(v) => setForm({ ...form, isMain: v })}
                data-testid="switch-ismain"
              />
              <span className="text-sm">This is the main branch</span>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white"
                disabled={create.isPending || update.isPending}
                data-testid="button-save-branch"
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-[hsl(215,40%,28%)]">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
