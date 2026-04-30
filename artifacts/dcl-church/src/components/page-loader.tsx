import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn, Lock } from "lucide-react";
import { type ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="size-12 rounded-full border-4 border-[hsl(199,89%,53%)] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="glass-strong rounded-3xl p-10 max-w-md w-full text-center">
          <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white mb-5">
            <Lock className="size-7" />
          </div>
          <h2 className="font-serif text-2xl text-[hsl(215,80%,22%)]">
            Sign in required
          </h2>
          <p className="mt-2 text-sm text-[hsl(215,40%,40%)]">
            The DCL portal is for our pastors, leaders and members. Please sign
            in to continue.
          </p>
          <Button
            onClick={auth.login}
            className="mt-6 bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md"
            data-testid="button-signin-required"
          >
            <LogIn className="size-4 mr-2" />
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
