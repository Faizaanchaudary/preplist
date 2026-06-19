import { PERMISSIONS } from "../../shared/constants/permissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { buildDailyHistoryPayload, buildSnapshotsPayload, buildWeeklyHistoryPayload } from "./_builders";
import { createAppError, getVisibleActivityLogs, readDb, requireAuth } from "./_repoHelpers";

function requireActivityPermission(user) {
  const permissions = getUserPermissions(user);

  if (
    !permissions.includes(PERMISSIONS.VIEW_ACTIVITY_LOGS) &&
    !permissions.includes(PERMISSIONS.VIEW_OWN_ACTIVITY)
  ) {
    throw createAppError(403, "You do not have permission to view activity logs.");
  }
}

export async function getActivityLogs(filters = {}) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  const action = typeof filters?.action === "string" ? filters.action : "all";
  const logs = getVisibleActivityLogs(db, currentUser);
  const rows = action === "all" ? logs : logs.filter((log) => log.action === action);

  return { rows };
}

export async function getDailyHistory() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildDailyHistoryPayload(db, currentUser);
}

export async function getWeeklyHistory() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildWeeklyHistoryPayload(db, currentUser);
}

export async function getCarryForwardSnapshots() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildSnapshotsPayload(db, currentUser);
}

