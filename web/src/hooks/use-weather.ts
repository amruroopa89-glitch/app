import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// WMO Weather Code → { condition, icon }
function wmoToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear Sky", icon: "☀️" };
  if (code <= 2) return { condition: "Partly Cloudy", icon: "🌤️" };
  if (code === 3) return { condition: "Overcast", icon: "☁️" };
  if (code <= 49) return { condition: "Foggy", icon: "🌫️" };
  if (code <= 57) return { condition: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { condition: "Rain", icon: "🌧️" };
  if (code <= 77) return { condition: "Snow", icon: "❄️" };
  if (code <= 82) return { condition: "Rain Showers", icon: "🌧️" };
  if (code <= 86) return { condition: "Snow Showers", icon: "🌨️" };
  if (code <= 99) return { condition: "Thunderstorm", icon: "⛈️" };
  return { condition: "Unknown", icon: "🌡️" };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function fetchWeather(location: string | null) {
  if (!location) return null;

  // 1. Geocode via Nominatim
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=in`,
    { headers: { "Accept-Language": "en", "User-Agent": "GreenHarvestBuddy/1.0" } },
  );
  const geoData = await geoRes.json();
  if (!geoData?.length) return null;

  const { lat, lon } = geoData[0];

  // 2. Fetch weather from Open-Meteo (free, no API key)
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max&timezone=Asia%2FKolkata&forecast_days=5`,
  );
  const w = await weatherRes.json();

  const current = w.current;
  const daily = w.daily;

  const { condition } = wmoToCondition(current.weather_code);

  const forecast = daily.time.slice(0, 5).map((dateStr: string, i: number) => {
    const d = new Date(dateStr);
    const { icon } = wmoToCondition(daily.weather_code[i]);
    return {
      day: DAYS[d.getDay()],
      t: Math.round(daily.temperature_2m_max[i]),
      icon,
    };
  });

  return {
    temp: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    rainfall: Math.round(current.precipitation),
    wind: Math.round(current.wind_speed_10m),
    condition,
    forecast,
  };
}

export type WeatherData = Awaited<ReturnType<typeof fetchWeather>> & {};

export function useWeather() {
  // First fetch profile to get location
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("district,state").maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const location =
    profile === undefined
      ? undefined // still loading profile
      : profile
        ? [profile.district, profile.state].filter(Boolean).join(", ") || null
        : null;

  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", location],
    queryFn: () => fetchWeather(location!),
    enabled: location !== undefined, // wait for profile to resolve
    staleTime: 15 * 60 * 1000, // cache 15 minutes
    retry: 1,
  });

  // Return actual weather or null if none
  const resolved = weather ?? null;

  return { weather: resolved, isLoading: isLoading || location === undefined };
}
