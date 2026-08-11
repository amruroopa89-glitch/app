import { API_BASE_URL } from "../config/api";

export type SoilInput = {
  soilType: string;
  soilPh: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  water: string;
  season: string;
  region?: string;
  history?: string;
};

export type CropRec = {
  name: string;
  emoji: string;
  score: number;
  yield: string;
  water: string;
  fertilizer: string;
  profit: string;
  demand: string;
  tips: string;
};

export type CropRecommendationResult = {
  recommendations: CropRec[];
  rationale: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatProfile = {
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

export type DiseaseDiagnosisResult = {
  name: string;
  confidence: number;
  severity: "None" | "Mild" | "Moderate" | "Severe" | string;
  symptoms: string;
  treatment: string;
  prevent: string;
};

export async function recommendCrops(data: SoilInput): Promise<CropRecommendationResult> {
  const res = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Recommendation failed (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

export async function askAssistant(
  messages: ChatMessage[],
  language?: string,
  profile?: ChatProfile
): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, language, profile }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Assistant query failed (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

export async function detectDisease(
  imageDataUrl: string,
  crop?: string,
  language?: string
): Promise<DiseaseDiagnosisResult> {
  const res = await fetch(`${API_BASE_URL}/api/disease`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageDataUrl, crop, language }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Disease diagnosis failed (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}
