/**
 * RevenueCat webhook handler.
 * Syncs subscription status to Firestore users/{app_user_id}.tier
 *
 * Configure in RevenueCat Dashboard → Integrations → Webhooks:
 * URL: https://<region>-<project>.cloudfunctions.net/revenueCatWebhook
 * Authorization: optional header for verification
 */

import { onRequest } from "firebase-functions/v2/https";
import type { Firestore } from "firebase-admin/firestore";

const ENTITLEMENT_ID = "verbalist_pro";

type WebhookEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "EXPIRATION"
  | "NON_RENEWING_PURCHASE"
  | "UNCANCELLATION"
  | "TEST";

interface RevenueCatWebhookPayload {
  type: WebhookEventType;
  id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  entitlement_ids?: string[] | null;
  entitlement_id?: string | null; // deprecated
}

const EVENTS_GRANT_ACCESS: WebhookEventType[] = [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
];

// Only EXPIRATION revokes; CANCELLATION = user turned off auto-renew but retains access until period ends
const EVENTS_REVOKE_ACCESS: WebhookEventType[] = ["EXPIRATION"];

function hasEntitlement(payload: RevenueCatWebhookPayload): boolean {
  const ids = payload.entitlement_ids ?? (payload.entitlement_id ? [payload.entitlement_id] : []);
  return ids.includes(ENTITLEMENT_ID);
}

function shouldGrantAccess(payload: RevenueCatWebhookPayload): boolean {
  return EVENTS_GRANT_ACCESS.includes(payload.type) && hasEntitlement(payload);
}

function shouldRevokeAccess(payload: RevenueCatWebhookPayload): boolean {
  return EVENTS_REVOKE_ACCESS.includes(payload.type) && hasEntitlement(payload);
}

export function createRevenueCatWebhookHandler(db: Firestore) {
  return onRequest(
    { cors: false },
    async (request, response) => {
      if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
      }

      // Optional: Add Authorization header verification in RevenueCat dashboard
      // const authHeader = request.headers.authorization;

      let payload: RevenueCatWebhookPayload;
      try {
        payload = request.body as RevenueCatWebhookPayload;
      } catch {
        response.status(400).send("Invalid JSON");
        return;
      }

      const eventType = payload.type;
      const appUserId = payload.app_user_id ?? payload.original_app_user_id;

      if (eventType === "TEST") {
        response.status(200).send("OK");
        return;
      }

      if (!appUserId) {
        console.warn("[RevenueCat] Webhook missing app_user_id:", payload.id);
        response.status(200).send("OK");
        return;
      }

      try {
        const userRef = db.collection("users").doc(appUserId);

        if (shouldGrantAccess(payload)) {
          await userRef.update({ tier: "premium" });
          console.log(`[RevenueCat] Set ${appUserId} tier=premium (${eventType})`);
        } else if (shouldRevokeAccess(payload)) {
          await userRef.update({ tier: "free" });
          console.log(`[RevenueCat] Set ${appUserId} tier=free (${eventType})`);
        }

        response.status(200).send("OK");
      } catch (e) {
        console.error("[RevenueCat] Webhook error:", e);
        response.status(500).send("Internal Server Error");
      }
    }
  );
}
