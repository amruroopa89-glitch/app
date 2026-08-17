export const GREEN_HARVEST_SYSTEM_PROMPT = `You are Green Harvest AI Assistant.
Help farmers with:
- Crop recommendations
- Fertilizer suggestions
- Plant disease guidance
- Irrigation advice
- Weather-based farming tips
Provide clear, structured, step-by-step answers using numbered steps (e.g. 1, 2, 3...) for all inquiries. Make all guidance easy to follow, simple, and highly practical.`;

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
    fullSystemInstruction += `\n\nCRITICAL MANDATORY INSTRUCTION: You MUST write your entire response 100% in ${language} using native ${language} script (for example, Telugu script for Telugu, Hindi Devanagari for Hindi, Tamil script for Tamil, Kannada script for Kannada, Marathi for Marathi, Bengali for Bengali, Gujarati for Gujarati). DO NOT respond in English under any circumstances when ${language} is selected.`;
  }

  // Convert messages to Gemini format: 'user' or 'model'
  // Gemini API requires that the conversation history:
  // 1. Starts with a 'user' turn (skip any leading model/assistant turns like greeting messages).
  // 2. Alternates strictly between 'user' and 'model'.
  const contents: any[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const role = m.role === "assistant" ? "model" : "user";
    
    // Skip any leading model/assistant turns
    if (contents.length === 0 && role === "model") {
      continue;
    }
    
    // If consecutive turns have the same role, merge their content to preserve history
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += "\n\n" + m.content;
    } else {
      contents.push({
        role,
        parts: [{ text: m.content }],
      });
    }
  }

  // Inject the mandatory language instruction into the final user turn if appropriate
  if (contents.length > 0) {
    const lastTurn = contents[contents.length - 1];
    if (lastTurn.role === "user" && language && language !== "English") {
      lastTurn.parts[0].text += `\n\n[MANDATORY: Answer this question strictly in ${language} using native ${language} script. Do NOT respond in English.]`;
    }
  }

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

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-latest"];
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

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-latest"];
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

export async function detectDiseaseGemini(data: {
  imageDataUrl: string;
  crop?: string;
  language?: string;
}): Promise<{
  name: string;
  confidence: number;
  severity: string;
  symptoms: string;
  treatment: string;
  prevent: string;
} | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY);

  if (!apiKey) return null;

  const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  const mimeType = match ? match[1] : "image/jpeg";
  const base64Data = match ? match[2] : data.imageDataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

  const prompt = `You are a plant pathologist and agricultural computer vision expert.
Analyze the provided image carefully.

CRITICAL FIRST INSTRUCTION:
Check whether the image actually contains a plant leaf, crop, fruit, seedling, or agricultural plant specimen.
IF THE IMAGE IS NOT A PLANT, LEAF, OR CROP (for example: laptop/computer screens, IDEs, code, text, human faces/people, buildings, animals, furniture, electronics, vehicles, non-agricultural scenes):
You MUST return ONLY JSON with this exact structure:
{
  "name": "No Leaf / Plant Detected",
  "confidence": 0,
  "severity": "None",
  "symptoms": "The uploaded image does not appear to contain a plant, leaf, or crop photo. It looks like an object, screen, or non-agricultural image.",
  "treatment": "Please upload or capture a clear photo of an affected crop leaf.",
  "prevent": "Ensure your camera is focused directly on the plant leaf in good lighting."
}

IF THE IMAGE IS A PLANT/LEAF/CROP:
1. If the plant/leaf is healthy, return:
{
  "name": "Healthy Plant Leaf",
  "confidence": 95,
  "severity": "None",
  "symptoms": "The leaf appears healthy with normal green color and no signs of lesions, spots, or pests.",
  "treatment": "No treatment required. Continue regular crop care and irrigation.",
  "prevent": "Maintain balanced soil nutrition and good field drainage."
}
2. If diseased or damaged, identify the specific disease or pest (e.g., Tomato Early Blight, Rice Blast, Cotton Leaf Curl, Black Spot, Powdery Mildew, Pest Infestation), confidence (60-99%), severity ("Mild", "Moderate", "Severe"), detailed symptoms, specific organic and chemical treatment with dosages, and prevention tips.

Crop hint from user: ${data.crop || "Not specified"}
Language: ${data.language || "English"}

Return ONLY valid JSON matching the exact schema above without markdown syntax:`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
    },
  };

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-latest"];
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
        if (parsed && parsed.name && typeof parsed.confidence === "number") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Gemini disease detection error:", e);
    }
  }

  return null;
}

