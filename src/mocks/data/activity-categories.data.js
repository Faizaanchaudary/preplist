/**
 * Hardcoded seed data for the `activityCategories` Firestore collection.
 *
 * These represent kitchen stations used to filter the Activity screen on
 * the mobile app (the tab bar: All | Cold Section | Prep | Sauce | …).
 * Kept separate from recipeCategories so mobile-specific tabs can diverge
 * from recipe sections in the future.
 */
export const activityCategories = [
  { id: "ac-001", name: "Cold Section" },
  { id: "ac-002", name: "Hot Section" },
  { id: "ac-003", name: "Prep" },
  { id: "ac-004", name: "Sauce" },
  { id: "ac-005", name: "Pastry" },
  { id: "ac-006", name: "Grill" },
  { id: "ac-007", name: "General" },
];
