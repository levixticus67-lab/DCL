import {
  useGetDashboardSummary,
  useGetRecentActivity,
} from "@workspace/api-client-react";
import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import {
  Users,
  Building2,
  Boxes,
  Megaphone,
  FolderOpen,
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity();

  const totals = data?.totals;
  const finance = data?.finance;
  const branches = data?.branches ?? [];

  return (
    <PortalLayout>
      <PortalHeader
        title="Dashboard"
        subtitle="A snapshot of life across DCL"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat
          icon={<Users />}
          label="Pastors"
          value={totals?.pastors ?? 0}
          tone="primary"
        />
        <Stat
          icon={<Users />}
          label="Ministers"
          value={totals?.ministers ?? 0}
        />
        <Stat icon={<Users />} label="Members" value={totals?.members ?? 0} />
        <Stat
          icon={<Building2 />}
          label="Branches"
          value={totals?.branches ?? 0}
          tone="primary"
        />
        <Stat icon={<Boxes />} label="Departments" value={totals?.departments ?? 0} />
        <Stat
          icon={<Megaphone />}
          label="Announcements"
          value={totals?.announcements ?? 0}
        />
        <Stat
          icon={<FolderOpen />}
          label="Storage Items"
          value={totals?.storageItems ?? 0}
        />
        <Stat
          icon={<CalendarCheck />}
          label="Weeks Tracked"
          value={data?.attendance.weeksTracked ?? 0}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-5 text-[hsl(199,89%,38%)]" />
            <h3 className="font-serif text-lg text-[hsl(215,80%,22%)]">
              Finance overview
            </h3>
          </div>
          <p className="text-sm text-[hsl(215,40%,40%)] mb-5">
            All-time totals across all branches
          </p>
          <div className="grid grid-cols-3 gap-4">
            <FinanceTile
              label="Income"
              value={formatCurrency(
                finance?.totalIncome ?? 0,
                finance?.currency,
              )}
              icon={<TrendingUp className="size-4" />}
              tone="positive"
            />
            <FinanceTile
              label="Expense"
              value={formatCurrency(
                finance?.totalExpense ?? 0,
                finance?.currency,
              )}
              icon={<TrendingDown className="size-4" />}
              tone="negative"
            />
            <FinanceTile
              label="Balance"
              value={formatCurrency(finance?.balance ?? 0, finance?.currency)}
              icon={<Wallet className="size-4" />}
              tone="primary"
            />
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="size-5 text-[hsl(199,89%,38%)]" />
            <h3 className="font-serif text-lg text-[hsl(215,80%,22%)]">
              Attendance
            </h3>
          </div>
          <p className="text-sm text-[hsl(215,40%,40%)] mb-5">
            Latest service total across all branches
          </p>
          <div className="text-5xl font-serif text-gradient">
            {data?.attendance.latestTotal ?? 0}
          </div>
          <div className="text-sm text-[hsl(215,40%,40%)] mt-2">
            people attending the most recent recorded services
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-1">
            Members per branch
          </h3>
          <p className="text-sm text-[hsl(215,40%,40%)] mb-4">
            How our family is distributed across locations
          </p>
          <div className="h-64">
            {branches.length === 0 && !isLoading ? (
              <div className="h-full grid place-items-center text-sm text-[hsl(215,40%,40%)]">
                No branch data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branches}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(215,40%,30%)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(215,40%,30%)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(13,71,161,0.15)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar
                    dataKey="members"
                    fill="hsl(199, 89%, 53%)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <h3 className="font-serif text-lg text-[hsl(215,80%,22%)] mb-4">
            Recent activity
          </h3>
          <div className="space-y-3">
            {(activity ?? []).slice(0, 8).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 text-sm"
                data-testid={`activity-${a.id}`}
              >
                <div className="size-2 rounded-full bg-[hsl(199,89%,53%)] mt-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[hsl(215,80%,22%)] truncate">
                    {a.title}
                  </div>
                  {a.subtitle && (
                    <div className="text-xs text-[hsl(215,40%,40%)] truncate">
                      {a.subtitle}
                    </div>
                  )}
                  <div className="text-[11px] text-[hsl(215,40%,50%)] mt-0.5">
                    {formatDateTime(a.occurredAt)}
                  </div>
                </div>
              </div>
            ))}
            {(activity?.length ?? 0) === 0 && (
              <div className="text-sm text-[hsl(215,40%,40%)]">
                Nothing yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "primary";
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div
        className={`size-10 rounded-xl grid place-items-center mb-3 ${
          tone === "primary"
            ? "bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white"
            : "bg-white/70 text-[hsl(215,80%,32%)]"
        }`}
      >
        {icon}
      </div>
      <div className="text-2xl font-serif text-[hsl(215,80%,22%)]">
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest text-[hsl(215,40%,40%)] mt-1">
        {label}
      </div>
    </div>
  );
}

function FinanceTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "positive" | "negative" | "primary";
}) {
  const colors = {
    positive: "text-emerald-700 bg-emerald-50",
    negative: "text-rose-700 bg-rose-50",
    primary: "text-[hsl(215,80%,22%)] bg-white/70",
  };
  return (
    <div className="rounded-2xl p-4 border border-white/60 bg-white/40">
      <div
        className={`size-8 rounded-lg grid place-items-center mb-3 ${colors[tone]}`}
      >
        {icon}
      </div>
      <div className="text-xs uppercase tracking-widest text-[hsl(215,40%,40%)]">
        {label}
      </div>
      <div className="font-serif text-lg text-[hsl(215,80%,22%)] mt-1 break-all">
        {value}
      </div>
    </div>
  );
}
