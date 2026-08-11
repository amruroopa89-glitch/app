import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { CloudRain, Bug, TrendingUp, Droplets, ArrowRight } from "lucide-react-native";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Glow effect */}
        <View style={styles.glow} />

        <View style={styles.header}>
          <Text style={styles.title}>
            Grow Smarter with <Text style={styles.accent}>AI</Text>
          </Text>
          <Text style={styles.subtitle}>
            Personalized crop recommendations, instant disease detection, and real-time market insights — all in your pocket.
          </Text>
        </View>

        <Image
          source={require("../assets/farmer-mascot.png")}
          style={styles.mascot}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Auth", { mode: "signup" })}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Auth", { mode: "signin" })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresGrid}>
          <Feature icon={<CloudRain size={24} color="#81C784" />} label="Weather Alerts" />
          <Feature icon={<Bug size={24} color="#81C784" />} label="Pest Warnings" />
          <Feature icon={<TrendingUp size={24} color="#81C784" />} label="Market Prices" />
          <Feature icon={<Droplets size={24} color="#81C784" />} label="Water Tips" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b21", // Dark Forest Green
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    top: "20%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(129, 199, 132, 0.15)",
    filter: "blur(50px)",
    zIndex: -1,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 40,
  },
  accent: {
    color: "#81C784", // Light green highlight
  },
  subtitle: {
    fontSize: 14,
    color: "#E2E8F0",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  mascot: {
    width: width * 0.7,
    height: width * 0.7,
    marginVertical: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2E7D32", // Forest Green action button
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    gap: 10,
  },
  featureCard: {
    width: (width - 50) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  iconWrapper: {
    backgroundColor: "rgba(129, 199, 132, 0.1)",
    padding: 8,
    borderRadius: 12,
  },
  featureLabel: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});
