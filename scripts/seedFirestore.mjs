/**
 * Seed Firestore with mock data (same as local mock mode).
 *
 * Prerequisites:
 *   1. Firebase project with Firestore + Email/Password Auth enabled
 *   2. Service account JSON (Firebase Console → Project settings → Service accounts → Generate key)
 *      Save as preplist-a-p/serviceAccountKey.json (gitignored) OR set GOOGLE_APPLICATION_CREDENTIALS
 *
 * Usage:
 *   npm install
 *   npm run seed:firestore
 *   npm run seed:firestore -- --wipe        # delete existing docs first
 *   npm run seed:firestore -- --skip-auth   # Firestore only, no Auth users
 *
 * Env (optional):
 *   SEED_USER_PASSWORD=PrepList123!   default password for all seeded Auth users
 *   FIREBASE_PROJECT_ID=your-firebase-project-id
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";
import { buildSeedDb } from "./lib/buildSeedDb.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const DB_COLLECTION_KEYS = [
  "companies",
  "kitchens",
  "users",
  "kitchenSections",
  "kitchenMemberships",
  "accessCodes",
  "lists",
  "checklistItems",
  "templates",
  "activityLogs",
  "listSnapshots",
  "photos",
  "completions",
  "subscriptionPlans",
  "recipes",
  "recipeDrafts",
  // Category collections — separate per domain as per architecture decision
  "recipeCategories",
  "templateCategories",
  "activityCategories",
];

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "PrepList123!";
const BATCH_LIMIT = 400;

function parseArgs(argv) {
  return {
    wipe: argv.includes("--wipe"),
    skipAuth: argv.includes("--skip-auth"),
  };
}

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return join(root, "serviceAccountKey.json");
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountPath = resolveServiceAccountPath();

  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

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

  let deleted = 0;
  let batch = firestore.batch();
  let operationCount = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    operationCount += 1;
    deleted += 1;

    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return deleted;
}

async function writeCollection(firestore, collectionName, items) {
  if (!Array.isArray(items) || !items.length) {
    return 0;
  }

  let written = 0;
  let batch = firestore.batch();
  let operationCount = 0;

  for (const item of items) {
    const docId = item?.id;
    if (!docId) continue;

    batch.set(
      firestore.collection(collectionName).doc(docId),
      { ...item, id: docId },
      { merge: true }
    );
    operationCount += 1;
    written += 1;

    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return written;
}

async function seedAuthUsers(auth, users) {
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const user of users) {
    if (!user?.email || !user?.id) continue;

    const email = String(user.email).trim().toLowerCase();
    const displayName = String(user.name || email).trim();

    try {
      await auth.getUser(user.id);
      skipped += 1;
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        throw error;
      }

      await auth.createUser({
        uid: user.id,
        email,
        password: DEFAULT_PASSWORD,
        displayName,
        emailVerified: true,
        disabled: user.status === "disabled",
      });
      created += 1;
      continue;
    }

    await auth.updateUser(user.id, {
      email,
      displayName,
      disabled: user.status === "disabled",
    });
    updated += 1;
  }

  return { created, skipped, updated };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("PrepList Firestore seed");
  console.log(`Project root: ${root}`);

  initializeFirebaseAdmin();

  const firestore = admin.firestore();
  const auth = admin.auth();
  const seedDb = buildSeedDb();

  if (options.wipe) {
    console.log("\nWiping existing Firestore collections...");
    for (const key of DB_COLLECTION_KEYS) {
      const deleted = await wipeCollection(firestore, key);
      if (deleted > 0) {
        console.log(`  ${key}: deleted ${deleted} docs`);
      }
    }
  }

  if (!options.skipAuth) {
    console.log("\nCreating Firebase Auth users...");
    const authResult = await seedAuthUsers(auth, seedDb.users);
    console.log(
      `  Auth users — created: ${authResult.created}, updated: ${authResult.updated}, unchanged: ${authResult.skipped}`
    );
    console.log(`  Default password for new users: ${DEFAULT_PASSWORD}`);
  }

  console.log("\nWriting Firestore collections...");
  const totals = {};

  for (const key of DB_COLLECTION_KEYS) {
    const count = await writeCollection(firestore, key, seedDb[key]);
    totals[key] = count;
    console.log(`  ${key}: ${count} docs`);
  }

  const totalDocs = Object.values(totals).reduce((sum, value) => sum + value, 0);

  console.log("\nSeed complete.");
  console.log(`  Total documents: ${totalDocs}`);
  console.log("\nTest login (after wiring VITE_DATA_SOURCE=firebase):");
  console.log(`  Email:    vincent@testa.com`);
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
}

main().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error?.message || error);
  process.exitCode = 1;
});
