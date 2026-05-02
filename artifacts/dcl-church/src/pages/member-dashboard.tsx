import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LogOut, Church, Users, Building2, Boxes, Megaphone,
  Calendar, HeartHandshake, CheckCircle, X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { useApiClient } from "@workspace/api-client-react";

interface Profile {
  id: number;
  fullName: string;
  branchId: number | null;
  departmentId: number | null;
  email: string | null;
  phone: string | null;
  role: string;
}

interface Branch { id: number; name: string }
interface Department { id: number; name: string; branchId: number | null }
interface Announcement { id: number; title: string; body: string; createdAt: string; isPublic: boolean; mediaUrl: string | null; mediaType: string | null }
interface AttendanceWeek { week: string; total: number; services: number }

function useData() {
  const client = useApiClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWeek | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    if (loaded) return;
    try {
      const [p, b, d, a, att] = await Promise.allSettled([
        client.get("/people/self").catch(() => null),
        client.get("/branches"),
        client.get("/departments"),
        client.get("/announcements?publicOnly=true"),
        client.get("/attendance/current-week").catch(() => null),
      ]);
      if (p.status === "fulfilled" && p.value) setProfile(p.value as Profile);
      if (b.status === "fulfilled") setBranches(b.value as Branch[]);
      if (d.status === "fulfilled") setDepartments(d.value as Department[]);
      if (a.status === "fulfilled") setAnnouncements((a.value as Announcement[]).slice(0, 5));
      if (att.status === "fulfilled" && att.value) setAttendance(att.value as AttendanceWeek);
      setLoaded(true);
    } catch { /* ignore */ }
  }

  return { profile, setProfile, branches, departments, announcements, attendance, load, loaded };
}

export default function MemberDashboardPage() {
  const { user, logout } = useAuth();
  const { profile, setProfile, branches, departments, announcements, attendance, load, loaded } = useData();
  const client = useApiClient();
  const [saving, setSaving] = useState(false);

  if (!loaded) load();

  async function updateMembership(update: { branchId?: number | null; departmentId?: number | null }) {
    setSaving(true);
    try {
      const result = await client.patch("/people/self/membership", update);
      setProfile(result as Profile);
      toast.success("Updated successfully");
    } catch {
      toast.error("Could not update. Ask the admin to add your email to your profile first.");
    } finally {
      setSaving(false);
    }
  }

  const myBranch = branches.find((b) => b.id === profile?.branchId);
  const myDept = departments.find((d) => d.id === profile?.departmentId);

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white shadow-lg">
              <Church className="size-8" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-[hsl(215,80%,22%)]">
                Welcome, {user?.firstName ?? "Member"}!
              </h1>
              <p className="text-sm text-[hsl(215,40%,40%)]">
                {user?.email}
              </p>
            </div>
            <Button onClick={logout} variant="ghost" size="icon" className="ml-auto" title="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        {/* This week's attendance */}
        {attendance && (
          <div className="glass-strong rounded-2xl p-5">
            <h2 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-3 flex items-center gap-2">
              <Calendar className="size-4" /> This Week's Attendance
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-serif text-3xl text-[hsl(215,80%,22%)]">{attendance.total}</div>
                <div className="text-xs text-[hsl(215,40%,50%)]">people gathered</div>
              </div>
              <div>
                <div className="font-serif text-3xl text-[hsl(215,80%,22%)]">{attendance.services}</div>
                <div className="text-xs text-[hsl(215,40%,50%)]">services recorded</div>
              </div>
            </div>
            <p className="text-xs text-[hsl(215,40%,40%)] mt-2">Week of {attendance.week}</p>
          </div>
        )}

        {/* My membership */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-[hsl(215,80%,22%)] flex items-center gap-2">
            <Users className="size-4" /> My Membership
          </h2>

          {!profile && loaded && (
            <p className="text-sm text-[hsl(215,40%,40%)] bg-amber-50 rounded-lg px-3 py-2">
              Your email hasn't been added to the people directory yet. Contact the admin to be registered.
            </p>
          )}

          {profile && (
            <>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white">
                  <Building2 className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[hsl(215,40%,40%)]">My Branch</div>
                  <div className="font-medium text-[hsl(215,80%,22%)]">{myBranch?.name ?? "Not joined"}</div>
                </div>
              </div>
              <Select
                value={profile.branchId?.toString() ?? "none"}
                onValueChange={(v) => updateMembership({ branchId: v === "none" ? null : Number(v) })}
                disabled={saving}
              >
                <SelectTrigger className="bg-white/70 border-white/70">
                  <SelectValue placeholder="Join or change branch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Leave branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name} {b.id === profile.branchId ? "✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3 mt-2">
                <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white">
                  <Boxes className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[hsl(215,40%,40%)]">My Department</div>
                  <div className="font-medium text-[hsl(215,80%,22%)]">{myDept?.name ?? "Not joined"}</div>
                </div>
              </div>
              <Select
                value={profile.departmentId?.toString() ?? "none"}
                onValueChange={(v) => updateMembership({ departmentId: v === "none" ? null : Number(v) })}
                disabled={saving}
              >
                <SelectTrigger className="bg-white/70 border-white/70">
                  <SelectValue placeholder="Join or change department..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Leave department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} {d.id === profile.departmentId ? "✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Public announcements */}
        {announcements.length > 0 && (
          <div className="glass-strong rounded-2xl p-5">
            <h2 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-3 flex items-center gap-2">
              <Megaphone className="size-4" /> Church Announcements
            </h2>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="border-b border-white/30 last:border-0 pb-3 last:pb-0">
                  <div className="font-medium text-sm text-[hsl(215,80%,22%)]">{a.title}</div>
                  <div className="text-xs text-[hsl(215,40%,40%)] mt-0.5">{a.body.slice(0, 120)}{a.body.length > 120 ? "…" : ""}</div>
                  <div className="text-[11px] text-[hsl(215,40%,55%)] mt-1">{formatDate(a.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-5 text-center">
          <HeartHandshake className="size-8 mx-auto text-[hsl(215,80%,32%)] mb-2" />
          <p className="text-sm text-[hsl(215,40%,40%)]">
            Want to be part of the leadership team? Contact the main pastor to request a role upgrade.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
