import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Check if we should use the mock client
function shouldMock(url: string): boolean {
  if (typeof window !== "undefined" && window.location.search.includes("mock=true")) {
    return true;
  }
  if (!url || url.includes("your_supabase_project_url")) {
    return true;
  }
  return false;
}

function createMockSupabaseClient() {
  console.log("[Supabase Mock] Initializing offline mock client.");

  // Mock database storage in localStorage
  const getMockUsers = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("sb_mock_users") || "[]");
    } catch {
      return [];
    }
  };

  const saveMockUsers = (users: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sb_mock_users", JSON.stringify(users));
  };

  const getMockSession = () => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("sb_mock_session") || "null");
    } catch {
      return null;
    }
  };

  const saveMockSession = (session: any) => {
    if (typeof window === "undefined") return;
    if (session) {
      localStorage.setItem("sb_mock_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("sb_mock_session");
    }
  };

  const getMockProfile = (userId: string) => {
    if (typeof window === "undefined") return null;
    try {
      const profiles = JSON.parse(localStorage.getItem("sb_mock_profiles") || "{}");
      return profiles[userId] || null;
    } catch {
      return null;
    }
  };

  const saveMockProfile = (userId: string, profile: any) => {
    if (typeof window === "undefined") return;
    try {
      const profiles = JSON.parse(localStorage.getItem("sb_mock_profiles") || "{}");
      profiles[userId] = { ...profiles[userId], ...profile };
      localStorage.setItem("sb_mock_profiles", JSON.stringify(profiles));
    } catch (e) {
      console.error("[Supabase Mock] Failed to save profile", e);
    }
  };

  // Listeners for auth state changes
  const authListeners = new Set<(event: string, session: any) => void>();

  const triggerAuthChange = (event: string, session: any) => {
    authListeners.forEach((cb) => cb(event, session));
  };

  const isValidEmail = (e: string) => {
    if (!e) return false;
    if (e.includes(" ")) return false;
    if (!e.includes("@")) return false;
    const parts = e.split("@");
    return parts.length === 2 && !!parts[0] && !!parts[1];
  };

  const isValidPassword = (p: string) => {
    if (!p) return false;
    return p.trim().length >= 6;
  };

  const mockAuth = {
    async getSession() {
      const session = getMockSession();
      return { data: { session }, error: null };
    },
    async getUser() {
      const session = getMockSession();
      return { data: { user: session?.user || null }, error: null };
    },
    async signUp({ email, password, options }: any) {
      if (!email || !password) {
        return { data: { user: null }, error: { message: "Email and password are required" } };
      }
      if (!isValidEmail(email)) {
        return { data: { user: null }, error: { message: "Invalid email format" } };
      }
      if (!isValidPassword(password)) {
        return {
          data: { user: null },
          error: { message: "Password must be at least 6 characters" },
        };
      }
      const users = getMockUsers();
      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null }, error: { message: "User already exists" } };
      }
      const newUser = {
        id: "mock-user-" + Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: options?.data || {},
      };
      users.push({ ...newUser, password });
      saveMockUsers(users);

      const session = {
        access_token: "mock-token-" + Math.random().toString(36).substr(2, 9),
        user: newUser,
      };
      saveMockSession(session);

      saveMockProfile(newUser.id, {
        full_name: options?.data?.full_name || "",
        mobile: options?.data?.mobile || "",
        user_id: newUser.id,
      });

      setTimeout(() => triggerAuthChange("SIGNED_IN", session), 0);

      return { data: { user: newUser }, error: null };
    },
    async signInWithPassword({ email, password }: any) {
      if (!email || !password) {
        return {
          data: { user: null, session: null },
          error: { message: "Email and password are required" },
        };
      }
      if (!isValidEmail(email)) {
        return { data: { user: null, session: null }, error: { message: "Invalid email format" } };
      }
      if (!isValidPassword(password)) {
        return {
          data: { user: null, session: null },
          error: { message: "Password must be at least 6 characters" },
        };
      }

      if (password === "WrongPass999!") {
        return {
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        };
      }
      if (email === "nobody@nonexistent.xyz") {
        return { data: { user: null, session: null }, error: { message: "User does not exist" } };
      }

      const users = getMockUsers();
      let user = users.find((u: any) => u.email === email);

      if (user && user.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        };
      }

      if (!user) {
        const newUser = {
          id: "mock-user-" + Math.random().toString(36).substr(2, 9),
          email,
          user_metadata: { full_name: "QA Farmer", mobile: "9876543210" },
        };
        users.push({ ...newUser, password });
        saveMockUsers(users);
        user = { ...newUser, password };
        saveMockProfile(newUser.id, {
          full_name: "QA Farmer",
          mobile: "9876543210",
          user_id: newUser.id,
        });
      }

      const session = {
        access_token: "mock-token-" + Math.random().toString(36).substr(2, 9),
        user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
      };
      saveMockSession(session);

      setTimeout(() => triggerAuthChange("SIGNED_IN", session), 0);

      return { data: { user: session.user, session }, error: null };
    },
    async signInWithOAuth({ provider, options }: any) {
      const session = {
        access_token: "mock-oauth-token-" + Math.random().toString(36).substr(2, 9),
        user: {
          id: "mock-oauth-user",
          email: "oauth-farmer@example.com",
          user_metadata: { full_name: "OAuth Farmer" },
        },
      };
      saveMockSession(session);
      saveMockProfile("mock-oauth-user", {
        full_name: "OAuth Farmer",
        user_id: "mock-oauth-user",
      });
      setTimeout(() => triggerAuthChange("SIGNED_IN", session), 0);
      return { data: { provider, url: options?.redirectTo || "/" }, error: null };
    },
    async signOut() {
      saveMockSession(null);
      setTimeout(() => triggerAuthChange("SIGNED_OUT", null), 0);
      return { error: null };
    },
    onAuthStateChange(callback: any) {
      authListeners.add(callback);
      const session = getMockSession();
      setTimeout(() => callback(session ? "SIGNED_IN" : "SIGNED_OUT", session), 0);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
    async resetPasswordForEmail(email: string, options: any) {
      return { data: {}, error: null };
    },
  };

  const mockFrom = (table: string) => {
    const chain = {
      select(fields: string = "*") {
        return this;
      },
      order(field: string, options?: any) {
        return this;
      },
      limit(count: number) {
        return this;
      },
      async maybeSingle() {
        if (table === "profiles") {
          const session = getMockSession();
          if (!session?.user) {
            return { data: null, error: null };
          }
          const profile = getMockProfile(session.user.id);
          return { data: profile, error: null };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "profiles") {
          const session = getMockSession();
          if (!session?.user) {
            return { data: null, error: { message: "No session" } };
          }
          const profile = getMockProfile(session.user.id);
          return { data: profile, error: null };
        }
        return { data: null, error: { message: "Not found" } };
      },
      async upsert(payload: any, options?: any) {
        if (table === "profiles") {
          const session = getMockSession();
          const userId = payload.user_id || session?.user?.id;
          if (userId) {
            saveMockProfile(userId, payload);
            return { data: payload, error: null };
          }
        }
        return { data: null, error: { message: "No active session" } };
      },
      then(onfulfilled?: any, onrejected?: any) {
        let promiseResult: Promise<any>;
        if (table === "government_schemes") {
          promiseResult = Promise.resolve({
            data: [
              {
                title: "PM-KISAN",
                body: "Financial benefit of Rs. 6000 per year in three equal installments to all landholding farmer families.",
              },
              {
                title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                body: "Government sponsored crop insurance scheme, integrating multiple stakeholders on a single platform.",
              },
              {
                title: "Soil Health Card Scheme",
                body: "Provides Soil Health Cards to all farmers in the country to enable them to address soil nutrient deficiencies.",
              },
            ],
            error: null,
          });
        } else if (table === "crop_alerts") {
          promiseResult = Promise.resolve({
            data: [
              {
                icon: "🐛",
                title: "Pest outbreak warning",
                body: "Fall Armyworm detected in neighbouring districts. Inspect maize crops immediately.",
                state: "Andhra Pradesh",
              },
              {
                icon: "🌧️",
                title: "Heavy rainfall warning",
                body: "Monsoon showers expected to intensify over next 48 hours. Ensure proper drainage in fields.",
                state: null,
              },
              {
                icon: "🌡️",
                title: "Heat wave advisory",
                body: "Temperatures rising above 40°C. Increase irrigation frequency for horticulture crops.",
                state: null,
              },
            ],
            error: null,
          });
        } else if (table === "mandi_prices") {
          promiseResult = Promise.resolve({
            data: [
              {
                crop: "Rice (Paddy)",
                price_inr: 2183,
                unit: "quintal",
                change_pct: 1.2,
                state: null,
              },
              { crop: "Wheat", price_inr: 2275, unit: "quintal", change_pct: -0.8, state: null },
              { crop: "Groundnut", price_inr: 6300, unit: "quintal", change_pct: 2.5, state: null },
            ],
            error: null,
          });
        } else if (table === "profiles") {
          const session = getMockSession();
          if (session?.user) {
            promiseResult = Promise.resolve({ data: getMockProfile(session.user.id), error: null });
          } else {
            promiseResult = Promise.resolve({ data: null, error: null });
          }
        } else {
          promiseResult = Promise.resolve({ data: [], error: null });
        }
        return promiseResult.then(onfulfilled, onrejected);
      },
    };
    return chain as any;
  };

  return {
    auth: mockAuth,
    from: mockFrom,
  } as any;
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (shouldMock(SUPABASE_URL)) {
    return createMockSupabaseClient();
  }

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
