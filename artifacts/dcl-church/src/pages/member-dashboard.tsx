import { useAuth } from "@/hooks/use-auth";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { LogOut, Church } from "lucide-react";

export default function MemberDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white mb-6 shadow-lg">
          <Church className="size-9" />
        </div>
        <h1 className="font-serif text-3xl text-[hsl(215,80%,22%)] mb-2">
          Welcome, {user?.firstName ?? "Member"}!
        </h1>
        <p className="text-[hsl(215,40%,40%)] mb-2">
          You are signed in as a church member.
        </p>
        <p className="text-sm text-[hsl(215,40%,50%)] mb-10">
          You don't have access to the management portal yet. Please contact
          the main admin to be promoted to a leadership role.
        </p>
        <Button
          onClick={logout}
          variant="outline"
          className="gap-2"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </PublicLayout>
  );
}
