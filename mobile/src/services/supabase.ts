import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://agvxymhumrrrwstfyuvk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hsYnQuuXXTZulmg2AG67SQ_NogYXAkQ";

function shouldMock(): boolean {
  if (!SUPABASE_URL || SUPABASE_URL.includes("your_supabase_project_url")) {
    return true;
  }
  return false;
}

function createMockSupabaseClient() {
  console.log("[Supabase Mobile Mock] Initializing offline mock client.");

  const getMockUsers = async () => {
    try {
      const data = await AsyncStorage.getItem("sb_mock_users");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveMockUsers = async (users: any[]) => {
    try {
      await AsyncStorage.setItem("sb_mock_users", JSON.stringify(users));
    } catch (e) {
      console.error("[Mock] Failed to save mock users", e);
    }
  };

  const getMockSession = async () => {
    try {
      const data = await AsyncStorage.getItem("sb_mock_session");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const saveMockSession = async (session: any) => {
    try {
      if (session) {
        await AsyncStorage.setItem("sb_mock_session", JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem("sb_mock_session");
      }
    } catch (e) {
      console.error("[Mock] Failed to save session", e);
    }
  };

  const getMockProfile = async (userId: string) => {
    try {
      const data = await AsyncStorage.getItem("sb_mock_profiles");
      const profiles = data ? JSON.parse(data) : {};
      return profiles[userId] || null;
    } catch {
      return null;
    }
  };

  const saveMockProfile = async (userId: string, profile: any) => {
    try {
      const data = await AsyncStorage.getItem("sb_mock_profiles");
      const profiles = data ? JSON.parse(data) : {};
      profiles[userId] = { ...profiles[userId], ...profile };
      await AsyncStorage.setItem("sb_mock_profiles", JSON.stringify(profiles));
    } catch (e) {
      console.error("[Mock] Failed to save profile", e);
    }
  };

  const authListeners = new Set<(event: string, session: any) => void>();

  const triggerAuthChange = (event: string, session: any) => {
    authListeners.forEach((cb) => cb(event, session));
  };

  const isValidEmail = (e: string) => {
    if (!e) return false;
    if (e.includes(" ")) return false;
    if (!e.includes("@")) return false;
    return e.split("@").length === 2;
  };

  const mockAuth = {
    async getSession() {
      const session = await getMockSession();
      return { data: { session }, error: null };
    },
    async getUser() {
      const session = await getMockSession();
      return { data: { user: session?.user || null }, error: null };
    },
    async signUp({ email, password, options }: any) {
      if (!email || !password) {
        return { data: { user: null }, error: { message: "Email and password are required" } };
      }
      if (!isValidEmail(email)) {
        return { data: { user: null }, error: { message: "Invalid email format" } };
      }
      if (password.length < 6) {
        return { data: { user: null }, error: { message: "Password must be at least 6 characters" } };
      }
      const users = await getMockUsers();
      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null }, error: { message: "User already exists" } };
      }
      const newUser = {
        id: "mock-user-" + Math.random().toString(36).substring(2, 11),
        email,
        user_metadata: options?.data || {},
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
      };
      users.push({ ...newUser, password });
      await saveMockUsers(users);

      const session = {
        access_token: "mock-token-" + Math.random().toString(36).substring(2, 11),
        user: newUser,
      };
      await saveMockSession(session);

      await saveMockProfile(newUser.id, {
        full_name: options?.data?.full_name || "",
        mobile: options?.data?.mobile || "",
        user_id: newUser.id,
        signup_at: newUser.created_at,
        last_sign_in_at: newUser.last_sign_in_at,
      });

      setTimeout(() => triggerAuthChange("SIGNED_IN", session), 0);

      return { data: { user: newUser }, error: null };
    },
    async signInWithPassword({ email, password }: any) {
      if (!email || !password) {
        return { data: { user: null, session: null }, error: { message: "Email and password are required" } };
      }
      const users = await getMockUsers();
      let user = users.find((u: any) => u.email === email);

      if (user && user.password !== password) {
        return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
      }

      if (!user) {
        // Auto-create a mock user if they don't exist yet (convenient for development)
        const userId = "mock-user-" + Math.random().toString(36).substring(2, 11);
        user = {
          id: userId,
          email,
          user_metadata: { full_name: "Mobile Farmer", mobile: "9876543210" },
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        };
        users.push({ ...user, password });
        await saveMockUsers(users);
        await saveMockProfile(userId, {
          full_name: "Mobile Farmer",
          mobile: "9876543210",
          user_id: userId,
          signup_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        });
      } else {
        // Update recent sign-in time
        user.last_sign_in_at = new Date().toISOString();
        await saveMockUsers(users);
        await saveMockProfile(user.id, {
          last_sign_in_at: user.last_sign_in_at,
        });
      }

      const session = {
        access_token: "mock-token-" + Math.random().toString(36).substring(2, 11),
        user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
      };
      await saveMockSession(session);

      setTimeout(() => triggerAuthChange("SIGNED_IN", session), 0);

      return { data: { user: session.user, session }, error: null };
    },
    async signOut() {
      await saveMockSession(null);
      setTimeout(() => triggerAuthChange("SIGNED_OUT", null), 0);
      return { error: null };
    },
    onAuthStateChange(callback: any) {
      authListeners.add(callback);
      getMockSession().then((session) => {
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      });
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
    async resetPasswordForEmail(email: string) {
      if (!email || !isValidEmail(email)) {
        return { data: null, error: { message: "Valid email is required" } };
      }
      return { data: { email }, error: null };
    },
    async updateUser(attributes: any) {
      const session = await getMockSession();
      if (!session?.user) {
        return { data: { user: null }, error: { message: "No active session" } };
      }
      return { data: { user: session.user }, error: null };
    },
  };

  const mockFrom = (table: string) => {
    return {
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
          const session = await getMockSession();
          if (!session?.user) return { data: null, error: null };
          const profile = await getMockProfile(session.user.id);
          return { data: profile, error: null };
        }
        return { data: null, error: null };
      },
      async single() {
        if (table === "profiles") {
          const session = await getMockSession();
          if (!session?.user) return { data: null, error: { message: "No session" } };
          const profile = await getMockProfile(session.user.id);
          return { data: profile, error: null };
        }
        return { data: null, error: { message: "Not found" } };
      },
      async upsert(payload: any) {
        if (table === "profiles") {
          const session = await getMockSession();
          const userId = payload.user_id || session?.user?.id;
          if (userId) {
            await saveMockProfile(userId, payload);
            return { data: payload, error: null };
          }
        }
        return { data: null, error: { message: "No active session" } };
      },
      delete() {
        return this;
      },
      eq(column: string, value: any) {
        return this;
      },
      then(onfulfilled?: any) {
        const getResult = async () => {
          let result: any = { data: [], error: null };
          if (table === "government_schemes") {
            result = {
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
            };
          } else if (table === "crop_alerts") {
            result = {
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
            };
          } else if (table === "mandi_prices") {
            result = {
              data: [
                { crop: "Rice (Paddy)", price_inr: 2183, unit: "quintal", change_pct: 1.2, state: null },
                { crop: "Wheat", price_inr: 2275, unit: "quintal", change_pct: -0.8, state: null },
                { crop: "Groundnut", price_inr: 6300, unit: "quintal", change_pct: 2.5, state: null },
              ],
              error: null,
            };
          } else if (table === "profiles") {
            const session = await getMockSession();
            if (session?.user) {
              const profile = await getMockProfile(session.user.id);
              result = { data: profile, error: null };
            } else {
              result = { data: null, error: null };
            }
          }
          return result;
        };

        return getResult().then(onfulfilled);
      },
    };
  };

  return {
    auth: mockAuth,
    from: mockFrom,
  } as any;
}

function createSupabaseClient() {
  if (shouldMock()) {
    return createMockSupabaseClient();
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage as any,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
