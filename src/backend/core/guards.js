import { getUserPermissions } from "../../shared/utils/rbac.js";
import { createAppError } from "./errors.js";

export function requirePermission(user, permission) {
  if (!permission) return;

  const permissions = getUserPermissions(user);
  if (!permissions.includes(permission)) {
    throw createAppError(403, "You do not have permission to perform this action.");
  }
}

export function requireAuthFromDb(db, userId) {
  if (!userId) {
    throw createAppError(401, "Not authenticated.");
  }

  const user = (db?.users ?? []).find((entry) => entry.id === userId) ?? null;
  if (!user) {
    throw createAppError(401, "Not authenticated.");
  }

  return user;
}
