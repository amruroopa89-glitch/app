export const GREEN_HARVEST_SYSTEM_PROMPT = `You are Green Harvest AI Assistant.
Help farmers with:
- Crop recommendations
- Fertilizer suggestions
- Plant disease guidance
- Irrigation advice
- Weather-based farming tips
Provide simple and practical answers.`;

export type GeminiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GeminiProfileContext = {
  fullName?: string;
  location?: string;
  farmSize?: number | string;
  farmUnit?: string;
  soilType?: string;
  soilPh?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  water?: string;
  irrigation?: string;
  season?: string;
  cropHistory?: string;
};

export async function askGemini({
  messages,
  language = "English",
  profile,
}: {
  messages: GeminiChatMessage[];
  language?: string;
  profile?: GeminiProfileContext;
}): Promise<{ reply: string }> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
    );
  }

  // Format profile details if available
  const p = profile ?? {};
  const profileLines = [
    p.fullName && `Farmer: ${p.fullName}`,
    p.location && `Location: ${p.location}`,
    p.farmSize !== undefined &&
      p.farmSize !== "" &&
      `Farm size: ${p.farmSize} ${p.farmUnit ?? "acres"}`,
    p.soilType && `Soil type: ${p.soilType}`,
    p.soilPh !== undefined && `Soil pH: ${p.soilPh}`,
    (p.nitrogen !== undefined || p.phosphorus !== undefined || p.potassium !== undefined) &&
      `NPK (kg/ha): N=${p.nitrogen ?? "?"}, P=${p.phosphorus ?? "?"}, K=${p.potassium ?? "?"}`,
    p.water && `Water availability: ${p.water}`,
    p.irrigation && `Irrigation: ${p.irrigation}`,
    p.season && `Current season: ${p.season}`,
    p.cropHistory && `Recent crops: ${p.cropHistory}`,
  ]
    .filter(Boolean)
    .join("\n");

  let fullSystemInstruction = GREEN_HARVEST_SYSTEM_PROMPT;
  if (language && language !== "English") {
    fullSystemInstruction += `\nRespond in ${language}.`;
  }
  if (profileLines) {
    fullSystemInstruction += `\n\nFarmer context:\n${profileLines}`;
  }

  // Convert messages to Gemini format: 'user' or 'model'
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const payload = {
    systemInstruction: {
      parts: [{ text: fullSystemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini API error (${response.status}): ${errText || response.statusText}`);
      }

      const data = await response.json();
      const textResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ??
        "";

      if (textResponse.trim()) {
        return { reply: textResponse.trim() };
      }
    } catch (err: any) {
      console.warn(`Gemini model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API.");
}

export async function recommendCropsGemini(data: any): Promise<any> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY);

  if (!apiKey) return null;

  const prompt = `You are an expert agronomist for Indian agriculture.
ANALYZE these specific farming conditions carefully:
- Soil Type: ${data.soilType}
- pH: ${data.soilPh}
- NPK Values (kg/ha): N=${data.nitrogen}, P=${data.phosphorus}, K=${data.potassium}
- Water Availability: ${data.water}
- Season: ${data.season}
- Region / Location: ${data.region || "India"}
- Recent Crop History: ${data.history || "None"}

CRITICAL INSTRUCTION: Tailor your crop selection strictly to the provided Soil Type, pH, NPK levels, Region, Water availability, and Season. Do NOT recommend water-intensive or unsuitable crops if soil type, water level, or region are incompatible.

Recommend EXACTLY 5 crops ranked best to worst for THESE specific inputs.
Return ONLY valid JSON in this exact structure without markdown code blocks:
{
  "recommendations": [
    {
      "name": "Crop Name",
      "emoji": "🌾",
      "score": 95,
      "yield": "2.5 t/acre",
      "water": "Medium",
      "fertilizer": "NPK ratio",
      "profit": "₹25,000/acre",
      "demand": "High",
      "tips": "Specific advice for this crop under specified soil/climate."
    }
  ],
  "rationale": "Detailed explanation of why these 5 crops fit the specific soil type (${data.soilType}), pH (${data.soilPh}), NPK levels, season (${data.season}), and location (${data.region || "India"})."
}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
    },
  };

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) continue;

      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleanedText = rawText.replace(/```json\s*/g, "").replace(/```/g, "").trim();

      if (cleanedText) {
        const parsed = JSON.parse(cleanedText);
        if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Gemini crop recommendation error:", e);
    }
  }

  return null;
}
