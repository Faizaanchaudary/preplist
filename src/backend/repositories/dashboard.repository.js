import { readDb, requireAuth } from "./_repoContext.js";
import { buildDashboardPayload } from "../mappers/index.js";

export async function getDashboardData() {
  const db = await readDb();
  const currentUser = requireAuth(db);

  return buildDashboardPayload(db, currentUser);
}

