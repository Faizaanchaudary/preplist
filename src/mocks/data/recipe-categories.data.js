/**
 * Hardcoded seed data for the `recipeCategories` Firestore collection.
 *
 * These represent kitchen stations / preparation disciplines that a recipe
 * can belong to.  Only `id` and `name` are stored — keep it minimal.
 */
export const recipeCategories = [
  { id: "rc-001", name: "Cold Section" },
  { id: "rc-002", name: "Hot Section" },
  { id: "rc-003", name: "Prep" },
  { id: "rc-004", name: "Sauce" },
  { id: "rc-005", name: "Pastry" },
  { id: "rc-006", name: "Grill" },
  { id: "rc-007", name: "Bakery" },
  { id: "rc-008", name: "Vegetable Prep" },
  { id: "rc-009", name: "General" },
];
