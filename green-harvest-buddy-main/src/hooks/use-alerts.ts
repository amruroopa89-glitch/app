import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { alerts as mockAlerts } from "@/lib/mock-data";

export type Alert = {
  icon: string;
  title: string;
  body: string;
};

export function useAlerts(state?: string | null) {
  return useQuery<Alert[]>({
    queryKey: ["crop_alerts", state],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crop_alerts")
        .select("icon, title, body, state")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error || !data || data.length === 0) return mockAlerts;

      // Show national alerts + state-specific alerts for the farmer's state
      return data
        .filter((a) => !a.state || a.state === state)
        .slice(0, 4)
        .map((a) => ({ icon: a.icon, title: a.title, body: a.body }));
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
