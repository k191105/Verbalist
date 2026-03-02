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
import * as Notifications from "expo-notifications";
import {
  registerForPushNotifications,
  savePushTokenToFirestore,
} from "./src/services/notifications";
import {
  navigateToChatFromNotification,
  navigateToChatFromNotificationWhenReady,
} from "./src/navigation/RootNavigator";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { ThemeProvider, useTheme } from "./src/hooks/useTheme";
import { PurchasesProvider } from "./src/hooks/usePurchases";
import RootNavigator from "./src/navigation/RootNavigator";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading, user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    console.log(`Firebase initialized: ${app.name}`);
  }, []);

  // Register for push notifications when user is logged in
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await savePushTokenToFirestore(user.id, token);
        } catch (e) {
          console.warn("Failed to save push token:", e);
        }
      }
    })();
  }, [user?.id]);

  // Handle notification tap: navigate to Chat with personaId
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { action?: string; personaId?: string }
        | undefined;
      const action = data?.action;
      const personaId = data?.personaId ?? "chris";
      if (action === "openChat" && personaId) {
        navigateToChatFromNotification(personaId);
      }
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as
          | { action?: string; personaId?: string }
          | undefined;
        const action = data?.action;
        const personaId = data?.personaId ?? "chris";
        if (action === "openChat" && personaId) {
          navigateToChatFromNotificationWhenReady(personaId);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <PurchasesProvider userId={user?.id ?? null}>
    <>
      <RootNavigator />
      <StatusBar style={theme.background.startsWith("#2") ? "light" : "dark"} />
    </>
    </PurchasesProvider>
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
