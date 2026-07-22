import { useServerFn } from "@tanstack/react-start";
import { askAssistant as serverAsk, recommendCrops as serverRecommend, detectDisease as serverDetect } from "./ai.functions";

async function fetchOpenRouter(messages: any[], options: { model: string; tools?: any[]; tool_choice?: any }) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Client API key not configured");

  const body: any = {
    model: options.model,
    messages,
    temperature: 0.7,
  };
  if (options.tools) {
    body.tools = options.tools;
    body.tool_choice = options.tool_choice;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://green-harvest-buddy.com",
      "X-Title": "Green Harvest Buddy",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API error ${res.status}: ${errText || res.statusText}`);
  }

  return res.json();
}

function parseJSONResponse(json: any) {
  const message = json.choices?.[0]?.message;
  if (!message) throw new Error("Empty response from AI");

  // Try parsing from tool calls first
  const toolCallArgs = message.tool_calls?.[0]?.function?.arguments;
  if (toolCallArgs) {
    try {
      return JSON.parse(toolCallArgs);
    } catch (e) {
      console.warn("Failed to parse tool call arguments", e);
    }
  }

  // Try parsing JSON from the main text content (fallback)
  const content = message.content;
  if (content) {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse JSON from content", content, e);
    }
  }

  throw new Error("Could not parse structured JSON response from AI");
}

export function useAskAssistant() {
  const serverFn = useServerFn(serverAsk);

  return async (req: { data: any }) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (apiKey) {
      const data = req.data;
      const p = data.profile ?? {};
      const profileLines = [
        p.fullName && `Farmer: ${p.fullName}`,
        p.location && `Location: ${p.location}`,
        (p.farmSize !== undefined && p.farmSize !== "") && `Farm size: ${p.farmSize} ${p.farmUnit ?? "acres"}`,
        p.soilType && `Soil type: ${p.soilType}`,
        p.soilPh !== undefined && `Soil pH: ${p.soilPh}`,
        (p.nitrogen !== undefined || p.phosphorus !== undefined || p.potassium !== undefined) &&
          `NPK (kg/ha): N=${p.nitrogen ?? "?"}, P=${p.phosphorus ?? "?"}, K=${p.potassium ?? "?"}`,
        p.water && `Water availability: ${p.water}`,
        p.irrigation && `Irrigation: ${p.irrigation}`,
        p.season && `Current season: ${p.season}`,
        p.cropHistory && `Recent crops: ${p.cropHistory}`,
      ].filter(Boolean).join("\n");

      const hasProfile = profileLines.length > 0;
      const sys = `You are a friendly, practical AI farming assistant for Indian smallholder farmers. Be concise (3-6 sentences), give specific actionable advice with quantities and timing, mention organic alternatives when sensible. Respond ONLY in ${data.language ?? "English"} — translate every word including crop and chemical names where common translations exist. If unsure, say so briefly.

${hasProfile ? `IMPORTANT — Tailor every answer to THIS farmer's specific situation below. Reference their soil, water, season, or location whenever relevant. Do not give generic advice when their data tells you something specific (e.g. low pH → recommend lime; sandy soil → adjust irrigation; low N → suggest urea dose for their farm size).

Farmer profile:
${profileLines}` : `The farmer has not filled their profile yet — give general best-practice advice and gently suggest they complete their profile for personalised guidance.`}`;

      const model = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
      const json = await fetchOpenRouter(
        [{ role: "system", content: sys }, ...data.messages],
        { model }
      );
      const reply = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
      return { reply };
    }

    return serverFn(req);
  };
}

export function useRecommendCrops() {
  const serverFn = useServerFn(serverRecommend);

  return async (req: { data: any }) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (apiKey) {
      const data = req.data;
      const sys = `You are an expert agronomist for Indian farmers. Given soil and conditions, recommend EXACTLY 5 crops, ranked best to worst, that are realistic for the inputs. Return strictly via the provided function call.`;
      const user = `Soil type: ${data.soilType}
pH: ${data.soilPh}
N: ${data.nitrogen} kg/ha, P: ${data.phosphorus} kg/ha, K: ${data.potassium} kg/ha
Water availability: ${data.water}
Season: ${data.season}
Region: ${data.region ?? "India"}
Recent crop history: ${data.history ?? "unknown"}`;

      const tools = [{
        type: "function",
        function: {
          name: "submit_recommendations",
          description: "Return 5 ranked crop recommendations.",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array", minItems: 5, maxItems: 5,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    emoji: { type: "string", description: "single emoji" },
                    score: { type: "number", description: "suitability % 0-100" },
                    yield: { type: "string", description: "e.g. 2.4 t/acre" },
                    water: { type: "string", enum: ["Low", "Medium", "High"] },
                    fertilizer: { type: "string" },
                    profit: { type: "string", description: "₹/acre" },
                    demand: { type: "string", enum: ["Low", "Medium", "High"] },
                    tips: { type: "string", description: "1-2 short sentences" },
                  },
                  required: ["name","emoji","score","yield","water","fertilizer","profit","demand","tips"],
                  additionalProperties: false,
                },
              },
              rationale: { type: "string" },
            },
            required: ["recommendations", "rationale"],
            additionalProperties: false,
          },
        },
      }];

      const model = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
      const json = await fetchOpenRouter(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        {
          model,
          tools,
          tool_choice: { type: "function", function: { name: "submit_recommendations" } }
        }
      );

      const parsed = parseJSONResponse(json);
      if (parsed && (parsed.recommendations || Array.isArray(parsed))) {
        const rawRecs = parsed.recommendations || (Array.isArray(parsed) ? parsed : []);
        const CROP_DB: Record<string, any> = {
          Paddy: { emoji: "🌾", yield: "2.5 t/acre", water: "High", fertilizer: "NPK 120:60:60", profit: "₹25,000/acre", demand: "High", tips: "Maintain standing water during early growth phase." },
          Cotton: { emoji: "🌱", yield: "1.2 t/acre", water: "Medium", fertilizer: "NPK 80:40:40", profit: "₹30,000/acre", demand: "High", tips: "Monitor regularly for sucking pests and pink bollworm." },
          Groundnut: { emoji: "🥜", yield: "1.0 t/acre", water: "Low", fertilizer: "NPK 20:40:20 + Gypsum", profit: "₹22,000/acre", demand: "Medium", tips: "Apply gypsum at 200 kg/acre at pegging stage." },
          Maize: { emoji: "🌽", yield: "3.0 t/acre", water: "Medium", fertilizer: "NPK 120:60:50", profit: "₹20,000/acre", demand: "High", tips: "Ensure proper earthing up at 30-35 days after sowing." },
          Wheat: { emoji: "🌾", yield: "2.0 t/acre", water: "Medium", fertilizer: "NPK 120:50:50", profit: "₹22,000/acre", demand: "High", tips: "Ensure critical irrigation at crown root initiation." },
          Sorghum: { emoji: "🌾", yield: "1.5 t/acre", water: "Low", fertilizer: "NPK 80:40:40", profit: "₹18,000/acre", demand: "Medium", tips: "Drought-tolerant crop suitable for dryland agriculture." },
        };
        const normalized = rawRecs.map((item: any, idx: number) => {
          let name = typeof item === "string" ? item : (item?.name || item?.crop || `Crop ${idx + 1}`);
          let score = parseFloat(typeof item === "object" ? item?.score : "") || (95 - idx * 5);
          if (score > 100) score /= 10;
          const db = CROP_DB[name] || {};
          return {
            name,
            emoji: (typeof item === "object" && item?.emoji) || db.emoji || "🌾",
            score: Math.min(100, Math.max(50, Math.round(score))),
            yield: (typeof item === "object" && item?.yield) || db.yield || "2.0 t/acre",
            water: (typeof item === "object" && item?.water) || db.water || "Medium",
            fertilizer: (typeof item === "object" && item?.fertilizer) || db.fertilizer || "NPK Balanced",
            profit: (typeof item === "object" && item?.profit) || db.profit || "₹25,000/acre",
            demand: (typeof item === "object" && item?.demand) || db.demand || "High",
            tips: (typeof item === "object" && item?.tips) || db.tips || "Follow standard agronomic practices.",
          };
        });
        return { recommendations: normalized.slice(0, 5), rationale: parsed.rationale || "Recommended crops based on soil conditions." };
      }
      return parsed;
    }

    return serverFn(req);
  };
}

export function useDetectDisease() {
  const serverFn = useServerFn(serverDetect);

  return async (req: { data: any }) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (apiKey) {
      const data = req.data;
      const sys = `You are a plant pathologist. Look at the crop leaf image and identify any disease, pest damage, or nutrient deficiency. If the leaf looks healthy, say so. Always respond ONLY via the provided function call. Respond in ${data.language ?? "English"}.`;
      
      const tools = [{
        type: "function",
        function: {
          name: "submit_diagnosis",
          description: "Return the diagnosis.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Disease / issue name, or 'Healthy leaf'" },
              confidence: { type: "number", description: "0-100" },
              severity: { type: "string", enum: ["None","Mild","Moderate","Severe"] },
              symptoms: { type: "string" },
              treatment: { type: "string", description: "Specific chemical & organic options with dosage" },
              prevent: { type: "string" },
            },
            required: ["name","confidence","severity","symptoms","treatment","prevent"],
            additionalProperties: false,
          },
        },
      }];

      const model = import.meta.env.VITE_OPENROUTER_VISION_MODEL || "openrouter/free";
      const json = await fetchOpenRouter(
        [
          { role: "system", content: sys },
          { role: "user", content: [
            { type: "text", text: `Crop hint: ${data.crop ?? "unknown"}. Diagnose this leaf.` },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ] },
        ],
        {
          model,
          tools,
          tool_choice: { type: "function", function: { name: "submit_diagnosis" } }
        }
      );

      return parseJSONResponse(json);
    }

    return serverFn(req);
  };
}
