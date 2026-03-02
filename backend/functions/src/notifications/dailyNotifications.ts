/**
 * Cloud Function: sendDailyNotifications
 * Scheduled daily (9 AM) to send push notifications to users with notificationToken.
 * Uses Expo Push API.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const DAILY_MESSAGES = [
  "Ready to learn some new words?",
  "Chris is waiting to chat with you!",
  "Time for a quick vocabulary boost?",
  "Your daily conversation with Chris awaits.",
  "Let's practice some words together!",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const sendDailyNotifications = onSchedule(
  {
    schedule: "0 9 * * *", // 9 AM daily (cron: min hour day month dayOfWeek)
    timeZone: "America/Los_Angeles",
  },
  async () => {
    const db = admin.firestore();

    const usersSnap = await db
      .collection("users")
      .where("notificationToken", "!=", null)
      .get();

    const messages: Array<{
      to: string;
      title: string;
      body: string;
      sound?: "default";
      data: { action: string; personaId: string };
    }> = [];

    for (const doc of usersSnap.docs) {
      const token = doc.data().notificationToken as string | undefined;
      if (!token || typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
        continue;
      }
      messages.push({
        to: token,
        title: "Chris sent you a message",
        body: pickRandom(DAILY_MESSAGES),
        sound: "default",
        data: { action: "openChat", personaId: "chris" },
      });
    }

    if (messages.length === 0) {
      console.log("No users with notification tokens to notify.");
      return;
    }

    // Expo Push API accepts up to 100 messages per request
    const batches: typeof messages[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    for (const batch of batches) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Expo Push API error:", res.status, text);
        throw new Error(`Expo Push failed: ${res.status}`);
      }

      const result = await res.json();
      const tickets = Array.isArray(result) ? result : result.data ?? [];
      const errors = tickets.filter((t: { status?: string }) => t.status === "error");
      if (errors.length > 0) {
        console.warn("Some push notifications failed:", errors);
      }
    }

    console.log(`Sent ${messages.length} daily notifications.`);
  }
);
