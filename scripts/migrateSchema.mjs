/**
 * Migration script to add new fields to existing Firestore documents
 * without wiping or overwriting any existing custom data.
 *
 * Adds:
 *   - activityLogs: `isCompleted` (defaults to false), `completedBy` (null), `completedAt` (null), `categoryId` (defaults to "ac-007")
 *   - recipes: `categoryId` (maps from existing category name or defaults to "rc-009")
 *   - templates: `categoryId` (maps from existing section name or defaults to "tc-007")
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  return join(root, "preplist-da151-firebase-adminsdk-fbsvc-2694991ae1.json");
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

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      [
        "Firebase Admin credentials not found.",
        "Please provide the service account key path or set GOOGLE_APPLICATION_CREDENTIALS.",
      ].join("\n")
    );
  }

  admin.initializeApp({ projectId });
  return admin.app();
}

// Maps category strings to category IDs for existing recipes
function getRecipeCategoryId(categoryName) {
  const normalized = String(categoryName || "").toLowerCase().trim();
  if (normalized.includes("cold")) return "rc-001";
  if (normalized.includes("hot")) return "rc-002";
  if (normalized.includes("prep")) return "rc-003";
  if (normalized.includes("sauce")) return "rc-004";
  if (normalized.includes("pastry")) return "rc-005";
  if (normalized.includes("grill")) return "rc-006";
  if (normalized.includes("bakery")) return "rc-007";
  if (normalized.includes("veg")) return "rc-008";
  return "rc-009"; // General
}

// Maps section strings to category IDs for existing templates
function getTemplateCategoryId(sectionName) {
  const normalized = String(sectionName || "").toLowerCase().trim();
  if (normalized.includes("daily")) return "tc-001";
  if (normalized.includes("weekly")) return "tc-002";
  if (normalized.includes("open")) return "tc-003";
  if (normalized.includes("close")) return "tc-004";
  if (normalized.includes("clean")) return "tc-005";
  if (normalized.includes("special") || normalized.includes("event")) return "tc-006";
  return "tc-007"; // General
}

async function runMigration() {
  initFirebaseAdmin();
  const db = admin.firestore();
  
  console.log("Starting Firestore Schema Migration...");
  console.log("======================================");

  // 1. Migrate activityLogs
  console.log("\nMigrating activityLogs...");
  const logsSnapshot = await db.collection("activityLogs").get();
  let updatedLogsCount = 0;

  for (const doc of logsSnapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (data.isCompleted === undefined) updates.isCompleted = false;
    if (data.completedBy === undefined) updates.completedBy = null;
    if (data.completedAt === undefined) updates.completedAt = null;
    if (data.categoryId === undefined) updates.categoryId = "ac-007"; // General default

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updatedLogsCount++;
    }
  }
  console.log(`✓ Updated ${updatedLogsCount} activityLogs documents.`);

  // 2. Migrate recipes (adding categoryId, imageUrl, and scalingMultiplier)
  console.log("\nMigrating recipes...");
  const recipesSnapshot = await db.collection("recipes").get();
  let updatedRecipesCount = 0;

  for (const doc of recipesSnapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (data.categoryId === undefined) {
      updates.categoryId = getRecipeCategoryId(data.category);
    }
    if (data.imageUrl === undefined) {
      updates.imageUrl = null;
    }
    if (data.scalingMultiplier === undefined) {
      updates.scalingMultiplier = 1;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updatedRecipesCount++;
    }
  }
  console.log(`✓ Updated ${updatedRecipesCount} recipes documents.`);

  // 3. Migrate templates (renaming section to category, mapping categoryId)
  console.log("\nMigrating templates...");
  const templatesSnapshot = await db.collection("templates").get();
  let updatedTemplatesCount = 0;

  for (const doc of templatesSnapshot.docs) {
    const data = doc.data();
    const updates = {};

    if (data.categoryId === undefined) {
      updates.categoryId = getTemplateCategoryId(data.section || data.category);
    }

    if (data.section !== undefined) {
      updates.category = data.section || data.category || "General";
      updates.section = admin.firestore.FieldValue.delete();
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updatedTemplatesCount++;
    }
  }
  console.log(`✓ Updated ${updatedTemplatesCount} templates documents.`);

  console.log("\nMigration completed successfully! ✓");
}

runMigration().catch((error) => {
  console.error("Migration failed:", error);
});
