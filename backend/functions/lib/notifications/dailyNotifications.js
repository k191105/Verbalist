"use strict";
/**
 * Cloud Function: sendDailyNotifications
 * Scheduled daily (9 AM) to send push notifications to users with notificationToken.
 * Uses Expo Push API.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyNotifications = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const DAILY_MESSAGES = [
    "Ready to learn some new words?",
    "Chris is waiting to chat with you!",
    "Time for a quick vocabulary boost?",
    "Your daily conversation with Chris awaits.",
    "Let's practice some words together!",
];
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
exports.sendDailyNotifications = (0, scheduler_1.onSchedule)({
    schedule: "0 9 * * *", // 9 AM daily (cron: min hour day month dayOfWeek)
    timeZone: "America/Los_Angeles",
}, async () => {
    var _a;
    const db = admin.firestore();
    const usersSnap = await db
        .collection("users")
        .where("notificationToken", "!=", null)
        .get();
    const messages = [];
    for (const doc of usersSnap.docs) {
        const token = doc.data().notificationToken;
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
    const batches = [];
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
        const tickets = Array.isArray(result) ? result : (_a = result.data) !== null && _a !== void 0 ? _a : [];
        const errors = tickets.filter((t) => t.status === "error");
        if (errors.length > 0) {
            console.warn("Some push notifications failed:", errors);
        }
    }
    console.log(`Sent ${messages.length} daily notifications.`);
});
//# sourceMappingURL=dailyNotifications.js.map