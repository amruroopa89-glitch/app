import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { LogOut, Save, FileText } from "lucide-react-native";

type Profile = {
  full_name: string;
  age: string;
  gender: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  farm_size: string;
  farm_unit: string;
  language: string;
  irrigation_type: string;
  soil_type: string;
  soil_ph: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  water_availability: string;
  current_season: string;
  crop_history: string;
  signup_at?: string;
  last_sign_in_at?: string;
};

const emptyProfile: Profile = {
  full_name: "",
  age: "",
  gender: "Male",
  mobile: "",
  village: "",
  district: "",
  state: "",
  farm_size: "",
  farm_unit: "acres",
  language: "English",
  irrigation_type: "Drip",
  soil_type: "Loamy",
  soil_ph: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  water_availability: "Medium",
  current_season: "Kharif",
  crop_history: "",
};

export function ProfileScreen() {
  const [p, setP] = useState<Profile>(emptyProfile);
  const [schemes, setSchemes] = useState<Array<{ title: string; body: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dropdown Modal options
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    field: keyof Profile;
    options: string[];
  } | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data } = await supabase.from("profiles").select("*").maybeSingle();
        if (data) {
          setP({
            full_name: data.full_name ?? "",
            age: data.age !== null && data.age !== undefined ? String(data.age) : "",
            gender: data.gender ?? "Male",
            mobile: data.mobile ?? "",
            village: data.village ?? "",
            district: data.district ?? "",
            state: data.state ?? "",
            farm_size: data.farm_size !== null && data.farm_size !== undefined ? String(data.farm_size) : "",
            farm_unit: data.farm_unit ?? "acres",
            language: data.language ?? "English",
            irrigation_type: data.irrigation_type ?? "Drip",
            soil_type: data.soil_type ?? "Loamy",
            soil_ph: data.soil_ph !== null && data.soil_ph !== undefined ? String(data.soil_ph) : "",
            nitrogen: data.nitrogen !== null && data.nitrogen !== undefined ? String(data.nitrogen) : "",
            phosphorus: data.phosphorus !== null && data.phosphorus !== undefined ? String(data.phosphorus) : "",
            potassium: data.potassium !== null && data.potassium !== undefined ? String(data.potassium) : "",
            water_availability: data.water_availability ?? "Medium",
            current_season: data.current_season ?? "Kharif",
            crop_history: data.crop_history ?? "",
            signup_at: data.signup_at ?? "",
            last_sign_in_at: data.last_sign_in_at ?? "",
          });
        }

        const { data: sch } = await supabase
          .from("government_schemes")
          .select("title, body")
          .order("title");
        if (sch) {
          setSchemes(sch);
        }
      } catch (err) {
        console.warn("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const openSelect = (field: keyof Profile, options: string[]) => {
    setModalConfig({ visible: true, field, options });
  };

  const handleSelectOption = (option: string) => {
    if (!modalConfig) return;
    setP((prev) => ({ ...prev, [modalConfig.field]: option }));
    setModalConfig(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        Alert.alert("Error", "No authenticated user session found.");
        return;
      }

      const { signup_at, last_sign_in_at, ...pData } = p;
      const payload = {
        user_id: u.user.id,
        ...pData,
        age: p.age === "" ? null : parseInt(p.age, 10),
        farm_size: p.farm_size === "" ? null : parseFloat(p.farm_size),
        soil_ph: p.soil_ph === "" ? null : parseFloat(p.soil_ph),
        nitrogen: p.nitrogen === "" ? null : parseInt(p.nitrogen, 10),
        phosphorus: p.phosphorus === "" ? null : parseInt(p.phosphorus, 10),
        potassium: p.potassium === "" ? null : parseInt(p.potassium, 10),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      Alert.alert("Success", "Profile saved successfully 🌱");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const avatarChar = (p.full_name || "F")[0].toUpperCase();
  const locationSummary = [p.village, p.district, p.state].filter(Boolean).join(", ") || "Location details incomplete";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar header */}
        <View style={styles.avatarHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarChar}</Text>
          </View>
          <View style={styles.headerDetails}>
            <Text style={styles.headerName}>{p.full_name || "Your Profile"}</Text>
            <Text style={styles.headerLoc}>{locationSummary}</Text>
          </View>
        </View>

        {/* Section: Personal */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👤 Personal Details</Text>
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={p.full_name}
                onChangeText={(v) => setP({ ...p, full_name: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={p.mobile}
                onChangeText={(v) => setP({ ...p, mobile: v })}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={p.age}
                onChangeText={(v) => setP({ ...p, age: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => openSelect("gender", ["Male", "Female", "Other"])}
              >
                <Text style={styles.selectBtnText}>{p.gender}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Location & Farm */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📍 Location & Farm</Text>
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.label}>Village</Text>
              <TextInput
                style={styles.input}
                value={p.village}
                onChangeText={(v) => setP({ ...p, village: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>District</Text>
              <TextInput
                style={styles.input}
                value={p.district}
                onChangeText={(v) => setP({ ...p, district: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={p.state}
                onChangeText={(v) => setP({ ...p, state: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Farm Size</Text>
              <TextInput
                style={styles.input}
                value={p.farm_size}
                onChangeText={(v) => setP({ ...p, farm_size: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Unit</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => openSelect("farm_unit", ["acres", "hectares"])}
              >
                <Text style={styles.selectBtnText}>{p.farm_unit}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Irrigation</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() =>
                  openSelect("irrigation_type", ["Drip", "Sprinkler", "Flood", "Rain-fed", "Canal"])
                }
              >
                <Text style={styles.selectBtnText}>{p.irrigation_type}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.field, { width: "100%" }]}>
              <Text style={styles.label}>Preferred Language</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() =>
                  openSelect("language", [
                    "English",
                    "Hindi",
                    "Telugu",
                    "Tamil",
                    "Kannada",
                    "Marathi",
                    "Bengali",
                    "Gujarati",
                  ])
                }
              >
                <Text style={styles.selectBtnText}>{p.language}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Soil & Crop */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🌱 Soil & Crop Values</Text>
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.label}>Soil Type</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => openSelect("soil_type", ["Black", "Red", "Sandy", "Clay", "Loamy"])}
              >
                <Text style={styles.selectBtnText}>{p.soil_type}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Soil pH</Text>
              <TextInput
                style={styles.input}
                value={p.soil_ph}
                onChangeText={(v) => setP({ ...p, soil_ph: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Nitrogen (N)</Text>
              <TextInput
                style={styles.input}
                value={p.nitrogen}
                onChangeText={(v) => setP({ ...p, nitrogen: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phosphorus (P)</Text>
              <TextInput
                style={styles.input}
                value={p.phosphorus}
                onChangeText={(v) => setP({ ...p, phosphorus: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Potassium (K)</Text>
              <TextInput
                style={styles.input}
                value={p.potassium}
                onChangeText={(v) => setP({ ...p, potassium: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Water Availability</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => openSelect("water_availability", ["Low", "Medium", "High"])}
              >
                <Text style={styles.selectBtnText}>{p.water_availability}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Current Season</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => openSelect("current_season", ["Kharif", "Rabi", "Zaid", "Summer"])}
              >
                <Text style={styles.selectBtnText}>{p.current_season}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Crop History</Text>
              <TextInput
                style={styles.input}
                value={p.crop_history}
                onChangeText={(v) => setP({ ...p, crop_history: v })}
              />
            </View>
          </View>
        </View>

        {/* Section: Account Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔐 Account Activity</Text>
          <View style={styles.activityBox}>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Joined Date</Text>
              <Text style={styles.activityValue}>{formatDate(p.signup_at)}</Text>
            </View>
            <View style={[styles.activityRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.activityLabel}>Recent Sign-in</Text>
              <Text style={styles.activityValue}>{formatDate(p.last_sign_in_at)}</Text>
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.saveBtnContent}>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Government Schemes */}
        {schemes.length > 0 && (
          <View style={styles.schemesContainer}>
            <Text style={styles.sectionTitleHeader}>Government Schemes</Text>
            <View style={styles.schemesList}>
              {schemes.map((s, idx) => (
                <View key={idx} style={styles.schemeCard}>
                  <FileText size={18} color="#2E7D32" style={styles.schemeIcon} />
                  <View style={styles.schemeDetails}>
                    <Text style={styles.schemeTitle}>{s.title}</Text>
                    <Text style={styles.schemeBody}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC3545" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Selector Modal */}
      <Modal
        visible={!!modalConfig?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalConfig(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalConfig(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Option</Text>
            <FlatList
              data={modalConfig?.options}
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
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  avatarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#2E7D32",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  headerDetails: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerLoc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  field: {
    width: "48.3%",
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#718096",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#1A202C",
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    height: 40,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  selectBtnText: {
    fontSize: 13,
    color: "#1A202C",
  },
  activityBox: {
    gap: 10,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: 8,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718096",
  },
  activityValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2D3748",
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  schemesContainer: {
    marginTop: 8,
  },
  sectionTitleHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  schemesList: {
    gap: 8,
  },
  schemeCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 10,
  },
  schemeIcon: {
    marginTop: 2,
  },
  schemeDetails: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
  },
  schemeBody: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
    lineHeight: 14,
  },
  signOutBtn: {
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC3545",
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
    maxHeight: "50%",
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
