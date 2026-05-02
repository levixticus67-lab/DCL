import { PortalLayout, PortalHeader } from "@/components/portal-layout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Users,
  Megaphone,
  CalendarCheck,
  FolderOpen,
  Wallet,
  Building2,
  Boxes,
} from "lucide-react";

const FINANCE_ROLES = ["main_admin", "finance_head"];

export default function LeaderDashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const hasFinance = FINANCE_ROLES.includes(role);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <div className="glass rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white mb-4 shadow">
                  <Icon className="size-5" />
                </div>
                <div className="font-serif text-lg text-[hsl(215,80%,22%)] mb-1">
                  {card.label}
                </div>
                <div className="text-sm text-[hsl(215,40%,40%)]">
                  {card.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PortalLayout>
  );
}
