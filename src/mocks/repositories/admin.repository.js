import { PERMISSIONS } from "../../shared/constants/permissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { buildAdminRolesPayload } from "./_builders";
import { createAppError, readDb, requireAuth } from "./_repoHelpers";

function requireAdminAccess(user) {
  const permissions = getUserPermissions(user);

  if (!permissions.includes(PERMISSIONS.VIEW_ADMIN_MONITORING)) {
    throw createAppError(403, "You do not have permission to view admin monitoring.");
  }
}

export async function getAdminRoles() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireAdminAccess(currentUser);

  return buildAdminRolesPayload();
}
