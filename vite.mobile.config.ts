import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Mobile-specific Vite config — pure static SPA for Capacitor (no SSR)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    root: "mobile",
    build: {
      outDir: "../dist/mobile",
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, "mobile/index.html"),
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        // Stub out server-only modules
        "@tanstack/start-server-core": path.resolve(__dirname, "mobile/stubs/empty.ts"),
        "@tanstack/react-start/server": path.resolve(__dirname, "mobile/stubs/empty.ts"),
        "@tanstack/start-storage-context": path.resolve(__dirname, "mobile/stubs/empty.ts"),
        "node:async_hooks": path.resolve(__dirname, "mobile/stubs/empty.ts"),
      },
    },
    optimizeDeps: {
      exclude: [
        "@tanstack/react-start",
        "@tanstack/start-server-core",
        "@tanstack/start-storage-context",
      ],
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      // Inject Supabase env vars at build time
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://agvxymhumrrrwstfyuvk.supabase.co"
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_hsYnQuuXXTZulmg2AG67SQ_NogYXAkQ"
      ),
      "import.meta.env.VITE_OPENROUTER_API_KEY": JSON.stringify(
        env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ""
      ),
      "import.meta.env.VITE_OPENROUTER_MODEL": JSON.stringify(
        env.OPENROUTER_MODEL || env.VITE_OPENROUTER_MODEL || "openai/gpt-oss-20b:free"
      ),
      "import.meta.env.VITE_OPENROUTER_VISION_MODEL": JSON.stringify(
        env.OPENROUTER_VISION_MODEL || env.VITE_OPENROUTER_VISION_MODEL || "openrouter/free"
      ),
    },
  };
});

