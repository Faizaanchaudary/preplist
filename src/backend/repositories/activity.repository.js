/**
 * Firebase backend activity repository.
 *
 * Handles activity log reads, history aggregations, and task completion.
 *
 * Key design decisions:
 *   - No separate `history` collection.  History is derived by filtering
 *     `activityLogs` where `isCompleted === true`, grouped by month/week/day.
 *   - `completeActivityLog` sets `isCompleted`, `completedBy`, `completedAt`
 *     on the existing document — no new document is created.
 *   - `categoryId` filter enables the mobile Activity tab-bar (Cold Section, Prep…).
 *
 * @see docs/FIREBASE_BACKEND.md — Section 4 (Layer responsibilities)
 */
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { getUserPermissions } from "../../shared/utils/rbac.js";
import {
  buildDailyHistoryPayload,
  buildSnapshotsPayload,
  buildWeeklyHistoryPayload,
} from "../mappers/index.js";
import {
  createAppError,
  getVisibleActivityLogs,
  readDb,
  requireAuth,
  withDbUpdate,
} from "./_repoContext.js";

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
 * Enrich a raw activity log entry with resolved display names.
 */
function mapActivityLogRow(db, log) {
  const actor = db.users.find((user) => user.id === log.actorId) ?? null;
  const completedByUser =
    log.completedBy
      ? db.users.find((user) => user.id === log.completedBy) ?? null
      : null;

  return {
    ...log,
    actor: actor?.name ?? "Unknown",
    completedByName: completedByUser?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API — must match mock activity.repository.js exactly
// ---------------------------------------------------------------------------

/**
 * Returns activity logs visible to the current user.
 *
 * Supports optional filters:
 *   action      — filter by action type (e.g. "checked_item")
 *   categoryId  — filter by activity category (mobile tab-bar)
 *   isCompleted — true = history view, false = active tasks view
 *
 * @param {{ action?: string, categoryId?: string, isCompleted?: boolean }} filters
 */
export async function getActivityLogs(filters = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  let logs = getVisibleActivityLogs(db, currentUser);

  if (typeof filters.action === "string" && filters.action !== "all") {
    logs = logs.filter((log) => log.action === filters.action);
  }

  if (typeof filters.categoryId === "string" && filters.categoryId !== "all") {
    logs = logs.filter((log) => log.categoryId === filters.categoryId);
  }

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
 * Writes `isCompleted = true`, `completedBy` (userId), and `completedAt` (ISO string).
 *
 * The mobile History screen derives its list from completed logs — no separate
 * collection write is needed.
 *
 * @param {string} logId
 */
export async function completeActivityLog(logId) {
  const db = await readDb();
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

  const freshDb = await readDb();
  const completedByUser =
    freshDb.users.find((user) => user.id === currentUser.id) ?? null;

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
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildDailyHistoryPayload(db, currentUser);
}

/**
 * Returns completed activity logs grouped by week (web dashboard widget).
 */
export async function getWeeklyHistory() {
  const db = await readDb();
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
 *     month: number,   // 1-12
 *     year: number,
 *     rows: Array<{
 *       title: string,
 *       timesPrepped: number,
 *       lastCompletedAt: string,
 *     }>
 *   }
 *
 * @param {{ month: number, year: number }} params
 */
export async function getMonthlyHistory({ month, year } = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  const targetMonth = Number(month);
  const targetYear = Number(year);

  if (!targetMonth || !targetYear) {
    throw createAppError(400, "month and year are required.");
  }

  const allLogs = getVisibleActivityLogs(db, currentUser);

  const completedLogs = allLogs.filter((log) => {
    if (!log.isCompleted || !log.completedAt) return false;

    const date = new Date(log.completedAt);
    return (
      date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear
    );
  });

  // Group by message as a title proxy.
  // In full Firestore this would group by `checklistItemId` or `itemTitle`.
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
 * Returns carry-forward list snapshots.
 */
export async function getCarryForwardSnapshots() {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireActivityPermission(currentUser);

  return buildSnapshotsPayload(db, currentUser);
}
