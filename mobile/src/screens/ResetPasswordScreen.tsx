import React, { useState } from "react";
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
import { Lock, Leaf, ArrowLeft } from "lucide-react-native";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      Alert.alert("Invalid Input", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Invalid Input", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert("Success", "Password updated successfully! Please log in with your new password.", [
        { text: "OK", onPress: () => navigation.navigate("Auth", { mode: "signin" }) },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reset password.");
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
            <Text style={styles.headerSubtitle}>Set your new password</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter New Password</Text>
            <View style={styles.form}>
              <View style={styles.inputField}>
                <Lock size={18} color="#A0AEC0" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Password (min 6 chars)"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputField}>
                <Lock size={18} color="#A0AEC0" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#A0AEC0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to sign in */}
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.navigate("Auth", { mode: "signin" })}
            >
              <ArrowLeft size={14} color="#2E7D32" />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
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
  cardTitle: {
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
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  backLinkText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
  },
});
