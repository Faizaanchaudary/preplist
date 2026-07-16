/**
 * Mock categories repository.
 *
 * Serves `recipeCategories`, `templateCategories`, and `activityCategories`
 * from the in-memory mock DB.  All three functions are intentionally public
 * and parallel — each collection is independent.
 *
 * Response shape: `{ rows: Array<{ id: string, name: string }> }`
 * This matches what the Firebase categories.repository.js will return.
 */
import { readDb } from "./_repoHelpers";

export async function getRecipeCategories() {
  const db = readDb();
  return { rows: db.recipeCategories ?? [] };
}

export async function getTemplateCategories() {
  const db = readDb();
  return { rows: db.templateCategories ?? [] };
}

export async function getActivityCategories() {
  const db = readDb();
  return { rows: db.activityCategories ?? [] };
}
