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
  const navigate = useNavigate();



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



            {/* Email / password form */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
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
                type="submit"
                id="email-submit-btn"
                disabled={loading}
                onClick={submit}
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