import { readDb, requireAuth } from "./_repoHelpers";
import { buildDashboardPayload } from "./_builders";

export async function getDashboardData() {
  const db = readDb();
  const currentUser = requireAuth(db);

  return buildDashboardPayload(db, currentUser);
}

