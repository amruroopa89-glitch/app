import { createFileRoute } from "@tanstack/react-router";
import { recommendCrops } from "../../lib/ai.functions";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/recommend")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, { headers: corsHeaders });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const result = await (recommendCrops as any).handler({ data: body });
          return Response.json(result, { headers: corsHeaders });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
        }
      },
    },
  },
});
