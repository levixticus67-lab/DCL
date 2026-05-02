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
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, FileText, ExternalLink, FolderOpen,
  Search, Image, Video, Music, File, SortAsc, SortDesc,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { MediaUpload, type MediaKind } from "@/components/media-upload";

const CATEGORIES = [
  "Sermons", "Sermon Notes", "Events", "Reports", "Finance Reports",
  "Photos", "Videos", "Audio", "Documents", "Bulletins", "Minutes", "Other",
];

const CAN_ADD_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];
const CAN_EDIT_ROLES = ["main_admin", "pastor", "minister", "finance_head", "branch_head", "leader"];

interface StorForm {
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  mediaKind: MediaKind | null;
  description: string;
}
const empty: StorForm = {
  title: "",
  category: "Documents",
  fileUrl: "",
  fileType: "",
  mediaKind: null,
  description: "",
};

export default function StoragePage() {
  const auth = useAuth();
  const role = auth.user?.role ?? "member";
  const canAdd = CAN_ADD_ROLES.includes(role);
  const canEdit = CAN_EDIT_ROLES.includes(role);
  const canDelete = role === "main_admin";

  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const { data: items } = useListStorageItems({ category: categoryFilter === "all" ? undefined : categoryFilter });
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
      mediaKind: (it.fileType?.startsWith("image") ? "image" : it.fileType?.startsWith("video") ? "video" : it.fileType?.startsWith("audio") ? "audio" : null),
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
    if (!form.title.trim() || !form.fileUrl.trim()) { toast.error("Title and file are required"); return; }
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
    } catch { toast.error("Could not save"); }
  }

  async function onDelete(id: number) {
    if (!confirm("Permanently delete this file from storage?")) return;
    try {
      await remove.mutateAsync({ id });
      toast.success("Deleted");
      await invalidate();
    } catch { toast.error("Could not delete"); }
  }

  const filtered = (items ?? [])
    .filter((it) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return it.title.toLowerCase().includes(q) || (it.description ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "title") cmp = a.title.localeCompare(b.title);
      else if (sortBy === "category") cmp = a.category.localeCompare(b.category);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

  const grouped = CATEGORIES.reduce<Record<string, typeof filtered>>((acc, cat) => {
    const items = filtered.filter((it) => it.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  const otherItems = filtered.filter((it) => !CATEGORIES.includes(it.category));
  if (otherItems.length) grouped["Other"] = otherItems;

  function fileIcon(fileType: string | null | undefined) {
    if (!fileType) return <File className="size-5" />;
    if (fileType.startsWith("image")) return <Image className="size-5" />;
    if (fileType.startsWith("video")) return <Video className="size-5" />;
    if (fileType.startsWith("audio")) return <Music className="size-5" />;
    return <FileText className="size-5" />;
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="Storage"
        subtitle="All church records, media and documents"
        actions={
          canAdd ? (
            <Button onClick={openCreate} className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md" data-testid="button-add-storage">
              <Plus className="size-4 mr-1" /> Add file
            </Button>
          ) : null
        }
      />

      <div className="glass-strong rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(215,40%,40%)]" />
          <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/70 border-white/70" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 bg-white/70 border-white/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "title" | "category")}>
          <SelectTrigger className="w-36 bg-white/70 border-white/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">By date</SelectItem>
            <SelectItem value="title">By title</SelectItem>
            <SelectItem value="category">By category</SelectItem>
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")} title={sortDir === "asc" ? "Ascending" : "Descending"}>
          {sortDir === "asc" ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
        </Button>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-[hsl(215,40%,40%)]">
          <FolderOpen className="size-10 mx-auto mb-3 opacity-50" />
          No files found.
        </div>
      )}

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="mb-8">
          <h2 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-3 flex items-center gap-2">
            <FolderOpen className="size-4" /> {category}
            <span className="text-sm font-normal text-[hsl(215,40%,45%)]">({catItems.length})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catItems.map((it) => (
              <div key={it.id} className="glass-strong rounded-2xl p-5" data-testid={`card-storage-${it.id}`}>
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white flex-shrink-0">
                    {fileIcon(it.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base text-[hsl(215,80%,22%)] truncate">{it.title}</h3>
                    <Badge className="mt-1 bg-white/70 text-[hsl(215,80%,28%)] border-0 text-[10px]">{it.category}</Badge>
                  </div>
                </div>
                {it.description && (
                  <p className="mt-3 text-xs text-[hsl(215,40%,32%)] line-clamp-2">{it.description}</p>
                )}
                <div className="text-[11px] text-[hsl(215,40%,45%)] mt-2">Added {formatDate(it.createdAt)}</div>
                <div className="flex gap-1 mt-4">
                  <a href={it.fileUrl} target="_blank" rel="noreferrer" className="flex-1" data-testid={`link-open-${it.id}`}>
                    <Button size="sm" variant="ghost" className="w-full"><ExternalLink className="size-3.5 mr-1" /> Open</Button>
                  </a>
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => openEdit(it)} data-testid={`button-edit-storage-${it.id}`}>
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => onDelete(it.id)} className="text-rose-700" data-testid={`button-delete-storage-${it.id}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Edit file" : "Add file to storage"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-stor-title" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="select-stor-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="File (image, video, audio or document)">
              <MediaUpload
                value={form.fileUrl || null}
                mediaType={form.mediaKind}
                onChange={(url, kind) => setForm({
                  ...form,
                  fileUrl: url,
                  mediaKind: kind,
                  fileType: kind === "image" ? "image/*" : kind === "video" ? "video/*" : kind === "audio" ? "audio/*" : "application/octet-stream",
                })}
                onClear={() => setForm({ ...form, fileUrl: "", mediaKind: null, fileType: "" })}
                folder={`storage/${form.category.toLowerCase().replace(/\s+/g, "-")}`}
                accept="all"
                label="Upload file"
              />
            </Field>
            <Field label="Description / Summary">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief summary of what this contains..." data-testid="input-stor-description" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white" disabled={create.isPending || update.isPending} data-testid="button-save-storage">
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
