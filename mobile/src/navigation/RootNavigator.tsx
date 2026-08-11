import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View, StyleSheet, StatusBar } from "react-native";
import { supabase } from "../services/supabase";
import { AuthStack } from "./AuthStack";
import { AppTabs } from "./AppTabs";

export function RootNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }: any) => {
      setSession(currentSession);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {session ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
