import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import {
  RequireAuth,
  RequirePortalRole,
  RequireFinanceRole,
  RequireMainAdmin,
} from "@/components/page-loader";

import HomePage from "@/pages/public/home";
import AboutPage from "@/pages/public/about";
import AnnouncementsPage from "@/pages/public/announcements";
import BranchesPage from "@/pages/public/branches";
import SignInPage from "@/pages/sign-in";
import MemberDashboardPage from "@/pages/member-dashboard";

import DashboardPage from "@/pages/portal/dashboard";
import LeaderDashboardPage from "@/pages/portal/leader-dashboard";
import UsersPage from "@/pages/portal/users";
import PortalPeoplePage from "@/pages/portal/people";
import PortalBranchesPage from "@/pages/portal/branches";
import PortalDepartmentsPage from "@/pages/portal/departments";
import PortalAnnouncementsPage from "@/pages/portal/announcements";
import PortalFinancePage from "@/pages/portal/finance";
import PortalAttendancePage from "@/pages/portal/attendance";
import PortalStoragePage from "@/pages/portal/storage";
import PortalSocialPage from "@/pages/portal/social";
import PortalSettingsPage from "@/pages/portal/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function withAuth(Component: React.ComponentType) {
  return () => (
    <RequireAuth>
      <Component />
    </RequireAuth>
  );
}

function withPortal(Component: React.ComponentType) {
  return () => (
    <RequirePortalRole>
      <Component />
    </RequirePortalRole>
  );
}

function withFinance(Component: React.ComponentType) {
  return () => (
    <RequireFinanceRole>
      <Component />
    </RequireFinanceRole>
  );
}

function withMainAdmin(Component: React.ComponentType) {
  return () => (
    <RequireMainAdmin>
      <Component />
    </RequireMainAdmin>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/announcements" component={AnnouncementsPage} />
      <Route path="/branches" component={BranchesPage} />
      <Route path="/sign-in" component={SignInPage} />

      {/* Member-only landing (no portal access) */}
      <Route path="/member" component={withAuth(MemberDashboardPage)} />

      {/* Main admin dashboard */}
      <Route path="/portal" component={withPortal(DashboardPage)} />

      {/* Leader / pastor dashboard */}
      <Route path="/portal/leader" component={withPortal(LeaderDashboardPage)} />

      {/* User management — main admin only */}
      <Route path="/portal/users" component={withMainAdmin(UsersPage)} />

      {/* General portal pages — any portal role */}
      <Route path="/portal/people" component={withPortal(PortalPeoplePage)} />
      <Route path="/portal/branches" component={withPortal(PortalBranchesPage)} />
      <Route path="/portal/departments" component={withPortal(PortalDepartmentsPage)} />
      <Route path="/portal/announcements" component={withPortal(PortalAnnouncementsPage)} />
      <Route path="/portal/attendance" component={withPortal(PortalAttendancePage)} />
      <Route path="/portal/storage" component={withPortal(PortalStoragePage)} />
      <Route path="/portal/social" component={withPortal(PortalSocialPage)} />
      <Route path="/portal/settings" component={withPortal(PortalSettingsPage)} />

      {/* Finance — restricted to finance_head + main_admin */}
      <Route path="/portal/finance" component={withFinance(PortalFinancePage)} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={base}>
            <Router />
          </WouterRouter>
          <SonnerToaster
            position="top-right"
            theme="light"
            toastOptions={{
              className: "glass-strong",
              style: {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(13,71,161,0.15)",
                color: "hsl(215,80%,22%)",
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
