import { useState } from "react";
import {
  useListStorageItems,
  useCreateStorageItem,
  useUpdateStorageItem,
  useDeleteStorageItem,
  getListStorageItemsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

interface StorForm {
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  description: string;
}
const empty: StorForm = {
  title: "",
  category: "Documents",
  fileUrl: "",
  fileType: "",
  description: "",
};

export default function StoragePage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data: items } = useListStorageItems();
  const create = useCreateStorageItem();
  const update = useUpdateStorageItem();
  const remove = useDeleteStorageItem();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StorForm>(empty);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(it: NonNullable<typeof items>[number]) {
    setEditingId(it.id);
    setForm({
      title: it.title,
      category: it.category,
      fileUrl: it.fileUrl,
      fileType: it.fileType ?? "",
      description: it.description ?? "",
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListStorageItemsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.fileUrl.trim()) {
      toast.error("Title and file URL required");
      return;
    }
    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || "Other",
      fileUrl: form.fileUrl.trim(),
      fileType: form.fileType.trim() || null,
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
    if (!confirm("Delete this item?")) return;
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
        title="Storage"
        subtitle="Documents, sermon notes and resources"
        actions={
          editable ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-storage"
            >
              <Plus className="size-4 mr-1" />
              Add item
            </Button>
          ) : null
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.map((it) => (
          <div
            key={it.id}
            className="glass-strong rounded-2xl p-5"
            data-testid={`card-storage-${it.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white flex-shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base text-[hsl(215,80%,22%)] truncate">
                  {it.title}
                </h3>
                <Badge className="mt-1 bg-white/70 text-[hsl(215,80%,28%)] border-0 text-[10px]">
                  {it.category}
                </Badge>
              </div>
            </div>
            {it.description && (
              <p className="mt-3 text-xs text-[hsl(215,40%,32%)] line-clamp-2">
                {it.description}
              </p>
            )}
            <div className="text-[11px] text-[hsl(215,40%,45%)] mt-2">
              Added {formatDate(it.createdAt)}
            </div>
            <div className="flex gap-1 mt-4">
              <a
                href={it.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
                data-testid={`link-open-${it.id}`}
              >
                <Button size="sm" variant="ghost" className="w-full">
                  <ExternalLink className="size-3.5 mr-1" />
                  Open
                </Button>
              </a>
              {editable && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(it)}
                    data-testid={`button-edit-storage-${it.id}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(it.id)}
                    className="text-rose-700"
                    data-testid={`button-delete-storage-${it.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {items && items.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-10 text-center text-[hsl(215,40%,40%)]">
            <FolderOpen className="size-10 mx-auto mb-3 opacity-50" />
            No files stored yet.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit item" : "Add item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                data-testid="input-stor-title"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  list="storage-categories"
                  data-testid="input-stor-category"
                />
                <datalist id="storage-categories">
                  <option value="Documents" />
                  <option value="Sermon Notes" />
                  <option value="Reports" />
                  <option value="Photos" />
                  <option value="Audio" />
                  <option value="Video" />
                </datalist>
              </Field>
              <Field label="File type">
                <Input
                  value={form.fileType}
                  onChange={(e) =>
                    setForm({ ...form, fileType: e.target.value })
                  }
                  placeholder="application/pdf"
                  data-testid="input-stor-type"
                />
              </Field>
            </div>
            <Field label="File URL">
              <Input
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://..."
                required
                data-testid="input-stor-url"
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                data-testid="input-stor-description"
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
                data-testid="button-save-storage"
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
