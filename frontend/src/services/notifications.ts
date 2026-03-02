/**
 * Push notifications service.
 * Registers for push notifications, obtains Expo push token, stores in Firestore.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebase";

// Configure how notifications are displayed when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

const NOTIFICATION_CHANNEL_ID = "verbalist_daily";

/**
 * Request notification permissions and register for push notifications.
 * Returns the Expo push token, or null if unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[Notifications] Push notifications require a physical device");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Daily reminder",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#26428B",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (status !== "granted") {
      console.warn("[Notifications] Permission denied");
      return null;
    }
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn(
        "[Notifications] EAS projectId not found. Add to app.json: extra.eas.projectId"
      );
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token:", e);
    return null;
  }
}

/**
 * Store the push token in the user's Firestore document.
 */
export async function savePushTokenToFirestore(
  userId: string,
  token: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  await updateDoc(ref, { notificationToken: token });
}

/**
 * Remove the push token from Firestore (e.g. on sign out).
 */
export async function clearPushTokenFromFirestore(
  userId: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  await updateDoc(ref, { notificationToken: null });
}
