import { useState } from "react";
import {
  useListAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useListBranches,
  getListAnnouncementsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetPublicSiteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Pin, Eye, EyeOff, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

type MediaType = "image" | "video" | "audio" | null;

interface AnnForm {
  title: string;
  body: string;
  mediaUrl: string;
  mediaType: MediaType;
  isPublic: boolean;
  isPinned: boolean;
  branchId: number | null;
}
const empty: AnnForm = {
  title: "",
  body: "",
  mediaUrl: "",
  mediaType: null,
  isPublic: true,
  isPinned: false,
  branchId: null,
};

export default function AnnouncementsPortalPage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data } = useListAnnouncements();
  const { data: branches } = useListBranches();
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const remove = useDeleteAnnouncement();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnForm>(empty);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(a: NonNullable<typeof data>[number]) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      mediaUrl: a.mediaUrl ?? "",
      mediaType: a.mediaType ?? null,
      isPublic: a.isPublic,
      isPinned: a.isPinned,
      branchId: a.branchId,
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body required");
      return;
    }
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      mediaUrl: form.mediaUrl.trim() || null,
      mediaType: form.mediaUrl.trim() ? form.mediaType : null,
      isPublic: form.isPublic,
      isPinned: form.isPinned,
      branchId: form.branchId,
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
    if (!confirm("Delete this announcement?")) return;
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
        title="Announcements"
        subtitle="Share news, events and updates with the church"
        actions={
          editable ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-announcement"
            >
              <Plus className="size-4 mr-1" />
              New announcement
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        {data?.map((a) => (
          <div
            key={a.id}
            className="glass-strong rounded-2xl p-6"
            data-testid={`card-announcement-${a.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[hsl(215,40%,40%)]">
                  <Calendar className="size-3.5" />
                  {formatDate(a.createdAt)}
                  {a.isPinned && (
                    <Badge className="bg-[hsl(199,89%,53%)]/15 text-[hsl(199,89%,28%)] border-0">
                      <Pin className="size-3 mr-1" /> Pinned
                    </Badge>
                  )}
                  {a.isPublic ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-0">
                      <Eye className="size-3 mr-1" /> Public
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-0">
                      <EyeOff className="size-3 mr-1" /> Internal
                    </Badge>
                  )}
                </div>
                <h3 className="font-serif text-xl mt-1.5 text-[hsl(215,80%,22%)]">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm text-[hsl(215,40%,30%)] whitespace-pre-line">
                  {a.body}
                </p>
                {a.mediaUrl && a.mediaType === "image" && (
                  <img
                    src={a.mediaUrl}
                    alt={a.title}
                    className="mt-3 rounded-xl max-h-64"
                  />
                )}
              </div>
              {editable && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(a)}
                    data-testid={`button-edit-announcement-${a.id}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(a.id)}
                    className="text-rose-700"
                    data-testid={`button-delete-announcement-${a.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit announcement" : "New announcement"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                data-testid="input-ann-title"
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={5}
                required
                data-testid="input-ann-body"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Media URL">
                <Input
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm({ ...form, mediaUrl: e.target.value })
                  }
                  placeholder="https://..."
                  data-testid="input-ann-mediaurl"
                />
              </Field>
              <Field label="Media type">
                <Select
                  value={form.mediaType ?? "none"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      mediaType: v === "none" ? null : (v as MediaType),
                    })
                  }
                >
                  <SelectTrigger data-testid="select-ann-mediatype">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Branch (optional)">
              <Select
                value={form.branchId?.toString() ?? "all"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    branchId: v === "all" ? null : Number(v),
                  })
                }
              >
                <SelectTrigger data-testid="select-ann-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white/50">
                <Switch
                  checked={form.isPublic}
                  onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
                  data-testid="switch-ann-public"
                />
                <span className="text-sm">Show on public site</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white/50">
                <Switch
                  checked={form.isPinned}
                  onCheckedChange={(v) => setForm({ ...form, isPinned: v })}
                  data-testid="switch-ann-pinned"
                />
                <span className="text-sm">Pin to top</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white"
                disabled={create.isPending || update.isPending}
                data-testid="button-save-announcement"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-[hsl(215,40%,28%)]">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
