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
exports.createChatSession = exports.helloWorld = exports.db = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sessionManager_1 = require("./chat/sessionManager");
// Initialize Firebase Admin SDK
admin.initializeApp();
// Export Firestore instance for use in other modules
exports.db = admin.firestore();
/**
 * Test function to verify Cloud Functions are working
 * HTTP endpoint that returns "Hello"
 */
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello");
});
/**
 * Create a new chat session
 * Callable function that initializes a chat with word bag
 */
exports.createChatSession = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create a session");
    }
    const { personaId, wordListId } = data;
    // Validate required fields
    if (!personaId || !wordListId) {
        throw new functions.https.HttpsError("invalid-argument", "personaId and wordListId are required");
    }
    // Validate personaId
    const validPersonas = ["chris", "gemma", "eva", "sid"];
    if (!validPersonas.includes(personaId)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid personaId");
    }
    try {
        const result = await (0, sessionManager_1.createSession)(exports.db, context.auth.uid, personaId, wordListId);
        return result;
    }
    catch (error) {
        console.error("Error creating session:", error);
        throw new functions.https.HttpsError("internal", "Failed to create chat session");
    }
});
//# sourceMappingURL=index.js.map