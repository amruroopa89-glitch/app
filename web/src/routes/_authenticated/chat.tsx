import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useState, useEffect, useRef } from "react";
import { useAskAssistant } from "@/lib/ai-client";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  Sprout,
  Droplets,
  CloudSun,
  ShieldAlert,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Green Harvest AI Assistant" },
      {
        name: "description",
        content: "Chat with Green Harvest AI Assistant for crop, fertilizer, disease, irrigation and weather guidance.",
      },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; created_at?: string };

const CATEGORY_SUGGESTIONS = [
  {
    category: "Crop Recommendations",
    icon: Sprout,
    prompt: "Recommend the best crops for my soil and current season.",
  },
  {
    category: "Fertilizer Suggestions",
    icon: FlaskConical,
    prompt: "What is the optimal NPK fertilizer dose for groundnut and cotton?",
  },
  {
    category: "Plant Disease Guidance",
    icon: ShieldAlert,
    prompt: "How do I identify and treat yellow leaf spot organically?",
  },
  {
    category: "Irrigation Advice",
    icon: Droplets,
    prompt: "What is the best irrigation schedule for maize during summer?",
  },
  {
    category: "Weather Farming Tips",
    icon: CloudSun,
    prompt: "Give me farming tips based on recent weather and rainfall forecasts.",
  },
];

const LANGS: Record<string, { label: string; code: string }> = {
  English: { label: "English", code: "en-IN" },
  Hindi: { label: "हिन्दी", code: "hi-IN" },
  Telugu: { label: "తెలుగు", code: "te-IN" },
  Tamil: { label: "தமிழ்", code: "ta-IN" },
  Kannada: { label: "ಕನ್ನಡ", code: "kn-IN" },
  Marathi: { label: "मराठी", code: "mr-IN" },
  Bengali: { label: "বাংলা", code: "bn-IN" },
  Gujarati: { label: "ગુજરાતી", code: "gu-IN" },
};

