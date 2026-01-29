import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  CrimsonPro_300Light,
  CrimsonPro_400Regular,
  CrimsonPro_600SemiBold,
} from "@expo-google-fonts/crimson-pro";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import * as SplashScreen from "expo-splash-screen";
import { app } from "./src/services/firebase";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { ThemeProvider, useTheme } from "./src/hooks/useTheme";
import RootNavigator from "./src/navigation/RootNavigator";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();
  const { theme, themeName } = useTheme();

  useEffect(() => {
    console.log(`Firebase initialized: ${app.name}`);
  }, []);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style={themeName === "obsidian" ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CrimsonPro_300Light,
    CrimsonPro_400Regular,
    CrimsonPro_600SemiBold,
    DMSerifDisplay_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
