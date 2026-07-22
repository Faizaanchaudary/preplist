import { readDb, requireAuth, requirePermission } from "./_repoContext.js";
import { buildDashboardPayload, buildRestaurantUsagePayload } from "../mappers/index.js";
import { PERMISSIONS } from "../../shared/constants/permissions";

export async function getDashboardData() {
  const db = await readDb();
  const currentUser = requireAuth(db);

  return buildDashboardPayload(db, currentUser);
}

export async function getRestaurantUsageOverview() {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requirePermission(currentUser, PERMISSIONS.VIEW_KITCHEN_USAGE_ANALYTICS);

  return buildRestaurantUsagePayload(db, currentUser);
}