function ChatPage() {
  const ask = useAskAssistant();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello! 👋 I am your **Green Harvest AI Assistant**.\n\nI can help you with:\n- 🌾 **Crop recommendations**\n- 🧪 **Fertilizer suggestions**\n- 🌿 **Plant disease guidance**\n- 💧 **Irrigation advice**\n- ☀️ **Weather-based farming tips**\n\nHow can I help your farm today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [lang, setLang] = useState<string>("English");
  const [listening, setListening] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const recogRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch logged in user profile & saved chat history
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (isMounted) setUser(currentUser);

        if (currentUser) {
          // Load Profile
          const { data: profData } = await supabase
            .from("profiles")
            .select(
              "full_name,village,district,state,farm_size,farm_unit,soil_type,soil_ph,nitrogen,phosphorus,potassium,water_availability,irrigation_type,current_season,crop_history,language",
            )
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (profData && isMounted) {
            if (profData.language) {
              setLang(profData.language);
            }
            setProfile({
              fullName: profData.full_name ?? undefined,
              location:
                [profData.village, profData.district, profData.state].filter(Boolean).join(", ") ||
                undefined,
              farmSize: profData.farm_size ?? undefined,
              farmUnit: profData.farm_unit ?? undefined,
              soilType: profData.soil_type ?? undefined,
              soilPh: profData.soil_ph ?? undefined,
              nitrogen: profData.nitrogen ?? undefined,
              phosphorus: profData.phosphorus ?? undefined,
              potassium: profData.potassium ?? undefined,
              water: profData.water_availability ?? undefined,
              irrigation: profData.irrigation_type ?? undefined,
              season: profData.current_season ?? undefined,
              cropHistory: profData.crop_history ?? undefined,
              language: profData.language ?? undefined,
            });
          }

          // Load Chat History from Supabase
          const { data: chatHistory, error: chatErr } = await (supabase as any)
            .from("chat_messages")
            .select("role, content, created_at")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: true });

          if (!chatErr && chatHistory && chatHistory.length > 0 && isMounted) {
            setMessages(
              chatHistory.map((m: any) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                created_at: m.created_at,
              })),
            );
          }
        }
      } catch (err) {
        console.warn("Failed to load saved chat history:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLang(newLang);
    if (profile) {
      setProfile((prev: any) => prev ? { ...prev, language: newLang } : { language: newLang });
    }
    if (user?.id) {
      try {
        await supabase
          .from("profiles")
          .upsert({ user_id: user.id, language: newLang }, { onConflict: "user_id" });
        toast.success(`Language set to ${newLang} 🌱`);
      } catch (err) {
        console.warn("Failed to persist language in database:", err);
      }
    }
  };

  const saveMessageToSupabase = async (role: "user" | "assistant", content: string) => {
    if (!user?.id) return;
    try {
      await (supabase as any).from("chat_messages").insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.warn("Could not persist message to database:", err);
    }
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    setErrorState(null);
    const userMsg: Msg = { role: "user", content: q, created_at: new Date().toISOString() };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Save user message in database asynchronously
    saveMessageToSupabase("user", q);

    try {
      const response = await ask({
        data: { messages: next, language: lang, profile: profile ?? undefined },
      });

      const replyText = response?.reply || "Sorry, I couldn't generate a reply. Please try again.";
      const assistantMsg: Msg = {
        role: "assistant",
        content: replyText,
        created_at: new Date().toISOString(),
      };
      setMessages([...next, assistantMsg]);
      saveMessageToSupabase("assistant", replyText);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to reach AI assistant. Please check your connection.";
      setErrorState(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = async () => {
    if (confirm("Are you sure you want to clear your chat history?")) {
      if (user?.id) {
        try {
          await (supabase as any).from("chat_messages").delete().eq("user_id", user.id);
        } catch (err) {
          console.warn("Error clearing chat messages from database:", err);
        }
      }
      setMessages([
        {
          role: "assistant",
          content:
            "Chat history cleared. 👋 I am Green Harvest AI Assistant. How can I help you today?",
        },
      ]);
      toast.success("Chat history cleared.");
    }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser. Try Chrome on Android or desktop.");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const recog = new SR();
    recog.lang = LANGS[lang]?.code ?? "en-IN";
    recog.interimResults = true;
    recog.continuous = false;
    recog.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput(text);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        if (text.trim()) send(text);
      }
    };
    recog.onerror = (e: any) => {
      setListening(false);
      toast.error("Voice error: " + (e.error ?? "unknown"));
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    setListening(true);
    try {
      recog.start();
    } catch {
      setListening(false);
    }
  };

  useEffect(
    () => () => {
      try {
        recogRef.current?.stop();
      } catch {}
    },
    [],
  );

  return (
    <AppLayout variant="chat">
      <PageHeader
        title="Green Harvest AI Assistant"
        subtitle="Powered by Google Gemini · Multilingual Farming Intelligence"
        emoji="🤖"
      />

      {/* Top Action & Language Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/80 p-3 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Language:</label>
          <select
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {messages.length > 1 && (
          <button
            onClick={clearChatHistory}
            className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Messages List Container */}
      <div className="space-y-4 pb-36">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Loading your conversation history…</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`relative max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-xs bg-primary text-primary-foreground"
                    : "rounded-bl-xs border border-border/80 bg-card/95 text-foreground backdrop-blur-sm"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mb-1.5 flex items-center gap-1.5 border-b border-border/40 pb-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Green Harvest AI</span>
                  </div>
                )}
                <MarkdownRenderer content={m.content} />
              </div>
            </div>
          ))
        )}

        {/* Typing / Thinking Indicator */}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-xs border border-primary/30 bg-card/95 px-4 py-3 text-sm text-foreground shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-xs text-muted-foreground">Green Harvest AI is thinking</span>
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorState && !loading && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorState}</span>
            </div>
            <button
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                if (lastUserMsg) send(lastUserMsg.content);
              }}
              className="flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1 text-xs text-destructive-foreground hover:opacity-90"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* Quick Farming Specialization Suggestions */}
        {messages.length <= 2 && !loading && (
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Recommended Topics:</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CATEGORY_SUGGESTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.category}
                    onClick={() => send(item.prompt)}
                    className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card/90 p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-xs"
                  >
                    <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{item.category}</div>
                      <div className="line-clamp-1 text-[11px] text-muted-foreground">{item.prompt}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Fixed Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder={listening ? "Listening to your question…" : "Ask about crops, fertilizers, diseases, weather..."}
            className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleVoice}
            disabled={loading}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 ${listening ? "animate-pulse" : ""}`}
            style={{ background: listening ? "var(--gradient-fire)" : "var(--gradient-grape)" }}
            title={listening ? "Stop voice input" : "Voice input"}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
            title="Send Message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
