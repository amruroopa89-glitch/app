import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sprout, MessageCircle, Camera, User } from "lucide-react";
import type { ReactNode } from "react";
import bgHome from "@/assets/bg-home.jpg";
import bgCrops from "@/assets/bg-crops.jpg";
import bgChat from "@/assets/bg-chat.jpg";
import bgDisease from "@/assets/bg-disease.jpg";
import bgProfile from "@/assets/bg-profile.jpg";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/recommend", label: "Crops", icon: Sprout },
  { to: "/chat", label: "Assistant", icon: MessageCircle },
  { to: "/disease", label: "Diagnose", icon: Camera },
  { to: "/profile", label: "Profile", icon: User },
] as const;

type Variant = "home" | "crops" | "chat" | "disease" | "profile";

const VARIANTS: Record<Variant, { bg: string; blobs: string[]; emoji: string[]; image: string }> = {
  home: {
    bg: "linear-gradient(160deg, oklch(0.96 0.05 130), oklch(0.94 0.07 90), oklch(0.93 0.06 200))",
    blobs: [
      "oklch(0.78 0.18 130 / 0.35)",
      "oklch(0.82 0.18 85 / 0.30)",
      "oklch(0.78 0.16 200 / 0.28)",
      "oklch(0.8 0.18 50 / 0.30)",
    ],
    emoji: ["🌾", "🌽", "☀️", "🌱", "🚜"],
    image: bgHome,
  },
  crops: {
    bg: "linear-gradient(160deg, oklch(0.95 0.08 145), oklch(0.93 0.09 110), oklch(0.94 0.07 70))",
    blobs: [
      "oklch(0.7 0.2 145 / 0.32)",
      "oklch(0.8 0.2 95 / 0.32)",
      "oklch(0.75 0.18 60 / 0.28)",
      "oklch(0.78 0.16 170 / 0.28)",
    ],
    emoji: ["🌱", "🌾", "🥬", "🌽", "🍅"],
    image: bgCrops,
  },
  chat: {
    bg: "linear-gradient(160deg, oklch(0.95 0.07 260), oklch(0.94 0.08 200), oklch(0.95 0.06 145))",
    blobs: [
      "oklch(0.7 0.2 280 / 0.30)",
      "oklch(0.75 0.2 220 / 0.30)",
      "oklch(0.78 0.18 160 / 0.28)",
      "oklch(0.8 0.18 90 / 0.28)",
    ],
    emoji: ["💬", "🤖", "🌿", "💡", "🌾"],
    image: bgChat,
  },
  disease: {
    bg: "linear-gradient(160deg, oklch(0.95 0.07 40), oklch(0.94 0.08 80), oklch(0.95 0.06 140))",
    blobs: [
      "oklch(0.75 0.22 35 / 0.32)",
      "oklch(0.8 0.2 75 / 0.30)",
      "oklch(0.72 0.2 140 / 0.28)",
      "oklch(0.78 0.2 20 / 0.28)",
    ],
    emoji: ["🔬", "🍃", "📷", "🌿", "🩺"],
    image: bgDisease,
  },
  profile: {
    bg: "linear-gradient(160deg, oklch(0.95 0.07 50), oklch(0.94 0.08 130), oklch(0.95 0.06 200))",
    blobs: [
      "oklch(0.78 0.18 50 / 0.30)",
      "oklch(0.75 0.18 145 / 0.30)",
      "oklch(0.78 0.16 220 / 0.28)",
      "oklch(0.8 0.18 90 / 0.28)",
    ],
    emoji: ["👨‍🌾", "🌾", "🏡", "🚜", "🌱"],
    image: bgProfile,
  },
};

export function AppLayout({
  children,
  variant = "home",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const { pathname } = useLocation();
  const v = VARIANTS[variant];
  return (
    <div className="relative min-h-screen pb-24" style={{ background: v.bg }}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={v.image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.28 }}
        />
        <div className="absolute inset-0 bg-white/40" />
        <div
          className="absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ background: v.blobs[0] }}
        />
        <div
          className="absolute -right-16 top-40 h-64 w-64 rounded-full blur-3xl"
          style={{ background: v.blobs[1] }}
        />
        <div
          className="absolute left-1/3 bottom-32 h-80 w-80 rounded-full blur-3xl"
          style={{ background: v.blobs[2] }}
        />
        <div
          className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full blur-3xl"
          style={{ background: v.blobs[3] }}
        />
        {v.emoji.map((e, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute select-none opacity-[0.09]"
            style={{
              fontSize: `${90 + i * 22}px`,
              top: `${(i * 23 + 8) % 80}%`,
              left: `${(i * 37 + 12) % 85}%`,
              transform: `rotate(${i * 17 - 20}deg)`,
            }}
          >
            {e}
          </span>
        ))}
      </div>
      <main className="relative z-10 mx-auto max-w-2xl px-4 pt-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
