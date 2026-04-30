import { useEffect, useState } from "react";
import {
  useGetSiteSettings,
  useUpdateSiteSettings,
  getGetSiteSettingsQueryKey,
  getGetPublicSiteQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortalLayout, PortalHeader, canEdit } from "@/components/portal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SettingsForm {
  churchName: string;
  abbreviation: string;
  tagline: string;
  missionStatement: string;
  visionStatement: string;
  coreValues: string[];
  address: string;
  primaryPhone: string;
  primaryEmail: string;
  heroImageUrl: string;
  logoUrl: string;
}

export default function SettingsPage() {
  const auth = useAuth();
  const editable = canEdit(auth.user?.role);
  const qc = useQueryClient();
  const { data: settings } = useGetSiteSettings();
  const update = useUpdateSiteSettings();

  const [form, setForm] = useState<SettingsForm | null>(null);
  const [valueInput, setValueInput] = useState("");

  useEffect(() => {
    if (settings && !form) {
      setForm({
        churchName: settings.churchName,
        abbreviation: settings.abbreviation,
        tagline: settings.tagline ?? "",
        missionStatement: settings.missionStatement,
        visionStatement: settings.visionStatement,
        coreValues: [...settings.coreValues],
        address: settings.address ?? "",
        primaryPhone: settings.primaryPhone ?? "",
        primaryEmail: settings.primaryEmail ?? "",
        heroImageUrl: settings.heroImageUrl ?? "",
        logoUrl: settings.logoUrl ?? "",
      });
    }
  }, [settings, form]);

  if (!form) {
    return (
      <PortalLayout>
        <PortalHeader title="Settings" />
        <div className="glass rounded-2xl p-10 text-center text-[hsl(215,40%,40%)]">
          Loading...
        </div>
      </PortalLayout>
    );
  }

  async function onSave() {
    if (!form) return;
    const payload = {
      churchName: form.churchName.trim(),
      abbreviation: form.abbreviation.trim(),
      tagline: form.tagline.trim() || null,
      missionStatement: form.missionStatement.trim(),
      visionStatement: form.visionStatement.trim(),
      coreValues: form.coreValues.filter((v) => v.trim().length > 0),
      address: form.address.trim() || null,
      primaryPhone: form.primaryPhone.trim() || null,
      primaryEmail: form.primaryEmail.trim() || null,
      heroImageUrl: form.heroImageUrl.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
    };
    try {
      await update.mutateAsync({ data: payload });
      toast.success("Settings saved");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }),
      ]);
    } catch {
      toast.error("Could not save");
    }
  }

  function addValue() {
    const v = valueInput.trim();
    if (!v || !form) return;
    setForm({ ...form, coreValues: [...form.coreValues, v] });
    setValueInput("");
  }
  function removeValue(idx: number) {
    if (!form) return;
    setForm({
      ...form,
      coreValues: form.coreValues.filter((_, i) => i !== idx),
    });
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="Settings"
        subtitle="Identity, mission, vision and contact"
        actions={
          editable ? (
            <Button
              onClick={onSave}
              disabled={update.isPending}
              className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
              data-testid="button-save-settings"
            >
              Save changes
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 max-w-3xl">
        <Card title="Identity">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Church name">
              <Input
                value={form.churchName}
                onChange={(e) =>
                  setForm({ ...form, churchName: e.target.value })
                }
                disabled={!editable}
                data-testid="input-set-name"
              />
            </Field>
            <Field label="Abbreviation">
              <Input
                value={form.abbreviation}
                onChange={(e) =>
                  setForm({ ...form, abbreviation: e.target.value })
                }
                disabled={!editable}
                data-testid="input-set-abbr"
              />
            </Field>
          </div>
          <Field label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              disabled={!editable}
              data-testid="input-set-tagline"
            />
          </Field>
        </Card>

        <Card title="Mission & Vision">
          <Field label="Mission statement">
            <Textarea
              value={form.missionStatement}
              onChange={(e) =>
                setForm({ ...form, missionStatement: e.target.value })
              }
              rows={4}
              disabled={!editable}
              data-testid="input-set-mission"
            />
          </Field>
          <Field label="Vision statement">
            <Textarea
              value={form.visionStatement}
              onChange={(e) =>
                setForm({ ...form, visionStatement: e.target.value })
              }
              rows={4}
              disabled={!editable}
              data-testid="input-set-vision"
            />
          </Field>
        </Card>

        <Card title="Core values">
          <div className="space-y-2">
            {form.coreValues.map((v, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg"
              >
                <span className="flex-1 text-sm text-[hsl(215,80%,22%)]">
                  {v}
                </span>
                {editable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeValue(i)}
                    className="text-rose-700"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {editable && (
              <div className="flex gap-2 pt-2">
                <Input
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="Add a core value..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                  data-testid="input-set-newvalue"
                />
                <Button
                  type="button"
                  onClick={addValue}
                  variant="outline"
                  data-testid="button-add-value"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Contact">
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={!editable}
              data-testid="input-set-address"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                value={form.primaryPhone}
                onChange={(e) =>
                  setForm({ ...form, primaryPhone: e.target.value })
                }
                disabled={!editable}
                data-testid="input-set-phone"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.primaryEmail}
                onChange={(e) =>
                  setForm({ ...form, primaryEmail: e.target.value })
                }
                disabled={!editable}
                data-testid="input-set-email"
              />
            </Field>
          </div>
        </Card>

        <Card title="Branding">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Logo URL">
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                disabled={!editable}
                data-testid="input-set-logo"
              />
            </Field>
            <Field label="Hero image URL">
              <Input
                value={form.heroImageUrl}
                onChange={(e) =>
                  setForm({ ...form, heroImageUrl: e.target.value })
                }
                disabled={!editable}
                data-testid="input-set-hero"
              />
            </Field>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <h3 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-4">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
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
