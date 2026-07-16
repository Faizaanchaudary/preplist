/**
 * Mock activity repository.
 *
 * Provides activity log reads, history aggregations, and task completion.
 *
 * Key design decisions:
 *   - No separate `history` collection.  History is derived by filtering
 *     `activityLogs` where `isCompleted === true`, grouped by month.
 *   - `completeActivityLog` sets `isCompleted`, `completedBy`, and `completedAt`
 *     on the existing log document — no new doc is created.
 */
import { PERMISSIONS } from "../../shared/constants/permissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import {
  buildDailyHistoryPayload,
  buildSnapshotsPayload,
  buildWeeklyHistoryPayload,
} from "./_builders";
import {
  createAppError,
  getVisibleActivityLogs,
  readDb,
  requireAuth,
  withDbUpdate,
} from "./_repoHelpers";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function requireActivityPermission(user) {
  const permissions = getUserPermissions(user);

  if (
    !permissions.includes(PERMISSIONS.VIEW_ACTIVITY_LOGS) &&
    !permissions.includes(PERMISSIONS.VIEW_OWN_ACTIVITY)
  ) {
    throw createAppError(403, "You do not have permission to view activity logs.");
  }
}

/**
 * Enrich an activity log row with resolved actor/completedBy names.
 */
function mapActivityLogRow(db, log) {
  const actor = db.users.find((user) => user.id === log.actorId) ?? null;
  const completedByUser =
    log.completedBy ? db.users.find((user) => user.id === log.completedBy) ?? null : null;

  return {
    ...log,
    actor: actor?.name ?? "Unknown",
    completedByName: completedByUser?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all activity logs visible to the current user.
 * Supports optional `action` and `categoryId` filters.
 *
 * @param {{ action?: string, categoryId?: string, isCompleted?: boolean }} filters
 */
export async function getActivityLogs(filters = {}) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  let logs = getVisibleActivityLogs(db, currentUser);

  if (typeof filters.action === "string" && filters.action !== "all") {
    logs = logs.filter((log) => log.action === filters.action);
  }

  if (typeof filters.categoryId === "string" && filters.categoryId !== "all") {
    logs = logs.filter((log) => log.categoryId === filters.categoryId);
  }

  // Allow callers to explicitly filter by completion state (mobile uses this
  // to separate the Activity screen from the History screen).
  if (typeof filters.isCompleted === "boolean") {
    logs = logs.filter((log) => log.isCompleted === filters.isCompleted);
  }

  if (typeof filters.actorId === "string") {
    logs = logs.filter((log) => log.actorId === filters.actorId);
  }

  if (typeof filters.completedBy === "string") {
    logs = logs.filter((log) => log.completedBy === filters.completedBy);
  }

  const rows = logs
    .map((log) => mapActivityLogRow(db, log))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { rows };
}

/**
 * Mark an activity log as completed.
 * Sets `isCompleted = true`, records `completedBy` and `completedAt`.
 *
 * Mobile: "Completed by Chef Vince" is derived from the completedBy userId.
 *
 * @param {string} logId
 */
export async function completeActivityLog(logId) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  const log = db.activityLogs.find((entry) => entry.id === logId);

  if (!log) {
    throw createAppError(404, "Activity log not found.");
  }

  if (log.isCompleted) {
    throw createAppError(409, "Activity log is already completed.");
  }

  const now = new Date().toISOString();

  let updatedLog;

  await withDbUpdate((draft) => {
    const logEntry = draft.activityLogs.find((entry) => entry.id === logId);
    if (logEntry) {
      logEntry.isCompleted = true;
      logEntry.completedBy = currentUser.id;
      logEntry.completedAt = now;
      updatedLog = { ...logEntry };
    }
  });

  const freshDb = readDb();
  const completedByUser =
    currentUser.id ? freshDb.users.find((user) => user.id === currentUser.id) ?? null : null;

  return {
    row: {
      ...updatedLog,
      actor: currentUser.name ?? "Unknown",
      completedByName: completedByUser?.name ?? null,
    },
  };
}

/**
 * Returns completed activity logs grouped by day (web dashboard widget).
 */
export async function getDailyHistory() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildDailyHistoryPayload(db, currentUser);
}

/**
 * Returns completed activity logs grouped by week (web dashboard widget).
 */
export async function getWeeklyHistory() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildWeeklyHistoryPayload(db, currentUser);
}

/**
 * Returns completed activity logs for a specific month/year.
 * Used by the mobile History screen's month navigator.
 *
 * Response shape:
 *   {
 *     month: number,      // 1-12
 *     year:  number,
 *     rows: Array<{
 *       title:       string,
 *       timesPrepped: number,
 *       totalQuantity: string | null,
 *       lastCompletedAt: string,
 *     }>
 *   }
 *
 * @param {{ month: number, year: number }} params
 */
export async function getMonthlyHistory({ month, year } = {}) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  const targetMonth = Number(month);
  const targetYear = Number(year);

  if (!targetMonth || !targetYear) {
    throw createAppError(400, "month and year are required.");
  }

  const allLogs = getVisibleActivityLogs(db, currentUser);

  // Only completed logs belong in history.
  const completedLogs = allLogs.filter((log) => {
    if (!log.isCompleted || !log.completedAt) return false;

    const date = new Date(log.completedAt);
    return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
  });

  // Group by `message` text as a simple title proxy.
  // In production Firestore this would group by `checklistItemId` or `itemTitle`.
  const grouped = {};

  for (const log of completedLogs) {
    const key = log.message;

    if (!grouped[key]) {
      grouped[key] = {
        title: log.message,
        timesPrepped: 0,
        lastCompletedAt: log.completedAt,
      };
    }

    grouped[key].timesPrepped += 1;

    if (log.completedAt > grouped[key].lastCompletedAt) {
      grouped[key].lastCompletedAt = log.completedAt;
    }
  }

  const rows = Object.values(grouped).sort(
    (a, b) => new Date(b.lastCompletedAt) - new Date(a.lastCompletedAt)
  );

  return { month: targetMonth, year: targetYear, rows };
}

/**
 * Returns carry-forward list snapshots for the carry-forward workflow.
 */
export async function getCarryForwardSnapshots() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildSnapshotsPayload(db, currentUser);
}
