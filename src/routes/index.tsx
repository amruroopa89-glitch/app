import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CloudRain, Bug, TrendingUp, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import farmerMascot from "@/assets/farmer-mascot.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Crop Recommendation" },
      { name: "description", content: "Smart farming for every farmer." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-primary-foreground"
      style={{ background: "var(--gradient-welcome)" }}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--welcome-glow)] blur-3xl" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-5 pb-8 pt-10 text-center sm:pt-12">
        <header>
          <h1 className="font-serif text-4xl font-semibold italic tracking-tight sm:text-6xl">
            Grow Smarter with <span className="text-accent">AI</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed sm:text-xl">
            Personalized crop recommendations, instant disease detection,
            <br className="hidden sm:block" /> and real-time market insights — all in your pocket.
          </p>
        </header>

        <img
          src={farmerMascot}
          alt="Smiling farmer holding fresh vegetables and wheat"
          width={768}
          height={1024}
          className="mt-5 h-72 w-auto object-contain drop-shadow-2xl sm:h-80"
        />

        <div className="mt-2 flex w-full max-w-xl flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="h-16 rounded-3xl bg-[var(--gradient-welcome-action)] text-lg font-bold shadow-[var(--shadow-welcome)] hover:opacity-95"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-3xl border-[var(--welcome-line)] bg-transparent text-base font-semibold text-primary-foreground shadow-none hover:bg-[var(--welcome-glow)] hover:text-primary-foreground"
          >
            <Link to="/auth" search={{ mode: "signin" }}>
              Already have an account? Sign In
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Feature icon={<CloudRain />} label="Weather Alerts" />
          <Feature icon={<Bug />} label="Pest Warnings" />
          <Feature icon={<TrendingUp />} label="Market Prices" />
          <Feature icon={<Droplets />} label="Water Tips" />
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--welcome-panel)] px-3 py-4 text-[var(--welcome-ink)] shadow-[var(--shadow-welcome)]">
      <span className="text-primary [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}
