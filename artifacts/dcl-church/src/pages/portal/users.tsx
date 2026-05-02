import { useState, useEffect } from "react";
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = [
  "main_admin",
  "pastor",
  "minister",
  "finance_head",
  "branch_head",
  "leader",
  "member",
  "guest",
] as const;

type Role = (typeof ALL_ROLES)[number];

type UserRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
};

const ROLE_LABELS: Record<Role, string> = {
  main_admin: "Main Admin",
  pastor: "Pastor",
  minister: "Minister",
  finance_head: "Finance Head",
  branch_head: "Branch Head",
  leader: "Leader",
  member: "Member",
  guest: "Guest",
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  if (user?.role !== "main_admin") return <Redirect to="/portal" />;

  useEffect(() => {
    customFetch<UserRow[]>("/api/auth/users")
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: Role) {
    setSaving(id);
    try {
      await customFetch(`/api/auth/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u)),
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSaving(null);
    }
  }

  return (
    <PortalLayout>
      <PortalHeader
        title="User Roles"
        subtitle="Promote or change roles for everyone who has signed in"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-[hsl(199,89%,53%)]" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
            const isMe = u.id === user?.id;
            return (
              <div
                key={u.id}
                className="glass-strong rounded-2xl p-4 flex items-center gap-4 flex-wrap"
              >
                <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white flex-shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[hsl(215,80%,22%)]">
                    {name} {isMe && <span className="text-xs text-[hsl(215,40%,50%)]">(you)</span>}
                  </div>
                  <div className="text-sm text-[hsl(215,40%,40%)] truncate">
                    {u.email ?? "No email"}
                  </div>
                </div>
                <select
                  value={u.role}
                  disabled={saving === u.id || isMe}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  className="rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm text-[hsl(215,80%,22%)] disabled:opacity-50 cursor-pointer"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {saving === u.id && (
                  <Loader2 className="size-4 animate-spin text-[hsl(199,89%,53%)]" />
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="text-center py-12 text-[hsl(215,40%,40%)]">
              No users have signed in yet.
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
