import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useWeather } from "@/hooks/use-weather";
import { useAlerts } from "@/hooks/use-alerts";
import { useMandi } from "@/hooks/use-mandi";
import {
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  TrendingUp,
  Bell,
  Leaf,
  Sprout,
  MessageCircle,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Crop Recommendation" },
      { name: "description", content: "Personalized farmer dashboard with weather, crops and AI tools." },
    ],
  }),
  component: Dashboard,
});

function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} animate-pulse rounded-lg bg-white/25`} />;
}

function SkeletonCard() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
      <SkeletonLine w="w-1/2" h="h-3" />
      <SkeletonLine w="w-3/4" h="h-3" />
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return data;
    },
  });

  const { weather, isLoading: weatherLoading } = useWeather();
  const { data: alerts, isLoading: alertsLoading } = useAlerts(profile?.state);
  const { data: mandi, isLoading: mandiLoading } = useMandi(profile?.state);

  const name = profile?.full_name || "Farmer";
  const place =
    [profile?.village, profile?.district].filter(Boolean).join(", ") ||
    "Add your location";

  return (
    <AppLayout variant="home">
      {/* ── Hero / Weather Card ── */}
      <div
        className="rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">Namaste 🙏</p>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="mt-1 text-sm opacity-90">{place}</p>
          </div>
          <Leaf className="h-10 w-10 opacity-80" />
        </div>

        {weatherLoading ? (
          <div className="mt-4 space-y-2 rounded-2xl bg-white/15 p-3 backdrop-blur">
            <SkeletonLine w="w-1/3" h="h-8" />
            <SkeletonLine w="w-1/2" h="h-3" />
          </div>
        ) : weather ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur">
              <Thermometer className="h-6 w-6" />
              <div className="flex-1">
                <div className="text-2xl font-bold leading-tight">{weather.temp}°C</div>
                <div className="text-xs opacity-90">{weather.condition}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <Droplets className="h-4 w-4" />
                  {weather.humidity}%
                </div>
                <div className="flex flex-col items-center">
                  <Cloud className="h-4 w-4" />
                  {weather.rainfall}mm
                </div>
                <div className="flex flex-col items-center">
                  <Wind className="h-4 w-4" />
                  {weather.wind}km/h
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between gap-2">
              {weather.forecast.map((f: any) => (
                <div
                  key={f.day}
                  className="flex flex-1 flex-col items-center rounded-xl bg-white/10 py-2 text-xs"
                >
                  <span>{f.day}</span>
                  <span className="text-base">{f.icon}</span>
                  <span className="font-semibold">{f.t}°</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl bg-white/15 p-3 text-center text-sm opacity-80 backdrop-blur">
            📍 Add your location in Profile for live weather
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <section className="mt-6 grid grid-cols-3 gap-3">
        <QuickAction
          to="/recommend"
          icon={<Sprout className="h-6 w-6" />}
          label="Recommend"
          gradient="var(--gradient-primary)"
        />
        <QuickAction
          to="/chat"
          icon={<MessageCircle className="h-6 w-6" />}
          label="Ask AI"
          gradient="var(--gradient-grape)"
        />
        <QuickAction
          to="/disease"
          icon={<Camera className="h-6 w-6" />}
          label="Diagnose"
          gradient="var(--gradient-fire)"
        />
      </section>

      {/* ── Farming Alerts ── */}
      <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-mango)" }}
          >
            <Bell className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Farming alerts</h2>
        </div>
        <div className="grid gap-2">
          {alertsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            alerts?.map((a) => (
              <div
                key={a.title}
                className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-3"
              >
                <div className="text-2xl">{a.icon}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Mandi Prices ── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-ocean)" }}
          >
            <TrendingUp className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Mandi prices today</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {mandiLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/60 p-3 space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted" />
                <div className="h-5 animate-pulse rounded bg-muted" />
                <div className="h-3 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : (
            mandi?.map((m) => (
              <div key={m.crop} className="rounded-xl bg-muted/60 p-3">
                <div className="font-semibold text-foreground">{m.crop}</div>
                <div className="text-base font-bold text-primary">{m.price}</div>
                <div className={m.trend.startsWith("+") ? "text-green-600" : "text-destructive"}>
                  {m.trend}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function QuickAction({
  to,
  icon,
  label,
  gradient,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)] transition active:scale-95"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </Link>
  );
}