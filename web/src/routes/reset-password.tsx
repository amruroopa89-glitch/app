import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — AI Crop Recommendation" },
      {
        name: "description",
        content: "Set your new password",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;

    // Check URL hash AND query parameters for recovery token
    const checkToken = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      
      console.log("[Reset Password] Page loaded");
      console.log("[Reset Password] URL hash:", hash);
      console.log("[Reset Password] URL search:", search);

      // Parse hash & query parameters
      const hashParams = new URLSearchParams(hash.substring(1));
      const queryParams = new URLSearchParams(search);

      // Check for error responses from Supabase (e.g., expired token)
      const urlError = queryParams.get("error") || hashParams.get("error");
      const urlErrorDesc = queryParams.get("error_description") || hashParams.get("error_description");

      if (urlError || urlErrorDesc) {
        console.error("[Reset Password] Link error detected:", urlError, urlErrorDesc);
        const cleanMsg = urlErrorDesc
          ? decodeURIComponent(urlErrorDesc).replace(/\+/g, " ")
          : "Invalid or expired reset link. Please request a new one.";
        toast.error(cleanMsg);
        setTimeout(() => {
          navigate({ to: "/auth", search: { mode: "forgot" } });
        }, 1500);
        return;
      }

      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const code = queryParams.get('code');

      console.log("[Reset Password] Parameters:", {
        hashType: type,
        hasHashAccessToken: !!accessToken,
        hasQueryCode: !!code,
      });

      // 1. Check for PKCE flow authorization code
      if (code) {
        console.log("[Reset Password] PKCE code detected, exchanging code for session...");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[Reset Password] Code exchange failed:", error);
            if (mounted) {
              toast.error(error.message || "Invalid or expired reset link. Please request a new one.");
              setTimeout(() => {
                navigate({ to: "/auth", search: { mode: "forgot" } });
              }, 2000);
            }
            return;
          }
          if (data?.session) {
            console.log("[Reset Password] ✅ PKCE code exchanged successfully");
            if (mounted) setIsValidToken(true);
            return;
          }
        } catch (err) {
          console.error("[Reset Password] Error during code exchange:", err);
        }
      }

      // 2. Check for implicit flow recovery token
      if (accessToken && (type === 'recovery' || !type)) {
        console.log("[Reset Password] ✅ Recovery hash detected");
        if (mounted) setIsValidToken(true);
        return;
      }

      // 3. Check current session (user might be already authenticated via recovery link)
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[Reset Password] Current session:", session ? "exists" : "none");
      
      if (session) {
        console.log("[Reset Password] Active session found, allowing password change");
        if (mounted) setIsValidToken(true);
        return;
      }

      // 4. Wait briefly for auth state listener in case auth initializes asynchronously
      setTimeout(async () => {
        if (!mounted) return;
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          setIsValidToken(true);
        } else {
          console.error("[Reset Password] ❌ No valid session or recovery token found");
          toast.error("Invalid or expired reset link. Please request a new one.");
          setTimeout(() => {
            navigate({ to: "/auth", search: { mode: "forgot" } });
          }, 2000);
        }
      }, 1200);
    };

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log("[Reset Password] Auth state changed:", event, session ? "session exists" : "no session");
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsValidToken(true);
      }
    });

    checkToken();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated successfully! 🎉");
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--gradient-auth)" }}
      >
        <div className="text-primary-foreground text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-foreground border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="mt-3 text-2xl font-bold">Reset Your Password</h1>
            <p className="text-sm opacity-90 mt-1">Enter your new password below</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                id="new-password-input"
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="New password (min 6 chars)"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />
              <Field
                id="confirm-password-input"
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading ? "Updating password…" : "Update Password"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                className="text-primary font-medium"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
}: {
  id?: string;
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      padding: '0 12px',
      minHeight: '52px',
    }}>
      <span style={{ color: '#9ca3af', flexShrink: 0 }}>{icon}</span>
      <input
        ref={inputRef}
        id={id}
        type={type}
        placeholder={placeholder}
        defaultValue={value}
        required={required}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={handleChange}
        style={{ 
          width: '100%',
          minWidth: 0,
          backgroundColor: 'transparent',
          padding: '14px 0',
          outline: 'none',
          border: 'none',
          fontSize: '16px',
          color: '#1F2937',
          WebkitTextFillColor: '#1F2937',
          caretColor: '#529e49',
          opacity: 1,
          WebkitAppearance: 'none',
          textShadow: 'none',
          filter: 'none',
        }}
      />
    </div>
  );
}
