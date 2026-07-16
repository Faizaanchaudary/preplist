/**
 * Hardcoded seed data for the `templateCategories` Firestore collection.
 *
 * These represent schedule/workflow types that a prep-list template
 * belongs to.  Separate from recipe categories so each can evolve
 * independently.
 */
export const templateCategories = [
  { id: "tc-001", name: "Daily Prep" },
  { id: "tc-002", name: "Weekly Prep" },
  { id: "tc-003", name: "Opening" },
  { id: "tc-004", name: "Closing" },
  { id: "tc-005", name: "Cleaning" },
  { id: "tc-006", name: "Special Event" },
  { id: "tc-007", name: "General" },
];
