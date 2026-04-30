import { useState } from "react";
import {
  useListSocialLinks,
  useCreateSocialLink,
  useUpdateSocialLink,
  useDeleteSocialLink,
  getListSocialLinksQueryKey,
  getGetPublicSiteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SocForm {
  platform: string;
  url: string;
  handle: string;
  isActive: boolean;
  sortOrder: string;
}
const empty: SocForm = {
  platform: "",
  url: "",
  handle: "",
  isActive: true,
  sortOrder: "0",
};

export default function SocialPage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data: links } = useListSocialLinks();
  const create = useCreateSocialLink();
  const update = useUpdateSocialLink();
  const remove = useDeleteSocialLink();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SocForm>(empty);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(s: NonNullable<typeof links>[number]) {
    setEditingId(s.id);
    setForm({
      platform: s.platform,
      url: s.url,
      handle: s.handle ?? "",
      isActive: s.isActive,
      sortOrder: String(s.sortOrder),
    });
    setOpen(true);
  }

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListSocialLinksQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }),
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform.trim() || !form.url.trim()) {
      toast.error("Platform and URL required");
      return;
    }
    const payload = {
      platform: form.platform.trim(),
      url: form.url.trim(),
      handle: form.handle.trim() || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
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
    if (!confirm("Delete this link?")) return;
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
        title="Social Links"
        subtitle="The places we connect online"
        actions={
          editable ? (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-add-social"
            >
              <Plus className="size-4 mr-1" />
              Add link
            </Button>
          ) : null
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links?.map((s) => (
          <div
            key={s.id}
            className={`glass-strong rounded-2xl p-5 ${!s.isActive ? "opacity-60" : ""}`}
            data-testid={`card-social-${s.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white">
                <Share2 className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-base text-[hsl(215,80%,22%)]">
                  {s.platform}
                </div>
                {s.handle && (
                  <div className="text-xs text-[hsl(215,40%,40%)]">
                    {s.handle}
                  </div>
                )}
              </div>
            </div>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[hsl(199,89%,38%)] hover:underline block mt-3 truncate"
            >
              <ExternalLink className="size-3 inline mr-1" />
              {s.url}
            </a>
            {editable && (
              <div className="flex gap-1 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(s)}
                  className="flex-1"
                  data-testid={`button-edit-social-${s.id}`}
                >
                  <Pencil className="size-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(s.id)}
                  className="text-rose-700"
                  data-testid={`button-delete-social-${s.id}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/60">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit link" : "Add link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Platform">
              <Input
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value })
                }
                placeholder="Facebook, YouTube, Instagram..."
                required
                data-testid="input-soc-platform"
              />
            </Field>
            <Field label="URL">
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                required
                data-testid="input-soc-url"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Handle">
                <Input
                  value={form.handle}
                  onChange={(e) =>
                    setForm({ ...form, handle: e.target.value })
                  }
                  placeholder="@dclugazi"
                  data-testid="input-soc-handle"
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                  data-testid="input-soc-sort"
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white/50">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                data-testid="switch-soc-active"
              />
              <span className="text-sm">Visible on public site</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white"
                disabled={create.isPending || update.isPending}
                data-testid="button-save-social"
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
