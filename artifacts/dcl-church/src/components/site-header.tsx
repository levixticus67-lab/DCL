import { Link, useLocation } from "wouter";
import { useGetSiteSettings } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LayoutDashboard, LogOut, Church, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { roleLabel } from "@/lib/format";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/announcements", label: "Announcements" },
  { href: "/branches", label: "Branches" },
];

export function SiteHeader() {
  const [location] = useLocation();
  const { data: settings } = useGetSiteSettings();
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  const initials =
    [auth.user?.firstName, auth.user?.lastName]
      .filter(Boolean)
      .map((s) => s![0])
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="glass-strong rounded-2xl flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-3"
            data-testid="link-home"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white shadow-md">
              <Church className="size-5" />
            </div>
            <div className="hidden sm:block">
              <div className="font-serif text-lg font-bold text-[hsl(215,80%,22%)] leading-tight">
                {settings?.abbreviation ?? "DCL"}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-[hsl(215,40%,40%)]">
                Deliverance Church
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location === n.href
                    ? "bg-white/60 text-[hsl(215,80%,22%)]"
                    : "text-[hsl(215,40%,30%)] hover:bg-white/40"
                }`}
                data-testid={`link-nav-${n.label.toLowerCase()}`}
              >
                {n.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {auth.isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full pr-3 pl-1 gap-2"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="size-8">
                      {auth.user?.profileImageUrl && (
                        <AvatarImage src={auth.user.profileImageUrl} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {auth.user?.firstName ?? "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">
                      {auth.user?.firstName} {auth.user?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {roleLabel(auth.user?.role ?? "member")}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/portal"
                      className="flex items-center gap-2 cursor-pointer"
                      data-testid="link-portal"
                    >
                      <LayoutDashboard className="size-4" />
                      Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={auth.logout}
                    data-testid="button-logout"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={auth.login}
                className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md hover:opacity-95"
                data-testid="button-signin"
              >
                <LogIn className="size-4 mr-2" />
                Sign in
              </Button>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-8 flex flex-col gap-2">
                  {NAV.map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted"
                    >
                      {n.label}
                    </Link>
                  ))}
                  {auth.isAuthenticated && (
                    <Link
                      href="/portal"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted"
                    >
                      Portal
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
