import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { AppTabParamList } from "../navigation/types";
import { supabase } from "../services/supabase";
import {
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  TrendingUp,
  Bell,
  Leaf,
  Sprout,
  MessageCircle,
  Camera,
  MapPin,
} from "lucide-react-native";

type Props = BottomTabScreenProps<AppTabParamList, "Home">;

type WeatherData = {
  temp: number;
  humidity: number;
  rainfall: number;
  wind: number;
  condition: string;
  forecast: Array<{ day: string; icon: string; t: number }>;
};

type AlertItem = {
  icon: string;
  title: string;
  body: string;
};

type MandiItem = {
  crop: string;
  price: string;
  trend: string;
};

export function DashboardScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [mandi, setMandi] = useState<MandiItem[]>([]);
  const [mandiLoading, setMandiLoading] = useState(true);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const wmoToCondition = (code: number) => {
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
  };

  const fetchWeather = async (locationStr: string) => {
    setWeatherLoading(true);
    try {
      // 1. Geocode
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationStr
        )}&limit=1&countrycodes=in`,
        { headers: { "Accept-Language": "en", "User-Agent": "GreenHarvestBuddyMobile/1.0" } }
      );
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        const { lat, lon } = geoData[0];

        // 2. Weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
            `&daily=weather_code,temperature_2m_max&timezone=Asia%2FKolkata&forecast_days=5`
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

        setWeather({
          temp: Math.round(current.temperature_2m),
          humidity: Math.round(current.relative_humidity_2m),
          rainfall: Math.round(current.precipitation),
          wind: Math.round(current.wind_speed_10m),
          condition,
          forecast,
        });
      }
    } catch (e) {
      console.warn("Weather fetch failed", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // 1. Profile
      const { data: prof } = await supabase.from("profiles").select("*").maybeSingle();
      setProfile(prof);

      if (prof) {
        const loc = [prof.district, prof.state].filter(Boolean).join(", ");
        if (loc) {
          fetchWeather(loc);
        }
      }

      // 2. Alerts
      const { data: altRows } = await supabase
        .from("crop_alerts")
        .select("icon, title, body, state")
        .order("created_at", { ascending: false })
        .limit(6);

      if (altRows) {
        const filtered = altRows
          .filter((a: any) => !a.state || a.state === prof?.state)
          .slice(0, 4)
          .map((a: any) => ({ icon: a.icon, title: a.title, body: a.body }));
        setAlerts(filtered);
      }
      setAlertsLoading(false);

      // 3. Mandi Prices
      const { data: mandiRows } = await supabase
        .from("mandi_prices")
        .select("crop, price_inr, unit, change_pct, state")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (mandiRows) {
        const stateRows = prof?.state ? mandiRows.filter((r: any) => r.state === prof.state) : [];
        const nationalRows = mandiRows.filter((r: any) => !r.state);
        const merged = [...stateRows, ...nationalRows];

        const seen = new Set<string>();
        const deduped = merged
          .sort((a: any, b: any) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
          .filter((r: any) => {
            if (seen.has(r.crop)) return false;
            seen.add(r.crop);
            return true;
          })
          .slice(0, 3)
          .map((r: any) => ({
            crop: r.crop,
            price: `₹${r.price_inr.toLocaleString("en-IN")}`,
            trend: (r.change_pct >= 0 ? "+" : "") + r.change_pct.toFixed(1) + "%",
          }));
        setMandi(deduped);
      }
      setMandiLoading(false);
    } catch (e) {
      console.warn("Failed to load dashboard data", e);
      setAlertsLoading(false);
      setMandiLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const name = profile?.full_name || "Farmer";
  const place = [profile?.village, profile?.district].filter(Boolean).join(", ") || "Add your location in Profile";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.greetText}>Namaste 🙏</Text>
              <Text style={styles.nameText}>{name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.locationText}>{place}</Text>
              </View>
            </View>
            <Leaf size={40} color="rgba(255, 255, 255, 0.2)" style={styles.leafIcon} />
          </View>

          {weatherLoading ? (
            <View style={styles.weatherLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.weatherLoadingText}>Updating weather...</Text>
            </View>
          ) : weather ? (
            <View style={styles.weatherWrapper}>
              <View style={styles.weatherCurrent}>
                <Thermometer size={28} color="#FFFFFF" />
                <View style={styles.tempDetails}>
                  <Text style={styles.tempText}>{weather.temp}°C</Text>
                  <Text style={styles.conditionText}>{weather.condition}</Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Droplets size={14} color="#FFFFFF" />
                    <Text style={styles.statVal}>{weather.humidity}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Cloud size={14} color="#FFFFFF" />
                    <Text style={styles.statVal}>{weather.rainfall}mm</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Wind size={14} color="#FFFFFF" />
                    <Text style={styles.statVal}>{weather.wind}km/h</Text>
                  </View>
                </View>
              </View>

              <View style={styles.forecastRow}>
                {weather.forecast.map((f, i) => (
                  <View key={i} style={styles.forecastDay}>
                    <Text style={styles.forecastDayName}>{f.day}</Text>
                    <Text style={styles.forecastIcon}>{f.icon}</Text>
                    <Text style={styles.forecastTemp}>{f.t}°</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noLocationWeather}>
              <Text style={styles.noLocationText}>📍 Complete profile to load weather forecast</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Crops")}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: "rgba(46, 125, 50, 0.1)" }]}>
              <Sprout size={24} color="#2E7D32" />
            </View>
            <Text style={styles.actionLabel}>Recommend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Assistant")}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: "rgba(106, 90, 205, 0.1)" }]}>
              <MessageCircle size={24} color="#6A5ACD" />
            </View>
            <Text style={styles.actionLabel}>Ask AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Diagnose")}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: "rgba(220, 53, 69, 0.1)" }]}>
              <Camera size={24} color="#DC3545" />
            </View>
            <Text style={styles.actionLabel}>Diagnose</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        <View style={styles.alertsContainer}>
          <View style={styles.alertsHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: "#FFB020" }]}>
              <Bell size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitleHeader}>Farming Alerts</Text>
          </View>

          {alertsLoading ? (
            <ActivityIndicator size="small" color="#2E7D32" style={styles.sectionLoader} />
          ) : alerts.length > 0 ? (
            <View style={styles.alertsList}>
              {alerts.map((a, i) => (
                <View key={i} style={styles.alertCard}>
                  <Text style={styles.alertEmoji}>{a.icon}</Text>
                  <View style={styles.alertDetails}>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    <Text style={styles.alertBody}>{a.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No alerts currently active in your area.</Text>
          )}
        </View>

        {/* Mandi Prices */}
        <View style={styles.mandiContainer}>
          <View style={styles.alertsHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: "#0284C7" }]}>
              <TrendingUp size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitleHeader}>Mandi Prices Today</Text>
          </View>

          {mandiLoading ? (
            <ActivityIndicator size="small" color="#2E7D32" style={styles.sectionLoader} />
          ) : mandi.length > 0 ? (
            <View style={styles.mandiGrid}>
              {mandi.map((m, i) => (
                <View key={i} style={styles.mandiCard}>
                  <Text style={styles.mandiCrop}>{m.crop}</Text>
                  <Text style={styles.mandiPrice}>{m.price}</Text>
                  <Text
                    style={[
                      styles.mandiTrend,
                      { color: m.trend.startsWith("+") ? "#2E7D32" : "#DC3545" },
                    ]}
                  >
                    {m.trend}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Prices currently unavailable.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: "#2E7D32", // Forest Green primary
    padding: 20,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  leafIcon: {
    opacity: 0.35,
  },
  weatherLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    padding: 12,
    borderRadius: 16,
  },
  weatherLoadingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  weatherWrapper: {
    marginTop: 16,
  },
  weatherCurrent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  tempDetails: {
    flex: 1,
  },
  tempText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  conditionText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: "column",
    gap: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statVal: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 6,
  },
  forecastDay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  forecastDayName: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  forecastIcon: {
    fontSize: 16,
    marginVertical: 4,
  },
  forecastTemp: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  noLocationWeather: {
    marginTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  noLocationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4A5568",
  },
  alertsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3748",
  },
  sectionLoader: {
    marginVertical: 10,
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    padding: 10,
  },
  alertEmoji: {
    fontSize: 22,
  },
  alertDetails: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
  },
  alertBody: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
    lineHeight: 14,
  },
  emptyText: {
    fontSize: 12,
    color: "#A0AEC0",
    textAlign: "center",
    marginVertical: 10,
  },
  mandiContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mandiGrid: {
    flexDirection: "row",
    gap: 8,
  },
  mandiCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EDF2F7",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  mandiCrop: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A5568",
  },
  mandiPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2E7D32",
    marginVertical: 2,
  },
  mandiTrend: {
    fontSize: 10,
    fontWeight: "700",
  },
});
