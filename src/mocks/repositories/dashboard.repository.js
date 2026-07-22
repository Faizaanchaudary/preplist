import { readDb, requireAuth, requirePermission } from "./_repoHelpers";
import { buildDashboardPayload, buildRestaurantUsagePayload } from "./_builders";
import { PERMISSIONS } from "../../shared/constants/permissions";

export async function getDashboardData() {
  const db = readDb();
  const currentUser = requireAuth(db);

  return buildDashboardPayload(db, currentUser);
}

export async function getRestaurantUsageOverview() {
  const db = readDb();
  const currentUser = requireAuth(db);
  requirePermission(currentUser, PERMISSIONS.VIEW_KITCHEN_USAGE_ANALYTICS);

  return buildRestaurantUsagePayload(db, currentUser);
}
