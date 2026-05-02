import { useState } from "react";
import {
  useListPeople,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useListBranches,
  useListDepartments,
  getListPeopleQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetPublicSiteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { roleLabel } from "@/lib/format";
import { MediaUpload } from "@/components/media-upload";

type PersonRole = "pastor" | "minister" | "member" | "leader" | "finance_head" | "branch_head";

interface PersonForm {
  fullName: string;
  role: PersonRole;
  isLeader: boolean;
  branchId: number | null;
  departmentId: number | null;
  email: string;
  phone: string;
  bio: string;
  photoUrl: string;
}

const empty: PersonForm = {
  fullName: "",
  role: "member",
  isLeader: false,
  branchId: null,
  departmentId: null,
  email: "",
  phone: "",
  bio: "",
  photoUrl: "",
};

const CAN_EDIT_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
const CAN_DELETE_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head"];

export default function PeoplePage() {
  const auth = useAuth();
  const userRole = auth.user?.role ?? "member";
  const canEdit = CAN_EDIT_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);

  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<PersonRole | "all">("all");

  const { data: people } = useListPeople(
    roleFilter === "all"
      ? { search: search || undefined }
      : { role: roleFilter, search: search || undefined },
  );
  const { data: branches } = useListBranches();
  const { data: departments } = useListDepartments();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PersonForm>(empty);

  const create = useCreatePerson();
  const update = useUpdatePerson();
  const remove = useDeletePerson();

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(p: NonNullable<typeof people>[number]) {
    setEditingId(p.id);
    setForm({
      fullName: p.fullName,
      role: p.role as PersonRole,
      isLeader: p.isLeader,
      branchId: p.branchId,
      departmentId: p.departmentId,
      email: p.email ?? "",
      phone: p.phone ?? "",
      bio: p.bio ?? "",
      photoUrl: p.photoUrl ?? "",
    });
    setOpen(true);
  }

  async function invalidateAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListPeopleQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error("Full name is required"); return; }
    const payload = {
      fullName: form.fullName.trim(),
      role: form.role,
      isLeader: form.isLeader,
      branchId: form.branchId,
      departmentId: form.departmentId,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
    };
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, data: payload });
        toast.success("Person updated");
      } else {
        await create.mutateAsync({ data: payload });
        toast.success("Person added");
      }
      setOpen(false);
      await invalidateAll();
    } catch {
      toast.error("Could not save");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Remove this person from the directory?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Removed");
      await invalidateAll();
    } catch {
      toast.error("Could not delete");
    }
  }

  const isMemberView = userRole === "member" || userRole === "guest";

  return (
    <PortalLayout>
      <PortalHeader
        title="People"
        subtitle={isMemberView ? "Your church profile" : "Pastors, ministers and members of DCL"}
        actions={
          canEdit ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-person"
            >
              <Plus className="size-4 mr-1" />
              Add person
            </Button>
          ) : null
        }
      />

      {!isMemberView && (
        <div className="glass-strong rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(215,40%,40%)]" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/70 border-white/70"
              data-testid="input-search-people"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as PersonRole | "all")}
          >
            <SelectTrigger className="w-44 bg-white/70 border-white/70" data-testid="select-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="pastor">Pastors</SelectItem>
              <SelectItem value="minister">Ministers</SelectItem>
              <SelectItem value="leader">Leaders</SelectItem>
              <SelectItem value="member">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {people?.map((p) => {
          const branch = branches?.find((b) => b.id === p.branchId);
          const dept = departments?.find((d) => d.id === p.departmentId);
          return (
            <div key={p.id} className="glass rounded-2xl p-5" data-testid={`card-person-${p.id}`}>
              <div className="flex items-start gap-4">
                <Avatar className="size-14 ring-2 ring-white/80">
                  {p.photoUrl && <AvatarImage src={p.photoUrl} />}
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white font-serif">
                    {p.fullName.split(" ").filter((s) => !s.endsWith(".")).map((s) => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg text-[hsl(215,80%,22%)] truncate">{p.fullName}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge className="bg-white/70 text-[hsl(215,80%,28%)] border-0 text-[10px]">
                      {roleLabel(p.role)}
                    </Badge>
                    {p.isLeader && (
                      <Badge className="bg-[hsl(199,89%,53%)]/20 text-[hsl(199,89%,28%)] border-0 text-[10px]">
                        Leader
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 text-xs text-[hsl(215,40%,40%)] mt-3">
                {branch && <div>Branch: {branch.name}</div>}
                {dept && <div>Dept: {dept.name}</div>}
              </div>
              <div className="space-y-1 text-xs text-[hsl(215,40%,32%)] mt-2">
                {p.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3" />
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3" />
                    {p.phone}
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-1 mt-4">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="flex-1" data-testid={`button-edit-person-${p.id}`}>
                    <Pencil className="size-3.5 mr-1" /> Edit
                  </Button>
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)} className="text-rose-700" data-testid={`button-delete-person-${p.id}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {people && people.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-10 text-center text-[hsl(215,40%,40%)]">
            {isMemberView ? "No profile found for your email yet. Ask the admin to add you." : "No people found."}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingId ? "Edit person" : "Add person"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Ps. Samuel Mukasa"
                required
                data-testid="input-fullname"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as PersonRole })}>
                  <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="minister">Minister</SelectItem>
                    <SelectItem value="finance_head">Finance Head</SelectItem>
                    <SelectItem value="branch_head">Branch Head</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Is Leader">
                <div className="h-10 flex items-center gap-2 px-3 rounded-md border bg-white/50">
                  <Switch checked={form.isLeader} onCheckedChange={(v) => setForm({ ...form, isLeader: v })} data-testid="switch-isleader" />
                  <span className="text-sm">{form.isLeader ? "Yes" : "No"}</span>
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <Select value={form.branchId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, branchId: v === "none" ? null : Number(v) })}>
                  <SelectTrigger data-testid="select-branch"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {branches?.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department">
                <Select value={form.departmentId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, departmentId: v === "none" ? null : Number(v) })}>
                  <SelectTrigger data-testid="select-department"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {departments?.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
              </Field>
            </div>
            <Field label="Photo">
              <MediaUpload
                value={form.photoUrl || null}
                mediaType="image"
                onChange={(url) => setForm({ ...form, photoUrl: url })}
                onClear={() => setForm({ ...form, photoUrl: "" })}
                folder="people"
                accept="image"
                label="Upload photo"
              />
            </Field>
            <Field label="Bio">
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} data-testid="input-bio" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white" data-testid="button-save-person">
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
