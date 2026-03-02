"use strict";
/**
 * RevenueCat webhook handler.
 * Syncs subscription status to Firestore users/{app_user_id}.tier
 *
 * Configure in RevenueCat Dashboard → Integrations → Webhooks:
 * URL: https://<region>-<project>.cloudfunctions.net/revenueCatWebhook
 * Authorization: optional header for verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevenueCatWebhookHandler = createRevenueCatWebhookHandler;
const https_1 = require("firebase-functions/v2/https");
const ENTITLEMENT_ID = "verbalist_pro";
const EVENTS_GRANT_ACCESS = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
];
// Only EXPIRATION revokes; CANCELLATION = user turned off auto-renew but retains access until period ends
const EVENTS_REVOKE_ACCESS = ["EXPIRATION"];
function hasEntitlement(payload) {
    var _a;
    const ids = (_a = payload.entitlement_ids) !== null && _a !== void 0 ? _a : (payload.entitlement_id ? [payload.entitlement_id] : []);
    return ids.includes(ENTITLEMENT_ID);
}
function shouldGrantAccess(payload) {
    return EVENTS_GRANT_ACCESS.includes(payload.type) && hasEntitlement(payload);
}
function shouldRevokeAccess(payload) {
    return EVENTS_REVOKE_ACCESS.includes(payload.type) && hasEntitlement(payload);
}
function createRevenueCatWebhookHandler(db) {
    return (0, https_1.onRequest)({ cors: false }, async (request, response) => {
        var _a;
        if (request.method !== "POST") {
            response.status(405).send("Method Not Allowed");
            return;
        }
        // Optional: Add Authorization header verification in RevenueCat dashboard
        // const authHeader = request.headers.authorization;
        let payload;
        try {
            payload = request.body;
        }
        catch (_b) {
            response.status(400).send("Invalid JSON");
            return;
        }
        const eventType = payload.type;
        const appUserId = (_a = payload.app_user_id) !== null && _a !== void 0 ? _a : payload.original_app_user_id;
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
            }
            else if (shouldRevokeAccess(payload)) {
                await userRef.update({ tier: "free" });
                console.log(`[RevenueCat] Set ${appUserId} tier=free (${eventType})`);
            }
            response.status(200).send("OK");
        }
        catch (e) {
            console.error("[RevenueCat] Webhook error:", e);
            response.status(500).send("Internal Server Error");
        }
    });
}
//# sourceMappingURL=revenueCat.js.map