import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useState, useEffect, useRef } from "react";
import { useAskAssistant } from "@/lib/ai-client";
import { supabase } from "@/integrations/supabase/client";
import { Send, Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Farming Assistant" }, { name: "description", content: "Chat with AI for crop, pest, fertilizer and irrigation guidance." }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Best fertilizer for groundnut?",
  "Yellow leaves on cotton — what to do?",
  "When to sow maize this season?",
  "How to control pink bollworm organically?",
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
    { role: "assistant", content: "Hi! 👋 I'm your AI farming assistant. Ask me anything about crops, soil, pests, fertilizers or irrigation." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<string>("English");
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.from("profiles").select("full_name,village,district,state,farm_size,farm_unit,soil_type,soil_ph,nitrogen,phosphorus,potassium,water_availability,irrigation_type,current_season,crop_history").maybeSingle().then(({ data }) => {
      if (!data) return;
      setProfile({
        fullName: data.full_name ?? undefined,
        location: [data.village, data.district, data.state].filter(Boolean).join(", ") || undefined,
        farmSize: data.farm_size ?? undefined,
        farmUnit: data.farm_unit ?? undefined,
        soilType: data.soil_type ?? undefined,
        soilPh: data.soil_ph ?? undefined,
        nitrogen: data.nitrogen ?? undefined,
        phosphorus: data.phosphorus ?? undefined,
        potassium: data.potassium ?? undefined,
        water: data.water_availability ?? undefined,
        irrigation: data.irrigation_type ?? undefined,
        season: data.current_season ?? undefined,
        cropHistory: data.crop_history ?? undefined,
      });
    });
  }, []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { messages: next, language: lang, profile: profile ?? undefined } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      toast.error((err as Error).message);
      setMessages(next);
    } finally {
      setLoading(false);
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
    recog.onerror = (e: any) => { setListening(false); toast.error("Voice error: " + (e.error ?? "unknown")); };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    setListening(true);
    try { recog.start(); } catch { setListening(false); }
  };

  useEffect(() => () => { try { recogRef.current?.stop(); } catch {} }, []);

  return (
    <AppLayout variant="chat">
      <PageHeader title="AI Assistant" subtitle="Voice or text · 8 languages" emoji="🤖" />

      <div className="mb-3 flex items-center gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Language</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary">
          {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="space-y-3 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-[var(--shadow-card)] ${m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-foreground border border-border"}`}>
              {m.role === "assistant" && <Sparkles className="mb-1 inline h-3.5 w-3.5 text-primary mr-1" />}
              <MarkdownRenderer content={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted">{s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={listening ? "Listening…" : "Ask anything about farming..."}
            className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            disabled={loading}
          />
          <button type="button" onClick={toggleVoice} className={`flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)] ${listening ? "animate-pulse" : ""}`} style={{ background: listening ? "var(--gradient-fire)" : "var(--gradient-grape)" }}>
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button onClick={() => send(input)} disabled={loading} className="flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
