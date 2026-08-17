import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import { detectDisease, DiseaseDiagnosisResult } from "../services/ai";
import { Camera, Upload, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, X } from "lucide-react-native";

// Valid small 1x1 pixel base64 images for simulation
const MOCK_GREEN_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const MOCK_RED_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function DiseaseScreen() {
  const [crop, setCrop] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DiseaseDiagnosisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const runDiagnosis = async (imageDataUrl: string, cropName: string) => {
    setScanning(true);
    setResult(null);
    try {
      const out = await detectDisease(imageDataUrl, cropName || undefined);
      setResult(out);
    } catch (err: any) {
      Alert.alert("Diagnosis Failed", err.message || "An error occurred during analysis.");
      setPreview(null);
    } finally {
      setScanning(false);
    }
  };

  const handlePresetSelect = (presetName: string, cropName: string, isLeaf: boolean) => {
    Alert.alert(
      "Simulate Diagnosis",
      `Analyzing a simulated ${presetName} image via the Gemini AI endpoint...`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Analyze",
          onPress: () => {
            setPreview(isLeaf ? MOCK_GREEN_PIXEL : MOCK_RED_PIXEL);
            setCrop(cropName);
            runDiagnosis(isLeaf ? MOCK_GREEN_PIXEL : MOCK_RED_PIXEL, cropName);
          },
        },
      ]
    );
  };

  const handleSimulatedUpload = () => {
    Alert.alert(
      "Select Image Source",
      "Choose to capture or pick a leaf photo (Simulated for emulator compatibility)",
      [
        {
          text: "Capture Photo",
          onPress: () => {
            setPreview(MOCK_GREEN_PIXEL);
            runDiagnosis(MOCK_GREEN_PIXEL, crop);
          },
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            setPreview(MOCK_GREEN_PIXEL);
            runDiagnosis(MOCK_GREEN_PIXEL, crop);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setCrop("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🔬</Text>
          <View>
            <Text style={styles.title}>Plant Disease Detection</Text>
            <Text style={styles.subtitle}>Snap a leaf, get instant diagnosis</Text>
          </View>
        </View>

        {/* Crop Filter */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Select Crop to Scan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {[
              { id: "tomato", label: "Tomato", emoji: "🍅" },
              { id: "cotton", label: "Cotton", emoji: "🌿" },
              { id: "paddy", label: "Paddy", emoji: "🌾" },
              { id: "groundnut", label: "Groundnut", emoji: "🥜" },
              { id: "wheat", label: "Wheat", emoji: "🌾" },
              { id: "chilli", label: "Chilli", emoji: "🌶️" },
              { id: "maize", label: "Maize", emoji: "🌽" },
              { id: "banana", label: "Banana", emoji: "🍌" },
              { id: "sugarcane", label: "Sugarcane", emoji: "🎋" },
              { id: "potato", label: "Potato", emoji: "🥔" },
              { id: "watermelon", label: "Watermelon", emoji: "🍉" },
              { id: "mango", label: "Mango", emoji: "🥭" },
              { id: "pomegranate", label: "Pomegranate", emoji: "🍎" },
              { id: "apple", label: "Apple", emoji: "🍎" },
              { id: "grape", label: "Grape", emoji: "🍇" },
            ].map((item) => {
              const selected = crop === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCrop(selected ? "" : item.id)}
                  style={[
                    styles.chip,
                    selected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                    {item.emoji} {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Upload Container */}
        {!preview ? (
          <View style={styles.uploadCard}>
            <View style={styles.cameraIconBg}>
              <Camera size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.uploadTitle}>Upload or capture a leaf</Text>
            <Text style={styles.uploadSubtitle}>
              Clear, well-lit photo of the affected area works best
            </Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.primaryUploadBtn}
                onPress={handleSimulatedUpload}
                activeOpacity={0.9}
              >
                <Camera size={18} color="#FFFFFF" />
                <Text style={styles.primaryUploadText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryUploadBtn}
                onPress={handleSimulatedUpload}
                activeOpacity={0.8}
              >
                <Upload size={18} color="#2D3748" />
                <Text style={styles.secondaryUploadText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.previewImagePlaceholder}>
              <Text style={styles.previewImageText}>🍃 Simulated Leaf Photo Loaded</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={reset}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Scanning Loader */}
        {scanning && (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loaderText}>Analyzing leaf...</Text>
          </View>
        )}

        {/* Diagnostic Results */}
        {result && (
          <View style={styles.resultCard}>
            {/* Header */}
            <View
              style={[
                styles.resultHeader,
                {
                  backgroundColor:
                    result.confidence === 0 || result.name.toLowerCase().includes("no leaf")
                      ? "#64748B"
                      : result.severity === "None"
                      ? "#2E7D32"
                      : "#E28743",
                },
              ]}
            >
              {result.confidence === 0 || result.name.toLowerCase().includes("no leaf") ? (
                <AlertCircle size={28} color="#FFFFFF" />
              ) : result.severity === "None" ? (
                <CheckCircle2 size={28} color="#FFFFFF" />
              ) : (
                <AlertTriangle size={28} color="#FFFFFF" />
              )}
              <View style={styles.resultHeaderDetails}>
                <Text style={styles.resultHeaderTitle}>{result.name}</Text>
                <Text style={styles.resultHeaderSubtitle}>
                  {result.confidence > 0
                    ? `Severity: ${result.severity} · ${Math.round(result.confidence)}% confidence`
                    : "No Crop Leaf Identified"}
                </Text>
              </View>
            </View>

            {/* Content Details */}
            <View style={styles.resultDetailsList}>
              <View style={styles.detailSection}>
                <View style={styles.detailTitleRow}>
                  <CheckCircle2 size={15} color="#2E7D32" />
                  <Text style={styles.detailTitle}>Symptoms / Analysis</Text>
                </View>
                <Text style={styles.detailBody}>{result.symptoms}</Text>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailTitleRow}>
                  <CheckCircle2 size={15} color="#2E7D32" />
                  <Text style={styles.detailTitle}>Treatment / Action</Text>
                </View>
                <Text style={styles.detailBody}>{result.treatment}</Text>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailTitleRow}>
                  <CheckCircle2 size={15} color="#2E7D32" />
                  <Text style={styles.detailTitle}>Prevention / Recommendation</Text>
                </View>
                <Text style={styles.detailBody}>{result.prevent}</Text>
              </View>

              <TouchableOpacity style={styles.scanAgainBtn} onPress={reset}>
                <Text style={styles.scanAgainText}>Scan another photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Diagnostic Presets (Simulator Helpers) */}
        {!preview && (
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Simulation Presets (Test AI):</Text>
            <View style={styles.presetsGrid}>
              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetSelect("Tomato Leaf Spot", "tomato", true)}
              >
                <Text style={styles.presetEmoji}>🍅</Text>
                <Text style={styles.presetLabel}>Tomato Spot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetSelect("Cotton Aphids", "cotton", true)}
              >
                <Text style={styles.presetEmoji}>🌱</Text>
                <Text style={styles.presetLabel}>Cotton Aphids</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetSelect("Rice Blast", "paddy", true)}
              >
                <Text style={styles.presetEmoji}>🌾</Text>
                <Text style={styles.presetLabel}>Rice Blast</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetSelect("Potato Late Blight", "potato", true)}
              >
                <Text style={styles.presetEmoji}>🥔</Text>
                <Text style={styles.presetLabel}>Potato Blight</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetSelect("Non-Leaf Object", "None", false)}
              >
                <Text style={styles.presetEmoji}>📱</Text>
                <Text style={styles.presetLabel}>Non-Leaf</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  chipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  chipUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  chipTextUnselected: {
    color: "#4A5568",
  },

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
  fieldContainer: {
    gap: 6,
    marginBottom: 16,
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
    backgroundColor: "#FFFFFF",
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1A202C",
  },
  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(46, 125, 50, 0.2)",
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cameraIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3748",
  },
  uploadSubtitle: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  primaryUploadBtn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryUploadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryUploadBtn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryUploadText: {
    color: "#2D3748",
    fontSize: 13,
    fontWeight: "700",
  },
  previewCard: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#2E7D32",
  },
  previewImagePlaceholder: {
    flex: 1,
    backgroundColor: "#1A5235",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImageText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  resultCard: {
    marginTop: 20,
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
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  resultHeaderDetails: {
    flex: 1,
  },
  resultHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  resultHeaderSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    fontWeight: "500",
  },
  resultDetailsList: {
    padding: 16,
    gap: 14,
  },
  detailSection: {
    gap: 4,
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
  },
  detailBody: {
    fontSize: 12,
    color: "#718096",
    lineHeight: 16,
  },
  scanAgainBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  scanAgainText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
  },
  presetsContainer: {
    marginTop: 24,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718096",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetCard: {
    width: (Dimensions.get("window").width - 40) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  presetEmoji: {
    fontSize: 22,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4A5568",
  },
});
