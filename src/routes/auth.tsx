import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Mail, Lock, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (typeof search.mode === "string" &&
      ["signin", "signup", "forgot"].includes(search.mode)
        ? search.mode
        : "signin") as "signin" | "signup" | "forgot",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AI Crop Recommendation" },
      {
        name: "description",
        content:
          "Sign in or create an account to get personalized AI crop recommendations.",
      },
    ],
  }),
  component: AuthPage,
});

/** GitHub logo SVG (official Invertocat mark) */
function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(
    search.mode
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  useEffect(() => {
    setMode(search.mode);
  }, [search.mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, mobile },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome 🌱");
        navigate({ to: "/profile" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/home" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your email.");
        setMode("signin");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin + "/home",
        },
      });
      if (error) throw error;
      // Browser will redirect to GitHub — no further action needed here
    } catch (err) {
      toast.error((err as Error).message);
      setOauthLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--gradient-auth)" }}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-primary-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Leaf className="h-8 w-8" />
            </div>
            <h1 className="mt-3 text-2xl font-bold">AI Crop Recommendation</h1>
            <p className="text-sm opacity-90">Smart farming, made simple</p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-2 text-primary-foreground hover:bg-[var(--welcome-glow)] hover:text-primary-foreground"
            >
              <Link to="/">Back to Get Started</Link>
            </Button>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]">
            {/* Tab switcher */}
            <div className="mb-5 flex rounded-xl bg-muted p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    mode === m
                      ? "bg-card text-foreground shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* GitHub OAuth button */}
            {mode !== "forgot" && (
              <>
                <button
                  id="github-signin-btn"
                  type="button"
                  onClick={signInWithGitHub}
                  disabled={oauthLoading || loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-[#24292e] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f363d] disabled:opacity-60"
                >
                  {oauthLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <GitHubIcon />
                  )}
                  {mode === "signup" ? "Sign up with GitHub" : "Sign in with GitHub"}
                </button>

                {/* Divider */}
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or continue with email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {/* Email / password form */}
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <Field
                    icon={<User className="h-4 w-4" />}
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                  />
                  <Field
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="Mobile"
                    value={mobile}
                    onChange={setMobile}
                  />
                </>
              )}
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
                required
              />
              {mode !== "forgot" && (
                <Field
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={setPassword}
                  required
                />
              )}
              <button
                id="email-submit-btn"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign In with Email"
                    : mode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-4 text-center text-xs">
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-primary font-medium"
                >
                  Forgot password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent py-3 text-sm outline-none"
      />
    </div>
  );
}