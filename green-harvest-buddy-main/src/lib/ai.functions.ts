import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  return res.json();
}

const SoilInput = z.object({
  soilType: z.string().min(1),
  soilPh: z.number().min(0).max(14),
  nitrogen: z.number().min(0),
  phosphorus: z.number().min(0),
  potassium: z.number().min(0),
  water: z.string().min(1),
  season: z.string().min(1),
  region: z.string().optional(),
  history: z.string().optional(),
});

export const recommendCrops = createServerFn({ method: "POST" })
  .inputValidator((d) => SoilInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are an expert agronomist for Indian farmers. Given soil and conditions, recommend EXACTLY 5 crops, ranked best to worst, that are realistic for the inputs. Return strictly via the provided function call.`;
    const user = `Soil type: ${data.soilType}
pH: ${data.soilPh}
N: ${data.nitrogen} kg/ha, P: ${data.phosphorus} kg/ha, K: ${data.potassium} kg/ha
Water availability: ${data.water}
Season: ${data.season}
Region: ${data.region ?? "India"}
Recent crop history: ${data.history ?? "unknown"}`;

    const json = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [{
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
      }],
      tool_choice: { type: "function", function: { name: "submit_recommendations" } },
    });

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no recommendations");
    return JSON.parse(args) as { recommendations: Array<{name:string;emoji:string;score:number;yield:string;water:string;fertilizer:string;profit:string;demand:string;tips:string}>; rationale: string };
  });

const ChatInput = z.object({
  messages: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().min(1).max(2000) })).min(1).max(30),
  language: z.string().optional(),
  profile: z.object({
    fullName: z.string().optional(),
    location: z.string().optional(),
    farmSize: z.union([z.number(), z.string()]).optional(),
    farmUnit: z.string().optional(),
    soilType: z.string().optional(),
    soilPh: z.number().optional(),
    nitrogen: z.number().optional(),
    phosphorus: z.number().optional(),
    potassium: z.number().optional(),
    water: z.string().optional(),
    irrigation: z.string().optional(),
    season: z.string().optional(),
    cropHistory: z.string().optional(),
  }).partial().optional(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data }) => {
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
    const json = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, ...data.messages],
      temperature: 0.7,
    });
    const reply = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return { reply };
  });

const DiseaseInput = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000),
  crop: z.string().optional(),
  language: z.string().optional(),
});

export const detectDisease = createServerFn({ method: "POST" })
  .inputValidator((d) => DiseaseInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are a plant pathologist. Look at the crop leaf image and identify any disease, pest damage, or nutrient deficiency. If the leaf looks healthy, say so. Always respond ONLY via the provided function call. Respond in ${data.language ?? "English"}.`;
    const json = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          { type: "text", text: `Crop hint: ${data.crop ?? "unknown"}. Diagnose this leaf.` },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ] },
      ],
      tools: [{
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
      }],
      tool_choice: { type: "function", function: { name: "submit_diagnosis" } },
    });
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI couldn't analyze the image. Try a clearer photo.");
    return JSON.parse(args) as { name: string; confidence: number; severity: string; symptoms: string; treatment: string; prevent: string };
  });