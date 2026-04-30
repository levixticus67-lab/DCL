import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  Boxes,
  Megaphone,
  Wallet,
  CalendarCheck,
  FolderOpen,
  Share2,
  Settings,
  Church,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/format";

const NAV = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/people", label: "People", icon: Users },
  { href: "/portal/branches", label: "Branches", icon: Building2 },
  { href: "/portal/departments", label: "Departments", icon: Boxes },
  { href: "/portal/announcements", label: "Announcements", icon: Megaphone },
  { href: "/portal/finance", label: "Finance", icon: Wallet },
  { href: "/portal/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/portal/storage", label: "Storage", icon: FolderOpen },
  { href: "/portal/social", label: "Social Links", icon: Share2 },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

export function PortalLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const auth = useAuth();
  const initials =
    [auth.user?.firstName, auth.user?.lastName]
      .filter(Boolean)
      .map((s) => s![0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 z-30">
        <div className="m-4 flex-1 glass-strong rounded-3xl p-5 flex flex-col">
          <Link
            href="/"
            className="flex items-center gap-3 mb-8 hover-elevate rounded-xl p-2 -m-2"
            data-testid="link-back-public"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white shadow-md">
              <Church className="size-5" />
            </div>
            <div>
              <div className="font-serif text-base font-bold text-[hsl(215,80%,22%)]">
                DCL Portal
              </div>
              <div className="text-[11px] uppercase tracking-widest text-[hsl(215,40%,40%)]">
                Church Management
              </div>
            </div>
          </Link>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {NAV.map((n) => {
              const active = n.exact
                ? location === n.href
                : location.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
                      : "text-[hsl(215,40%,28%)] hover:bg-white/60"
                  }`}
                  data-testid={`link-portal-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/40">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-[hsl(215,40%,40%)] hover:text-[hsl(215,80%,22%)] mb-3"
            >
              <ArrowLeft className="size-3.5" />
              Back to public site
            </Link>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {auth.user?.profileImageUrl && (
                  <AvatarImage src={auth.user.profileImageUrl} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[hsl(215,80%,22%)] truncate">
                  {auth.user?.firstName} {auth.user?.lastName}
                </div>
                <div className="text-xs text-[hsl(215,40%,40%)]">
                  {roleLabel(auth.user?.role ?? "member")}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={auth.logout}
                title="Sign out"
                data-testid="button-logout-portal"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 p-3">
        <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white">
              <Church className="size-4" />
            </div>
            <span className="font-serif font-bold text-[hsl(215,80%,22%)]">
              DCL Portal
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Avatar className="size-8">
              {auth.user?.profileImageUrl && (
                <AvatarImage src={auth.user.profileImageUrl} />
              )}
              <AvatarFallback className="text-xs bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="mt-2 glass rounded-2xl px-2 py-2 flex gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = n.exact
              ? location === n.href
              : location.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  active
                    ? "bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white"
                    : "text-[hsl(215,40%,28%)]"
                }`}
              >
                <Icon className="size-4" />
                {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 lg:ml-72 pt-32 lg:pt-6 pb-12 px-4 sm:px-6 lg:px-8 min-w-0">
        {children}
      </main>
    </div>
  );
}

export function PortalHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
      <div>
        <h1 className="font-serif text-3xl text-[hsl(215,80%,22%)]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[hsl(215,40%,40%)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function canEdit(role: string | undefined): boolean {
  return role === "main_admin" || role === "leader";
}

export function isMainAdmin(role: string | undefined): boolean {
  return role === "main_admin";
}
