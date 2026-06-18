import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MandiPrice = {
  crop: string;
  price: string;
  trend: string;
};

export function useMandi(state?: string | null) {
  return useQuery<MandiPrice[]>({
    queryKey: ["mandi_prices", state],
    queryFn: async () => {
      // Prefer state-specific prices; fall back to national
      const { data, error } = await supabase
        .from("mandi_prices")
        .select("crop, price_inr, unit, change_pct, state")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) return [];

      // Prefer farmer's state, then national
      const stateRows = state ? data.filter((r) => r.state === state) : [];
      const nationalRows = data.filter((r) => !r.state);
      const merged = [...stateRows, ...nationalRows];

      // Deduplicate by crop name, highest change_pct first
      const seen = new Set<string>();
      const deduped = merged
        .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
        .filter((r) => {
          if (seen.has(r.crop)) return false;
          seen.add(r.crop);
          return true;
        })
        .slice(0, 3);

      return deduped.map((r) => ({
        crop: r.crop,
        price: `₹${r.price_inr.toLocaleString("en-IN")}`,
        trend: (r.change_pct >= 0 ? "+" : "") + r.change_pct.toFixed(1) + "%",
      }));
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
