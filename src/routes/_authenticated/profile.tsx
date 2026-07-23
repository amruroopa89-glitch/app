import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Save, FileText, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Farmer Profile" },
      { name: "description", content: "Edit your farmer profile, soil values, and preferences." },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  full_name: string;
  age: number | "";
  gender: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  farm_size: number | "";
  farm_unit: string;
  language: string;
  irrigation_type: string;
  soil_type: string;
  soil_ph: number | "";
  nitrogen: number | "";
  phosphorus: number | "";
  potassium: number | "";
  water_availability: string;
  current_season: string;
  crop_history: string;
};

const empty: Profile = {
  full_name: "",
  age: "",
  gender: "Male",
  mobile: "",
  village: "",
  district: "",
  state: "",
  farm_size: "",
  farm_unit: "acres",
  language: "English",
  irrigation_type: "Drip",
  soil_type: "Loamy",
  soil_ph: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  water_availability: "Medium",
  current_season: "Kharif",
  crop_history: "",
};

function ProfilePage() {
  const [p, setP] = useState<Profile>(empty);
  const [schemes, setSchemes] = useState<Array<{ title: string; body: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      if (data) {
        setP({
          full_name: data.full_name ?? "",
          age: data.age ?? "",
          gender: data.gender ?? "Male",
          mobile: data.mobile ?? "",
          village: data.village ?? "",
          district: data.district ?? "",
          state: data.state ?? "",
          farm_size: data.farm_size ?? "",
          farm_unit: data.farm_unit ?? "acres",
          language: data.language ?? "English",
          irrigation_type: data.irrigation_type ?? "Drip",
          soil_type: data.soil_type ?? "Loamy",
          soil_ph: data.soil_ph ?? "",
          nitrogen: data.nitrogen ?? "",
          phosphorus: data.phosphorus ?? "",
          potassium: data.potassium ?? "",
          water_availability: data.water_availability ?? "Medium",
          current_season: data.current_season ?? "Kharif",
          crop_history: data.crop_history ?? "",
        });
      }
      const { data: sch } = await supabase
        .from("government_schemes")
        .select("title, body")
        .order("title");
      if (sch) {
        setSchemes(sch);
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = {
      user_id: u.user.id,
      ...p,
      age: p.age === "" ? null : p.age,
      farm_size: p.farm_size === "" ? null : p.farm_size,
      soil_ph: p.soil_ph === "" ? null : p.soil_ph,
      nitrogen: p.nitrogen === "" ? null : p.nitrogen,
      phosphorus: p.phosphorus === "" ? null : p.phosphorus,
      potassium: p.potassium === "" ? null : p.potassium,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved 🌱");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const useGPS = () => {
    if (!navigator.geolocation) return toast.error("GPS not available in this browser");
    toast.info("Fetching your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const j = await r.json();
          const a = j.address || {};
          setP((prev) => ({
            ...prev,
            village: a.village || a.hamlet || a.town || a.suburb || prev.village,
            district: a.state_district || a.county || a.city_district || prev.district,
            state: a.state || prev.state,
          }));
          toast.success("Location filled from GPS 📍");
        } catch {
          toast.error("Couldn't look up address. Please enter manually.");
        }
      },
      (e) => toast.error("GPS denied: " + e.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (loading)
    return (
      <AppLayout variant="profile">
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );

  return (
    <AppLayout variant="profile">
      <div
        className="rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl font-bold backdrop-blur">
            {(p.full_name || "F")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{p.full_name || "Your profile"}</h1>
            <p className="text-xs opacity-90">
              {[p.village, p.district, p.state].filter(Boolean).join(", ") || "Add your location"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="mt-5 space-y-4">
        <Card title="👤 Personal">
          <Grid>
            <Field
              label="Full name"
              value={p.full_name}
              onChange={(v) => setP({ ...p, full_name: v })}
            />
            <Field label="Mobile" value={p.mobile} onChange={(v) => setP({ ...p, mobile: v })} />
            <NumField label="Age" value={p.age} onChange={(v) => setP({ ...p, age: v })} />
            <SelectField
              label="Gender"
              value={p.gender}
              options={["Male", "Female", "Other"]}
              onChange={(v) => setP({ ...p, gender: v })}
            />
          </Grid>
        </Card>

        <Card title="📍 Location & farm">
          <button
            type="button"
            onClick={useGPS}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <MapPin className="h-3.5 w-3.5" /> Use my GPS location
          </button>
          <Grid>
            <Field label="Village" value={p.village} onChange={(v) => setP({ ...p, village: v })} />
            <Field
              label="District"
              value={p.district}
              onChange={(v) => setP({ ...p, district: v })}
            />
            <Field label="State" value={p.state} onChange={(v) => setP({ ...p, state: v })} />
            <NumField
              label="Farm size"
              value={p.farm_size}
              onChange={(v) => setP({ ...p, farm_size: v })}
              step={0.1}
            />
            <SelectField
              label="Unit"
              value={p.farm_unit}
              options={["acres", "hectares"]}
              onChange={(v) => setP({ ...p, farm_unit: v })}
            />
            <SelectField
              label="Irrigation"
              value={p.irrigation_type}
              options={["Drip", "Sprinkler", "Flood", "Rain-fed", "Canal"]}
              onChange={(v) => setP({ ...p, irrigation_type: v })}
            />
            <SelectField
              label="Language"
              value={p.language}
              options={[
                "English",
                "Hindi",
                "Telugu",
                "Tamil",
                "Kannada",
                "Marathi",
                "Bengali",
                "Gujarati",
              ]}
              onChange={(v) => setP({ ...p, language: v })}
            />
          </Grid>
        </Card>

        <Card title="🌱 Soil & Crop Values">
          <Grid>
            <SelectField
              label="Soil Type"
              value={p.soil_type}
              options={["Black", "Red", "Sandy", "Clay", "Loamy"]}
              onChange={(v) => setP({ ...p, soil_type: v })}
            />
            <NumField
              label="Soil pH"
              value={p.soil_ph}
              onChange={(v) => setP({ ...p, soil_ph: v })}
              step={0.1}
            />
            <NumField
              label="Nitrogen (N)"
              value={p.nitrogen}
              onChange={(v) => setP({ ...p, nitrogen: v })}
            />
            <NumField
              label="Phosphorus (P)"
              value={p.phosphorus}
              onChange={(v) => setP({ ...p, phosphorus: v })}
            />
            <NumField
              label="Potassium (K)"
              value={p.potassium}
              onChange={(v) => setP({ ...p, potassium: v })}
            />
            <SelectField
              label="Water availability"
              value={p.water_availability}
              options={["Low", "Medium", "High"]}
              onChange={(v) => setP({ ...p, water_availability: v })}
            />
            <SelectField
              label="Current season"
              value={p.current_season}
              options={["Kharif", "Rabi", "Zaid", "Summer"]}
              onChange={(v) => setP({ ...p, current_season: v })}
            />
            <Field
              label="Crop history"
              value={p.crop_history}
              onChange={(v) => setP({ ...p, crop_history: v })}
            />
          </Grid>
        </Card>

        <button
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{" "}
          Save profile
        </button>
      </form>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Government schemes</h2>
        <div className="space-y-2">
          {schemes.map((s) => (
            <div key={s.title} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={signOut}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-destructive"
      >
        <LogOut className="h-5 w-5" /> Sign out
      </button>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-sm font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="col-span-1 space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
}) {
  const [val, setVal] = useState<string>(
    value === "" || value === null || value === undefined ? "" : String(value)
  );

  useEffect(() => {
    setVal(value === "" || value === null || value === undefined ? "" : String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setVal(raw);
    if (raw === "") {
      onChange("");
    } else {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <div className="col-span-1 space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={val}
        onChange={handleChange}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="col-span-1 space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
