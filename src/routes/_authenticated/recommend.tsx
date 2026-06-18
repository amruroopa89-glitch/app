import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recommendCrops } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Droplets, Sprout, TrendingUp, Coins, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommend")({
  head: () => ({ meta: [{ title: "AI Crop Recommendations" }, { name: "description", content: "Enter your soil values and get AI-powered crop recommendations." }] }),
  component: RecommendPage,
});

const SOILS = ["Black", "Red", "Sandy", "Clay", "Loamy"];
const WATER = ["Low", "Medium", "High"];
const SEASONS = ["Kharif", "Rabi", "Zaid", "Summer"];

type Rec = { name: string; emoji: string; score: number; yield: string; water: string; fertilizer: string; profit: string; demand: string; tips: string };

function RecommendPage() {
  const call = useServerFn(recommendCrops);
  const [form, setForm] = useState({
    soilType: "Loamy", soilPh: 6.5, nitrogen: 40, phosphorus: 30, potassium: 30,
    water: "Medium", season: "Kharif", region: "", history: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Rec[] | null>(null);
  const [rationale, setRationale] = useState("");

  const gradients = [
    "var(--gradient-primary)",
    "var(--gradient-ocean)",
    "var(--gradient-mango)",
    "var(--gradient-berry)",
    "var(--gradient-grape)",
  ];

  useEffect(() => {
    supabase.from("profiles").select("soil_type,soil_ph,nitrogen,phosphorus,potassium,water_availability,current_season,district,state,crop_history").maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm((f) => ({
        ...f,
        soilType: data.soil_type || f.soilType,
        soilPh: data.soil_ph ?? f.soilPh,
        nitrogen: data.nitrogen ?? f.nitrogen,
        phosphorus: data.phosphorus ?? f.phosphorus,
        potassium: data.potassium ?? f.potassium,
        water: data.water_availability || f.water,
        season: data.current_season || f.season,
        region: [data.district, data.state].filter(Boolean).join(", "),
        history: data.crop_history || "",
      }));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    try {
      const out = await call({ data: form });
      setResults(out.recommendations);
      setRationale(out.rationale);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout variant="crops">
      <PageHeader title="AI Crop Recommendation" subtitle="Enter your soil values, get tailored crops" emoji="🌾" />

      <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-4">
        <Select label="Soil Type" value={form.soilType} options={SOILS} onChange={(v) => setForm({ ...form, soilType: v })} />
        <Num label="Soil pH (0–14)" value={form.soilPh} step={0.1} onChange={(v) => setForm({ ...form, soilPh: v })} />
        <div className="grid grid-cols-3 gap-3">
          <Num label="N (kg/ha)" value={form.nitrogen} onChange={(v) => setForm({ ...form, nitrogen: v })} />
          <Num label="P (kg/ha)" value={form.phosphorus} onChange={(v) => setForm({ ...form, phosphorus: v })} />
          <Num label="K (kg/ha)" value={form.potassium} onChange={(v) => setForm({ ...form, potassium: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Water" value={form.water} options={WATER} onChange={(v) => setForm({ ...form, water: v })} />
          <Select label="Season" value={form.season} options={SEASONS} onChange={(v) => setForm({ ...form, season: v })} />
        </div>
        <Text label="Region (district, state)" value={form.region} onChange={(v) => setForm({ ...form, region: v })} placeholder="e.g. Anantapur, Andhra Pradesh" />
        <Text label="Recent crop history" value={form.history} onChange={(v) => setForm({ ...form, history: v })} placeholder="e.g. groundnut, cotton, fallow" />

        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {loading ? "Analyzing soil..." : "Get AI Recommendations"}
        </button>
      </form>

      {results && (
        <div className="mt-6 space-y-4">
          {rationale && (
            <div className="rounded-2xl bg-muted p-3 text-xs text-foreground">
              <span className="font-semibold">AI analysis: </span>{rationale}
            </div>
          )}
          {results.map((c, i) => (
            <article key={c.name + i} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
              <header className="flex items-center gap-4 p-4 text-primary-foreground" style={{ background: gradients[i % gradients.length] }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-4xl shadow">{c.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{c.name}</h2>
                    {i === 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">BEST PICK</span>}
                  </div>
                  <p className="text-sm opacity-90">Demand: {c.demand}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold leading-none">{Math.round(c.score)}</div>
                  <div className="text-xs">% match</div>
                </div>
              </header>
              <div className="grid grid-cols-2 gap-3 p-4">
                <Stat icon={<Sprout className="h-4 w-4" />} label="Yield" value={c.yield} />
                <Stat icon={<Coins className="h-4 w-4" />} label="Profit" value={c.profit} />
                <Stat icon={<Droplets className="h-4 w-4" />} label="Water" value={c.water} />
                <Stat icon={<TrendingUp className="h-4 w-4" />} label="Fertilizer" value={c.fertilizer} />
              </div>
              <div className="mx-4 mb-4 rounded-xl bg-muted p-3 text-xs text-foreground">
                💡 <span className="font-semibold">Tip:</span> {c.tips}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) { return <label className="text-xs font-semibold text-muted-foreground">{children}</label>; }
function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
