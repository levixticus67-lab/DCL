import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  useListAnnouncements,
  useGetAttendanceSummary,
} from "@workspace/api-client-react";
import {
  Users, Megaphone, CalendarCheck, FolderOpen,
  Wallet, Building2, Boxes, Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const FINANCE_ROLES = ["main_admin", "finance_head"];
const PASTOR_ROLES = ["main_admin", "pastor"];

export default function LeaderDashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const hasFinance = FINANCE_ROLES.includes(role);
  const isPastor = PASTOR_ROLES.includes(role);

  const { data: announcements } = useListAnnouncements();
  const { data: summary } = useGetAttendanceSummary();

  const pendingReview = (announcements ?? []).filter((a) =>
    a.title.startsWith("[Review Requested]") && isPastor
  );

  const thisWeekTotal = (summary?.byWeek ?? []).slice(-1)[0]?.total ?? 0;

  const cards = [
    { href: "/portal/people", icon: Users, label: "People", desc: "View and manage church members" },
    { href: "/portal/announcements", icon: Megaphone, label: "Announcements", desc: "Post and manage announcements" },
    { href: "/portal/attendance", icon: CalendarCheck, label: "Attendance", desc: "Record service attendance" },
    { href: "/portal/storage", icon: FolderOpen, label: "Storage", desc: "Upload and manage files" },
    { href: "/portal/branches", icon: Building2, label: "Branches", desc: "View church branches" },
    { href: "/portal/departments", icon: Boxes, label: "Departments", desc: "View departments" },
    ...(hasFinance
      ? [{ href: "/portal/finance", icon: Wallet, label: "Finance", desc: "Manage financial records" }]
      : []),
  ];

  return (
    <PortalLayout>
      <PortalHeader
        title={`Welcome, ${user?.firstName ?? "Leader"}`}
        subtitle={`Signed in as ${role.replace(/_/g, " ")}`}
      />

      {/* Alerts for pastors */}
      {isPastor && pendingReview.length > 0 && (
        <div className="glass-strong rounded-2xl p-4 mb-6 border border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-4 text-amber-700" />
            <span className="font-medium text-amber-800 text-sm">
              {pendingReview.length} announcement{pendingReview.length > 1 ? "s" : ""} pending your review
            </span>
          </div>
          <div className="space-y-2">
            {pendingReview.slice(0, 3).map((a) => (
              <Link key={a.id} href="/portal/announcements">
                <div className="flex items-start gap-2 text-sm text-amber-900 hover:text-amber-700 cursor-pointer">
                  <Clock className="size-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{a.title.replace("[Review Requested] ", "")}</span>
                    <span className="text-amber-600 ml-2 text-xs">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-strong rounded-2xl p-4">
          <div className="text-xs text-[hsl(215,40%,40%)] mb-1 flex items-center gap-1">
            <CalendarCheck className="size-3" /> This week
          </div>
          <div className="font-serif text-3xl text-[hsl(215,80%,22%)]">{thisWeekTotal}</div>
          <div className="text-xs text-[hsl(215,40%,50%)]">attendance</div>
        </div>
        <div className="glass-strong rounded-2xl p-4">
          <div className="text-xs text-[hsl(215,40%,40%)] mb-1 flex items-center gap-1">
            <Megaphone className="size-3" /> Announcements
          </div>
          <div className="font-serif text-3xl text-[hsl(215,80%,22%)]">{(announcements ?? []).filter(a => a.isPublic).length}</div>
          <div className="text-xs text-[hsl(215,40%,50%)]">public</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <div className="glass rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white mb-4 shadow">
                  <Icon className="size-5" />
                </div>
                <div className="font-serif text-lg text-[hsl(215,80%,22%)] mb-1">{card.label}</div>
                <div className="text-sm text-[hsl(215,40%,40%)]">{card.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </PortalLayout>
  );
}
