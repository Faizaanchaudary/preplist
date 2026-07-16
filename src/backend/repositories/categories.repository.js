/**
 * Firebase backend categories repository.
 *
 * Provides read-only access to the three category collections:
 *   - recipeCategories
 *   - templateCategories
 *   - activityCategories
 *
 * These collections are seeded with hardcoded data and are globally readable
 * (no kitchen-scope filter required — categories are shared across all kitchens).
 *
 * Response shape: `{ rows: Array<{ id: string, name: string }> }`
 *
 * @see docs/FIREBASE_BACKEND.md — Section 4 (Layer responsibilities)
 */
import { COLLECTIONS } from "../firestore/collections.js";
import { createAppError, readDb, requireAuth } from "./_repoContext.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all documents from a given category collection, ordered by name.
 * Returns a flat `rows` array — no pagination needed for small category lists.
 *
 * @param {string} collectionName  One of the COLLECTIONS.* category constants
 */
async function fetchCategoryRows(collectionName) {
  const db = await readDb();

  // db is the in-memory snapshot; category arrays are keyed by collection name.
  // Map collection string to the db key used during seeding.
  const dbKey = collectionName; // collection names match seed keys (camelCase)
  const rows = (db[dbKey] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  return { rows };
}

// ---------------------------------------------------------------------------
// Public API — must match mock categories.repository.js exactly
// ---------------------------------------------------------------------------

/**
 * Returns all recipe category options.
 * Used to populate the Category dropdown on the Recipe form.
 */
export async function getRecipeCategories() {
  return fetchCategoryRows(COLLECTIONS.RECIPE_CATEGORIES);
}

/**
 * Returns all template category options.
 * Used to populate the Category dropdown on the Template form.
 */
export async function getTemplateCategories() {
  return fetchCategoryRows(COLLECTIONS.TEMPLATE_CATEGORIES);
}

/**
 * Returns all activity category options.
 * Used by the mobile Activity screen to build the category tab-bar filter.
 */
export async function getActivityCategories() {
  return fetchCategoryRows(COLLECTIONS.ACTIVITY_CATEGORIES);
}
