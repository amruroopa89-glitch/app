import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { recommendCrops, CropRec } from "../services/ai";
import { Droplets, Sprout, TrendingUp, Coins, Sparkles } from "lucide-react-native";

const SOILS = ["Black", "Red", "Sandy", "Clay", "Loamy"];
const WATER = ["Low", "Medium", "High"];
const SEASONS = ["Kharif", "Rabi", "Zaid", "Summer"];

export function RecommendScreen() {
  const [soilType, setSoilType] = useState("Loamy");
  const [soilPh, setSoilPh] = useState("6.5");
  const [nitrogen, setNitrogen] = useState("40");
  const [phosphorus, setPhosphorus] = useState("30");
  const [potassium, setPotassium] = useState("30");
  const [water, setWater] = useState("Medium");
  const [season, setSeason] = useState("Kharif");
  const [region, setRegion] = useState("");
  const [history, setHistory] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CropRec[] | null>(null);
  const [rationale, setRationale] = useState("");

  // Select Modals state
  const [activeSelect, setActiveSelect] = useState<{
    field: "soil" | "water" | "season";
    options: string[];
    visible: boolean;
  } | null>(null);

  const colors = ["#2E7D32", "#0284C7", "#D97706", "#7C3AED", "#DB2777"];

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "soil_type,soil_ph,nitrogen,phosphorus,potassium,water_availability,current_season,district,state,crop_history"
      )
      .maybeSingle()
      .then(({ data }: any) => {
        if (!data) return;
        if (data.soil_type) setSoilType(data.soil_type);
        if (data.soil_ph !== null && data.soil_ph !== undefined) setSoilPh(String(data.soil_ph));
        if (data.nitrogen !== null && data.nitrogen !== undefined) setNitrogen(String(data.nitrogen));
        if (data.phosphorus !== null && data.phosphorus !== undefined) setPhosphorus(String(data.phosphorus));
        if (data.potassium !== null && data.potassium !== undefined) setPotassium(String(data.potassium));
        if (data.water_availability) setWater(data.water_availability);
        if (data.current_season) setSeason(data.current_season);
        
        const loc = [data.district, data.state].filter(Boolean).join(", ");
        if (loc) setRegion(loc);
        if (data.crop_history) setHistory(data.crop_history);
      });
  }, []);

  const handleSelectPress = (field: "soil" | "water" | "season", options: string[]) => {
    setActiveSelect({ field, options, visible: true });
  };

  const handleSelectOption = (option: string) => {
    if (!activeSelect) return;
    if (activeSelect.field === "soil") setSoilType(option);
    else if (activeSelect.field === "water") setWater(option);
    else if (activeSelect.field === "season") setSeason(option);
    setActiveSelect(null);
  };

  const submit = async () => {
    const phVal = parseFloat(soilPh);
    const nVal = parseInt(nitrogen, 10);
    const pVal = parseInt(phosphorus, 10);
    const kVal = parseInt(potassium, 10);

    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      Alert.alert("Invalid Input", "Soil pH must be a number between 0 and 14.");
      return;
    }
    if (isNaN(nVal) || isNaN(pVal) || isNaN(kVal)) {
      Alert.alert("Invalid Input", "Please enter valid numbers for N, P, and K.");
      return;
    }

    setLoading(true);
    setResults(null);
    setRationale("");

    try {
      const out = await recommendCrops({
        soilType,
        soilPh: phVal,
        nitrogen: nVal,
        phosphorus: pVal,
        potassium: kVal,
        water,
        season,
        region,
        history,
      });
      setResults(out.recommendations);
      setRationale(out.rationale);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🌾</Text>
          <View>
            <Text style={styles.title}>AI Crop Recommendation</Text>
            <Text style={styles.subtitle}>Enter your soil values, get tailored crops</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Soil Type Select */}
          <View style={styles.formField}>
            <Text style={styles.label}>Soil Type</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectPress("soil", SOILS)}
            >
              <Text style={styles.selectButtonText}>{soilType}</Text>
            </TouchableOpacity>
          </View>

          {/* Soil pH */}
          <View style={styles.formField}>
            <Text style={styles.label}>Soil pH (0–14)</Text>
            <TextInput
              style={styles.input}
              value={soilPh}
              onChangeText={setSoilPh}
              keyboardType="numeric"
              placeholder="e.g. 6.5"
            />
          </View>

          {/* NPK Grid */}
          <View style={styles.npkGrid}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>N (kg/ha)</Text>
              <TextInput
                style={styles.input}
                value={nitrogen}
                onChangeText={setNitrogen}
                keyboardType="numeric"
                placeholder="N"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>P (kg/ha)</Text>
              <TextInput
                style={styles.input}
                value={phosphorus}
                onChangeText={setPhosphorus}
                keyboardType="numeric"
                placeholder="P"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>K (kg/ha)</Text>
              <TextInput
                style={styles.input}
                value={potassium}
                onChangeText={setPotassium}
                keyboardType="numeric"
                placeholder="K"
              />
            </View>
          </View>

          {/* Water & Season Grid */}
          <View style={styles.npkGrid}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>Water</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectPress("water", WATER)}
              >
                <Text style={styles.selectButtonText}>{water}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>Season</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectPress("season", SEASONS)}
              >
                <Text style={styles.selectButtonText}>{season}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Region */}
          <View style={styles.formField}>
            <Text style={styles.label}>Region (district, state)</Text>
            <TextInput
              style={styles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="e.g. Anantapur, Andhra Pradesh"
            />
          </View>

          {/* History */}
          <View style={styles.formField}>
            <Text style={styles.label}>Recent crop history</Text>
            <TextInput
              style={styles.input}
              value={history}
              onChangeText={setHistory}
              placeholder="e.g. groundnut, cotton, fallow"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <View style={styles.loaderWrapper}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Analyzing soil...</Text>
              </View>
            ) : (
              <View style={styles.loaderWrapper}>
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Get Recommendations</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {results && (
          <View style={styles.resultsContainer}>
            {rationale ? (
              <View style={styles.rationaleCard}>
                <Text style={styles.rationaleTitle}>AI Analysis:</Text>
                <Text style={styles.rationaleText}>{rationale}</Text>
              </View>
            ) : null}

            {results.map((c, i) => {
              const cardColor = colors[i % colors.length];
              return (
                <View key={i} style={styles.cropCard}>
                  {/* Card Header */}
                  <View style={[styles.cropHeader, { backgroundColor: cardColor }]}>
                    <View style={styles.emojiCircle}>
                      <Text style={styles.cropEmoji}>{c.emoji}</Text>
                    </View>
                    <View style={styles.cropTitleWrapper}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={styles.cropName}>{c.name}</Text>
                        {i === 0 && (
                          <View style={styles.bestBadge}>
                            <Text style={styles.bestBadgeText}>BEST PICK</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cropDemand}>Demand: {c.demand}</Text>
                    </View>
                    <View style={styles.matchColumn}>
                      <Text style={styles.matchScore}>{c.score}</Text>
                      <Text style={styles.matchLabel}>% match</Text>
                    </View>
                  </View>

                  {/* Card Stats */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <View style={styles.statIconRow}>
                        <Sprout size={13} color="#718096" />
                        <Text style={styles.statLabel}>Yield</Text>
                      </View>
                      <Text style={styles.statValue}>{c.yield}</Text>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statIconRow}>
                        <Coins size={13} color="#718096" />
                        <Text style={styles.statLabel}>Profit</Text>
                      </View>
                      <Text style={styles.statValue}>{c.profit}</Text>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statIconRow}>
                        <Droplets size={13} color="#718096" />
                        <Text style={styles.statLabel}>Water</Text>
                      </View>
                      <Text style={styles.statValue}>{c.water}</Text>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statIconRow}>
                        <TrendingUp size={13} color="#718096" />
                        <Text style={styles.statLabel}>Fertilizer</Text>
                      </View>
                      <Text style={styles.statValue}>{c.fertilizer}</Text>
                    </View>
                  </View>

                  {/* Card Tip */}
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>
                      💡 <Text style={styles.tipBold}>Tip:</Text> {c.tips}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Select Modal */}
      <Modal
        visible={!!activeSelect?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSelect(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveSelect(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {activeSelect?.field === "soil" ? "Soil Type" : activeSelect?.field === "water" ? "Water" : "Season"}
            </Text>
            <FlatList
              data={activeSelect?.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectOption(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    marginTop: 6,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D3748",
  },
  subtitle: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  formField: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718096",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1A202C",
  },
  selectButton: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    height: 48,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  selectButtonText: {
    fontSize: 14,
    color: "#1A202C",
  },
  npkGrid: {
    flexDirection: "row",
    gap: 10,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loaderWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resultsContainer: {
    marginTop: 20,
    gap: 16,
  },
  rationaleCard: {
    backgroundColor: "#EDF2F7",
    borderRadius: 16,
    padding: 14,
  },
  rationaleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 4,
  },
  rationaleText: {
    fontSize: 11,
    color: "#4A5568",
    lineHeight: 15,
  },
  cropCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  cropHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cropEmoji: {
    fontSize: 26,
  },
  cropTitleWrapper: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cropName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bestBadge: {
    backgroundColor: "#FFB020",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cropDemand: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    fontWeight: "500",
  },
  matchColumn: {
    alignItems: "flex-end",
  },
  matchScore: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  matchLabel: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  statCard: {
    width: (Dimensions.get("window").width - 56) / 2,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EDF2F7",
    borderRadius: 12,
    padding: 10,
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#718096",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3748",
    marginTop: 4,
  },
  tipBox: {
    backgroundColor: "#F7FAFC",
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    padding: 12,
  },
  tipText: {
    fontSize: 11,
    color: "#4A5568",
    lineHeight: 15,
  },
  tipBold: {
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "600",
  },
});
