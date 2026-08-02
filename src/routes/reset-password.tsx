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
    // Check if we have a valid session (user clicked the reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      } else {
        toast.error("Invalid or expired reset link");
        navigate({ to: "/auth" });
      }
    });
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
      navigate({ to: "/auth" });
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
                onClick={() => navigate({ to: "/auth" })}
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
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);

    if (inputRef.current) {
      inputRef.current.value = newValue;
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-primary/40 cursor-text min-h-[52px]">
      <span className="text-muted-foreground flex-shrink-0 pointer-events-none select-none">
        {icon}
      </span>
      <input
        ref={inputRef}
        id={id}
        type={type}
        placeholder={placeholder}
        value={localValue}
        required={required}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={handleChange}
        onInput={handleInput}
        className="w-full min-w-0 bg-transparent py-3.5 text-base outline-none focus:outline-none"
        style={{
          fontSize: "16px",
          color: "rgb(34, 41, 35)",
          WebkitTextFillColor: "rgb(34, 41, 35)",
          caretColor: "rgb(82, 158, 73)",
          opacity: 1,
        }}
      />
    </div>
  );
}
