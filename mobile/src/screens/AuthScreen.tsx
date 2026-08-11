import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { supabase } from "../services/supabase";
import { Leaf, Mail, Lock, Phone, User, ArrowLeft } from "lucide-react-native";

type Props = NativeStackScreenProps<AuthStackParamList, "Auth">;

export function AuthScreen({ route, navigation }: Props) {
  const initialMode = route.params?.mode || "signin";
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.mode) {
      setMode(route.params.mode);
    }
  }, [route.params?.mode]);

  const validate = () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Invalid Input", "Please enter a valid email address.");
      return false;
    }
    if (mode !== "forgot" && (!password || password.length < 6)) {
      Alert.alert("Invalid Input", "Password must be at least 6 characters.");
      return false;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        Alert.alert("Invalid Input", "Please enter your full name.");
        return false;
      }
      if (!mobile.trim()) {
        Alert.alert("Invalid Input", "Please enter your mobile number.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, mobile },
          },
        });
        if (error) throw error;
        Alert.alert("Success", "Account created successfully! 🌱");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        Alert.alert("Check Email", "Password reset instructions have been sent to your email 📧");
        setMode("signin");
      }
    } catch (err: any) {
      Alert.alert("Authentication Error", err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Leaf size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>AI Crop Recommendation</Text>
            <Text style={styles.headerSubtitle}>Smart farming, made simple</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Welcome")}
            >
              <ArrowLeft size={16} color="#A0AEC0" />
              <Text style={styles.backButtonText}>Back to Welcome</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Tab switcher */}
            {mode !== "forgot" && (
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, mode === "signin" && styles.activeTab]}
                  onPress={() => setMode("signin")}
                >
                  <Text style={[styles.tabText, mode === "signin" && styles.activeTabText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === "signup" && styles.activeTab]}
                  onPress={() => setMode("signup")}
                >
                  <Text style={[styles.tabText, mode === "signup" && styles.activeTabText]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === "forgot" && (
              <Text style={styles.forgotTitle}>Reset Password</Text>
            )}

            {/* Inputs */}
            <View style={styles.form}>
              {mode === "signup" && (
                <>
                  <View style={styles.inputField}>
                    <User size={18} color="#A0AEC0" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="#A0AEC0"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputField}>
                    <Phone size={18} color="#A0AEC0" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile number"
                      placeholderTextColor="#A0AEC0"
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputField}>
                <Mail size={18} color="#A0AEC0" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {mode !== "forgot" && (
                <View style={styles.inputField}>
                  <Lock size={18} color="#A0AEC0" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 6 chars)"
                    placeholderTextColor="#A0AEC0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === "signin"
                      ? "Sign In"
                      : mode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              {mode === "signin" ? (
                <TouchableOpacity onPress={() => setMode("forgot")}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setMode("signin")}>
                  <Text style={styles.linkText}>Back to sign in</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b21", // Dark Forest Green background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E2E8F0",
    opacity: 0.8,
    marginTop: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  backButtonText: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
  },
  activeTabText: {
    color: "#2E7D32",
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    height: 52,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A202C",
    height: "100%",
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomActions: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
  },
});
