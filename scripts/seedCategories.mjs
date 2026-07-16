/**
 * Seed only the category collections into Firestore.
 *
 * Writes `recipeCategories`, `templateCategories`, and `activityCategories`
 * using merge:true so no other data is touched.
 *
 * Prerequisites:
 *   - Service account key at preplist-a-p/serviceAccountKey.json
 *     OR set GOOGLE_APPLICATION_CREDENTIALS env variable
 *
 * Usage:
 *   npm run seed:categories
 *   npm run seed:categories -- --wipe     # delete existing category docs first
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

import { recipeCategories } from "../src/mocks/data/recipe-categories.data.js";
import { templateCategories } from "../src/mocks/data/template-categories.data.js";
import { activityCategories } from "../src/mocks/data/activity-categories.data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Collections to seed — ONLY categories, nothing else
const CATEGORY_COLLECTIONS = {
  recipeCategories,
  templateCategories,
  activityCategories,
};

function parseArgs(argv) {
  return {
    wipe: argv.includes("--wipe"),
  };
}

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  return join(root, "serviceAccountKey.json");
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const serviceAccountPath = resolveServiceAccountPath();

  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    return admin.app();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      [
        "Firebase Admin credentials not found.",
        "Download a service account key from Firebase Console and save it as:",
        `  ${join(root, "serviceAccountKey.json")}`,
        "Or set GOOGLE_APPLICATION_CREDENTIALS to the key file path.",
      ].join("\n")
    );
  }

  admin.initializeApp({ projectId });
  return admin.app();
}

async function wipeCollection(firestore, collectionName) {
  const snapshot = await firestore.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const BATCH_LIMIT = 400;
  let deleted = 0;
  let batch = firestore.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    deleted++;

    if (count >= BATCH_LIMIT) {
      await batch.commit();
      batch = firestore.batch();
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
  return deleted;
}

async function writeCollection(firestore, collectionName, items) {
  if (!Array.isArray(items) || !items.length) return 0;

  const BATCH_LIMIT = 400;
  let written = 0;
  let batch = firestore.batch();
  let count = 0;

  for (const item of items) {
    if (!item?.id) continue;

    batch.set(
      firestore.collection(collectionName).doc(item.id),
      { ...item },
      { merge: true }
    );

    count++;
    written++;

    if (count >= BATCH_LIMIT) {
      await batch.commit();
      batch = firestore.batch();
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
  return written;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("PrepList — Category Collections Seed");
  console.log("=====================================");

  initFirebaseAdmin();
  const firestore = admin.firestore();

  if (options.wipe) {
    console.log("\nWiping existing category collections...");
    for (const collectionName of Object.keys(CATEGORY_COLLECTIONS)) {
      const deleted = await wipeCollection(firestore, collectionName);
      console.log(`  ${collectionName}: deleted ${deleted} docs`);
    }
  }

  console.log("\nWriting category collections...");
  for (const [collectionName, items] of Object.entries(CATEGORY_COLLECTIONS)) {
    const written = await writeCollection(firestore, collectionName, items);
    console.log(`  ${collectionName}: ${written} docs written`);
  }

  console.log("\nDone! ✓ Only category collections were touched.");
}

main().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error?.message || error);
  process.exitCode = 1;
});
