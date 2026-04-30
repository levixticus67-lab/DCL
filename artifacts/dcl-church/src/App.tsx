import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { RequireAuth } from "@/components/page-loader";

import HomePage from "@/pages/public/home";
import AboutPage from "@/pages/public/about";
import AnnouncementsPage from "@/pages/public/announcements";
import BranchesPage from "@/pages/public/branches";
import SignInPage from "@/pages/sign-in";

import DashboardPage from "@/pages/portal/dashboard";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/announcements" component={AnnouncementsPage} />
      <Route path="/branches" component={BranchesPage} />
      <Route path="/sign-in" component={SignInPage} />

      <Route path="/portal" component={withAuth(DashboardPage)} />
      <Route path="/portal/people" component={withAuth(PortalPeoplePage)} />
      <Route path="/portal/branches" component={withAuth(PortalBranchesPage)} />
      <Route
        path="/portal/departments"
        component={withAuth(PortalDepartmentsPage)}
      />
      <Route
        path="/portal/announcements"
        component={withAuth(PortalAnnouncementsPage)}
      />
      <Route path="/portal/finance" component={withAuth(PortalFinancePage)} />
      <Route
        path="/portal/attendance"
        component={withAuth(PortalAttendancePage)}
      />
      <Route path="/portal/storage" component={withAuth(PortalStoragePage)} />
      <Route path="/portal/social" component={withAuth(PortalSocialPage)} />
      <Route path="/portal/settings" component={withAuth(PortalSettingsPage)} />

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
