import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { TEMPLATE_WORD_LISTS } from "../../shared/config/wordLists";

// Since we are using ESM/tsx, we need this to get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your service account key (make sure the file name matches exactly)
const serviceAccountPath = join(__dirname, "../serviceAccountKey.json");

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (err) {
  console.error("Error: Could not find or read serviceAccountKey.json in the backend folder.");
  process.exit(1);
}

const db = admin.firestore();

async function seedWordLists() {
  console.log("Starting seed process...");
  const batch = db.batch();

  TEMPLATE_WORD_LISTS.forEach((list) => {
    // We use the ID from the wordList config (e.g., 'business-essentials')
    const ref = db.collection("wordLists").doc(list.id);
    batch.set(ref, {
      name: list.name,
      description: list.description,
      words: list.words,
      wordCount: list.words.length,
      isTemplate: true,
      userId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`✅ Success! Seeded ${TEMPLATE_WORD_LISTS.length} template lists.`);
}

seedWordLists().catch((error) => {
  console.error("❌ Failed to seed word lists:", error);
  process.exit(1);
});