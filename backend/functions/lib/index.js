"use strict";
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
exports.deleteAccount = exports.sendDailyNotifications = exports.sendChatMessage = exports.createChatSession = exports.helloWorld = exports.revenueCatWebhook = exports.db = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const sessionManager_1 = require("./chat/sessionManager");
const messageHandler_1 = require("./chat/messageHandler");
const accountDeletion_1 = require("./user/accountDeletion");
const revenueCat_1 = require("./webhooks/revenueCat");
const dailyNotifications_1 = require("./notifications/dailyNotifications");
Object.defineProperty(exports, "sendDailyNotifications", { enumerable: true, get: function () { return dailyNotifications_1.sendDailyNotifications; } });
// Initialize Firebase Admin SDK
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
// Export Firestore instance for use in other modules
exports.db = admin.firestore();
// RevenueCat webhook: sync subscription status to Firestore tier
// Configure URL in RevenueCat Dashboard → Integrations → Webhooks
exports.revenueCatWebhook = (0, revenueCat_1.createRevenueCatWebhookHandler)(exports.db);
exports.helloWorld = (0, https_1.onRequest)((request, response) => {
    response.send("Hello");
});
exports.createChatSession = (0, https_1.onCall)({ secrets: ["OPENAI_API_KEY"] }, async (request) => {
    const data = request.data;
    const context = request.auth;
    if (!context) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to create a session");
    }
    const { personaId, wordListId } = data;
    if (!personaId || !wordListId) {
        throw new https_1.HttpsError("invalid-argument", "personaId and wordListId are required");
    }
    const validPersonas = ["chris", "gemma", "eva", "sid"];
    if (!validPersonas.includes(personaId)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid personaId");
    }
    try {
        const result = await (0, sessionManager_1.createSession)(exports.db, context.uid, personaId, wordListId);
        return result;
    }
    catch (error) {
        console.error("Error creating session:", error);
        throw new https_1.HttpsError("internal", "Failed to create chat session");
    }
});
exports.sendChatMessage = (0, https_1.onCall)({ secrets: ["OPENAI_API_KEY"] }, async (request) => {
    const data = request.data;
    const context = request.auth;
    if (!context) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to send a message");
    }
    const { sessionId, message, retryFromMessageId } = data;
    if (!sessionId || !message) {
        throw new https_1.HttpsError("invalid-argument", "sessionId and message are required");
    }
    if (typeof message !== "string" || message.length > 500) {
        throw new https_1.HttpsError("invalid-argument", "Message must be a string of 500 characters or fewer");
    }
    try {
        const result = await (0, messageHandler_1.sendMessage)(exports.db, sessionId, message, retryFromMessageId || undefined, context.uid);
        return result;
    }
    catch (error) {
        console.error("Error sending message:", error);
        throw new https_1.HttpsError("internal", "Failed to send message");
    }
});
exports.deleteAccount = (0, https_1.onCall)(async (request) => {
    const context = request.auth;
    if (!context) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in to delete account");
    }
    try {
        await (0, accountDeletion_1.deleteUserAccount)(exports.db, admin.auth(), context.uid);
        return { success: true };
    }
    catch (error) {
        console.error("Account deletion error:", error);
        throw new https_1.HttpsError("internal", "Failed to delete account");
    }
});
//# sourceMappingURL=index.js.map