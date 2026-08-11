import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppTabParamList } from "./types";
import { DashboardScreen } from "../screens/DashboardScreen";
import { RecommendScreen } from "../screens/RecommendScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { DiseaseScreen } from "../screens/DiseaseScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { Home, Sprout, MessageCircle, Camera, User } from "lucide-react-native";
import { View, StyleSheet, Platform } from "react-native";

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let icon;
          if (route.name === "Home") {
            icon = <Home size={size} color={color} />;
          } else if (route.name === "Crops") {
            icon = <Sprout size={size} color={color} />;
          } else if (route.name === "Assistant") {
            icon = <MessageCircle size={size} color={color} />;
          } else if (route.name === "Diagnose") {
            icon = <Camera size={size} color={color} />;
          } else if (route.name === "Profile") {
            icon = <User size={size} color={color} />;
          }
          return (
            <View style={[styles.iconContainer, focused && styles.focusedIcon]}>
              {icon}
            </View>
          );
        },
        tabBarActiveTintColor: "#2E7D32", // Forest Green primary color
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Crops"
        component={RecommendScreen}
        options={{ tabBarLabel: "Crops" }}
      />
      <Tab.Screen
        name="Assistant"
        component={ChatScreen}
        options={{ tabBarLabel: "Assistant" }}
      />
      <Tab.Screen
        name="Diagnose"
        component={DiseaseScreen}
        options={{ tabBarLabel: "Diagnose" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 32,
    borderRadius: 16,
  },
  focusedIcon: {
    backgroundColor: "rgba(46, 125, 50, 0.1)", // Light green glow
  },
});
