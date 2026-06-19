export { createAppError } from "../core/errors.js";
export { requirePermission } from "../core/guards.js";
export {
  getVisibleKitchens,
  getVisibleLists,
  getVisibleChecklistItems,
  getVisibleActivityLogs,
  getVisibleSnapshots,
  getVisibleRecipes,
  touchUser,
} from "../core/visibility.js";
export {
  getSession,
  setSession,
  clearSession,
  getAuthUid,
  setAuthUid,
  waitForAuthReady,
} from "../core/session.js";
export { readDb, withDbUpdate } from "../data/firestoreDb.js";

export { getSession as getMockSession } from "../core/session.js";
export { setSession as setMockSession } from "../core/session.js";
export { clearSession as clearMockSession } from "../core/session.js";

import { getSession, getAuthUid } from "../core/session.js";
import { createAppError } from "../core/errors.js";

export function getCurrentUser(db) {
  const session = getSession();
  const userId = getAuthUid() ?? session.userId;

  if (!userId) return null;

  return (db?.users ?? []).find((user) => user.id === userId) ?? null;
}

export function requireAuth(db) {
  const user = getCurrentUser(db);
  if (!user) {
    throw createAppError(401, "Not authenticated.");
  }

  return user;
}
