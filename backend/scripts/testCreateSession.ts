/**
 * Test script to manually invoke createSession and verify Firestore writes
 * 
 * Run with: npx tsx backend/scripts/testCreateSession.ts
 */

import * as admin from "firebase-admin";
import * as path from "path";

// Initialize Firebase Admin with service account
// You'll need to download a service account key from Firebase Console:
// Project Settings > Service accounts > Generate new private key
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
} catch (error) {
  console.error("Failed to initialize Firebase Admin.");
  console.error("Make sure you have downloaded your service account key from:");
  console.error("Firebase Console > Project Settings > Service accounts > Generate new private key");
  console.error("Save it as: backend/scripts/serviceAccountKey.json");
  process.exit(1);
}

const db = admin.firestore();

// Constants
const WORD_BAG_SIZE = { min: 3, max: 5 };

interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

async function testCreateSession() {
  console.log("=== Testing createSession ===\n");

  // Test parameters
  const testUserId = "test-user-" + Date.now();
  const testPersonaId = "chris";
  const testWordListId = "template-general";

  console.log("Test parameters:");
  console.log(`  userId: ${testUserId}`);
  console.log(`  personaId: ${testPersonaId}`);
  console.log(`  wordListId: ${testWordListId}`);
  console.log();

  // Step 1: Check if word list exists
  console.log("Step 1: Checking if word list exists...");
  const wordListDoc = await db.collection("wordLists").doc(testWordListId).get();

  if (!wordListDoc.exists) {
    console.log(`  Word list "${testWordListId}" not found.`);
    console.log("  Creating a test word list...");

    // Create a test word list
    await db.collection("wordLists").doc(testWordListId).set({
      id: testWordListId,
      name: "General Vocabulary",
      isTemplate: true,
      createdAt: admin.firestore.Timestamp.now(),
      words: [
        "ubiquitous", "ephemeral", "pragmatic", "eloquent", "resilient",
        "ambiguous", "candid", "diligent", "empathy", "fervent",
        "gregarious", "hackneyed", "impetuous", "juxtapose", "keen"
      ],
      wordCount: 15,
      description: "Essential vocabulary for everyday conversations",
    });
    console.log("  Test word list created.");
  } else {
    console.log("  Word list found.");
  }
  console.log();

  // Step 2: Fetch word list and select words
  console.log("Step 2: Fetching word list and selecting words...");
  const wordList = (await db.collection("wordLists").doc(testWordListId).get()).data();
  const words: string[] = wordList?.words || [];
  console.log(`  Found ${words.length} words in list.`);

  const bagSize = Math.floor(Math.random() * (WORD_BAG_SIZE.max - WORD_BAG_SIZE.min + 1)) + WORD_BAG_SIZE.min;
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selectedWords = shuffled.slice(0, bagSize);
  console.log(`  Selected ${selectedWords.length} words: ${selectedWords.join(", ")}`);
  console.log();

  // Step 3: Create word bag
  const wordBag: WordBagItem[] = selectedWords.map((word) => ({
    word,
    targetUseCount: 1,
    currentUseCount: 0,
  }));

  // Step 4: Create session document
  console.log("Step 3: Creating session document...");
  const sessionRef = db.collection("chatSessions").doc();
  const session = {
    id: sessionRef.id,
    userId: testUserId,
    personaId: testPersonaId,
    wordListId: testWordListId,
    status: "active",
    startedAt: admin.firestore.Timestamp.now(),
    messageCount: 0,
    wordBag,
    contextWindow: [],
  };

  await sessionRef.set(session);
  console.log(`  Session created with ID: ${sessionRef.id}`);
  console.log();

  // Step 5: Create first message
  console.log("Step 4: Creating first message...");
  const firstMessage = "Hey! I'd love to chat with you. What's on your mind today?";
  const messageRef = db.collection("messages").doc();
  await messageRef.set({
    id: messageRef.id,
    sessionId: sessionRef.id,
    role: "assistant",
    content: firstMessage,
    timestamp: admin.firestore.Timestamp.now(),
  });
  console.log(`  Message created with ID: ${messageRef.id}`);
  console.log();

  // Step 6: Update session context window
  console.log("Step 5: Updating session context window...");
  await sessionRef.update({
    contextWindow: admin.firestore.FieldValue.arrayUnion(messageRef.id),
    messageCount: 1,
  });
  console.log("  Session updated.");
  console.log();

  // Step 7: Verify by reading back
  console.log("Step 6: Verifying documents...");
  const verifySession = await sessionRef.get();
  const verifyMessage = await messageRef.get();

  console.log("  Session document:");
  console.log(JSON.stringify(verifySession.data(), null, 2));
  console.log();
  console.log("  Message document:");
  console.log(JSON.stringify(verifyMessage.data(), null, 2));
  console.log();

  console.log("=== Test Complete ===");
  console.log("\nCheck Firebase Console > Firestore to see:");
  console.log("  - chatSessions collection");
  console.log("  - messages collection");
  console.log("  - wordLists collection (if created)");
}

testCreateSession()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
