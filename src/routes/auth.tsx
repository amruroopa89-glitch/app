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
  validateSearch: (search: Record<string, unknown>) => ({
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

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken) {
        console.log('[Google OAuth] Callback detected with access token');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('[Google OAuth] Session error:', error);
            toast.error('Failed to complete Google sign-in: ' + error.message);
          } else if (data?.session) {
            console.log('[Google OAuth] Session established successfully');
            
            // If opened in popup, close the popup and notify parent
            if (window.opener && !window.opener.closed) {
              console.log('[Google OAuth] Running in popup, closing...');
              window.close();
            } else {
              // Running in main window
              toast.success("Welcome! Signed in with Google 🎉");
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
              navigate({ to: "/home" });
            }
          }
        } catch (err) {
          console.error('[Google OAuth] Callback error:', err);
          toast.error('Failed to complete sign-in');
          
          // If in popup, still close it
          if (window.opener && !window.opener.closed) {
            setTimeout(() => window.close(), 1000);
          }
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

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
        toast.success("Reset link sent. Check your email 📧");
        setMode("signin");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      console.log('[Google OAuth] Initiating sign in with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[Google OAuth] Error:', error);
        throw error;
      }

      console.log('[Google OAuth] Response data:', data);

      if (data?.url) {
        // For mobile (Capacitor) - use in-app browser
        if (window.Capacitor?.isNativePlatform()) {
          try {
            const { Browser } = await import("@capacitor/browser");
            
            // Open in-app browser
            await Browser.open({ 
              url: data.url,
              windowName: '_blank',
              toolbarColor: '#16a34a',
              presentationStyle: 'popover',
            });

            // Listen for the browser to close
            Browser.addListener('browserFinished', async () => {
              console.log('[Google OAuth] Browser closed, checking session...');
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                toast.success("Welcome! Signed in with Google 🎉");
                navigate({ to: "/home" });
              }
              setLoading(false);
            });

            return; // Don't set loading to false yet
          } catch (browserErr) {
            console.error('[Google OAuth] Capacitor Browser error:', browserErr);
          }
        }
        
        // For web browser - open popup window
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.url,
          'Google Sign In',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
        );

        if (!popup) {
          // Popup blocked, fallback to redirect
          console.log('[Google OAuth] Popup blocked, using redirect');
          window.location.href = data.url;
          return;
        }

        // Poll for popup closure and session establishment
        const checkInterval = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(checkInterval);
              console.log('[Google OAuth] Popup closed, checking session...');
              
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                toast.success("Welcome! Signed in with Google 🎉");
                navigate({ to: "/home" });
              } else {
                setLoading(false);
              }
            }
          } catch (e) {
            // Cross-origin errors are expected
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!popup.closed) {
            popup.close();
          }
          setLoading(false);
        }, 300000);

      } else {
        console.log('[Google OAuth] No URL returned, checking session...');
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          toast.success("Welcome back!");
          navigate({ to: "/home" });
        } else {
          throw new Error("No OAuth URL returned and no active session");
        }
      }
    } catch (err: any) {
      console.error("[Google OAuth] Full error:", err);
      const msg = err?.message || "Google Sign-In failed";
      
      if (
        msg.toLowerCase().includes("unsupported") ||
        msg.toLowerCase().includes("not enabled") ||
        msg.toLowerCase().includes("provider") ||
        msg.toLowerCase().includes("not found")
      ) {
        toast.error(
          "Google Sign-In is not configured. Please contact support or sign in with Email/Password.",
          { duration: 5000 }
        );
      } else {
        toast.error(msg);
      }
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
                    icon={<User className="h-4 w-4" />}
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                  />
                  <Field
                    key="mobile-input"
                    id="mobile-input"
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
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  required
                />
              )}
              <button
                type="submit"
                id="email-submit-btn"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
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

            {mode !== "forgot" && (
              <>
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <span className="relative bg-card px-2 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </>
            )}

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
  id,
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
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }}
      className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-3.5 min-h-[52px] cursor-text focus-within:ring-2 focus-within:ring-green-600 focus-within:border-green-600 transition-all relative z-10"
      style={{ backgroundColor: "#ffffff" }}
    >
      <span className="text-gray-400 flex-shrink-0 pointer-events-none">{icon}</span>
      <input
        ref={inputRef}
        id={id}
        name={id}
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
        className="w-full min-w-0 bg-white py-3 outline-none border-none text-base font-normal text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        style={{
          fontSize: "16px",
          color: "#111827",
          WebkitTextFillColor: "#111827",
          caretColor: "#166534",
          backgroundColor: "#ffffff",
          opacity: 1,
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      />
    </div>
  );
}
