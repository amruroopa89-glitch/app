import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Mail, Lock, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Type declaration for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signin" | "signup" | "forgot" } => ({
    mode: (typeof search.mode === "string" && ["signin", "signup", "forgot"].includes(search.mode)
      ? search.mode
      : "signin") as "signin" | "signup" | "forgot",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AI Crop Recommendation" },
      {
        name: "description",
        content: "Sign in or create an account to get personalized AI crop recommendations.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode);
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
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        
        if (
          import.meta.env.VITE_USE_MOCK_SUPABASE === "true" ||
          (typeof window !== "undefined" && window.location.search.includes("mock=true"))
        ) {
          toast.success("Mock Mode: Directing to password reset page 🔐");
          navigate({
            to: "/reset-password",
            hash: "access_token=mock-reset-token&type=recovery",
          });
        } else {
          toast.success("Reset link sent. Check your email 📧");
          setMode("signin");
        }
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-y-auto pb-12"
      style={{ background: "var(--gradient-auth)" }}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-6">
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
                    mode === m ? "bg-card text-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Email / password form */}
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <Field
                    key="name-input"
                    id="name-input"
                    name="name"
                    icon={<User className="h-4 w-4" />}
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                  />
                  <Field
                    key="mobile-input"
                    id="mobile-input"
                    name="tel"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="Mobile"
                    value={mobile}
                    onChange={setMobile}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </>
              )}
              <Field
                key="email-input"
                id="email-input"
                name="email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
                inputMode="email"
                autoComplete="email"
                required
              />
              {mode !== "forgot" && (
                <Field
                  key="password-input"
                  id="password-input"
                  name="password"
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              )}
              <button
                type="submit"
                id="email-submit-btn"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60 cursor-pointer"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign In"
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
                  className="text-primary font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium cursor-pointer"
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
  id,
  name,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  inputMode,
  autoComplete,
}: {
  id?: string;
  name?: string;
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-3.5 min-h-[52px] focus-within:ring-2 focus-within:ring-green-600 focus-within:border-green-600 transition-all relative z-10"
      style={{ backgroundColor: "#ffffff" }}
    >
      <span className="text-gray-400 flex-shrink-0 pointer-events-none">{icon}</span>
      <input
        id={id}
        name={name || id}
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize={type === "email" || inputMode === "email" ? "none" : "words"}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        className="w-full min-w-0 bg-transparent py-3 outline-none border-none text-base font-normal text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 cursor-text relative z-20"
        style={{
          fontSize: "16px",
          color: "#111827",
          caretColor: "#166534",
          opacity: 1,
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}

