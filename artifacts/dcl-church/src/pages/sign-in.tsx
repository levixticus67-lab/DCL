import { useState, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Church, Loader2, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const goAfterAuth = () => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "";
    window.location.href = `${base}/portal`;
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await auth.signInWithGoogle();
      toast.success("Signed in");
      goAfterAuth();
    } catch (err) {
      toast.error((err as Error).message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.signInWithEmail(signInEmail, signInPassword);
      toast.success("Welcome back");
      goAfterAuth();
    } catch (err) {
      toast.error((err as Error).message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.signUpWithEmail(signUpEmail, signUpPassword, signUpName);
      toast.success("Account created");
      goAfterAuth();
    } catch (err) {
      toast.error((err as Error).message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12 bg-gradient-to-br from-[hsl(199,89%,90%)] via-[hsl(210,80%,95%)] to-[hsl(215,80%,88%)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(215,40%,40%)] hover:text-[hsl(215,80%,22%)] mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to site
        </Link>

        <div className="glass-strong rounded-3xl p-7 sm:p-9">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-11 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white shadow-md">
              <Church className="size-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[hsl(215,80%,22%)]">
                Welcome to DCL
              </h1>
              <p className="text-xs text-[hsl(215,40%,40%)] uppercase tracking-widest">
                Deliverance Church Lugazi
              </p>
            </div>
          </div>

          {!auth.isConfigured && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              <strong>Sign-in not configured yet.</strong>
              <div className="mt-1 text-xs leading-relaxed">
                The Firebase web config is missing. Add{" "}
                <code className="font-mono">VITE_FIREBASE_*</code> values to
                your <code className="font-mono">.env</code> and rebuild.
                See <code className="font-mono">DEPLOYMENT.md</code> for steps.
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/70 hover:bg-white border-white/80 mb-5"
            onClick={handleGoogle}
            disabled={busy || !auth.isConfigured}
            data-testid="button-google-signin"
          >
            {busy ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <FcGoogle className="size-5 mr-2" />
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-[hsl(215,40%,80%)]" />
            <span className="text-xs uppercase tracking-widest text-[hsl(215,40%,50%)]">
              or
            </span>
            <div className="h-px flex-1 bg-[hsl(215,40%,80%)]" />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-white/50">
              <TabsTrigger value="signin" data-testid="tab-signin">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    data-testid="input-signin-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    data-testid="input-signin-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md hover:opacity-95"
                  disabled={busy}
                  data-testid="button-signin-submit"
                >
                  {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    data-testid="input-signup-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    data-testid="input-signup-password"
                  />
                  <p className="text-xs text-[hsl(215,40%,50%)]">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-md hover:opacity-95"
                  disabled={busy}
                  data-testid="button-signup-submit"
                >
                  {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-xs text-center text-[hsl(215,40%,50%)]">
            The first account created automatically becomes the main admin.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hidden"
          />
        </div>
      </motion.div>
    </div>
  );
}
