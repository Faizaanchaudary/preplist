/**
 * Mock template entries.
 *
 * Added `categoryId` which references the `templateCategories` collection.
 * The `category` text field is used to store the category name.
 */
export const templates = [
  {
    id: "t-001",
    title: "Breakfast Open",
    categoryId: "tc-001",
    category: "Daily Prep",
    itemCount: 8,
  },
  {
    id: "t-002",
    title: "Sauce Batch Reset",
    categoryId: "tc-001",
    category: "Daily Prep",
    itemCount: 5,
  },
  {
    id: "t-003",
    title: "Pastry Service Start",
    categoryId: "tc-003",
    category: "Opening",
    itemCount: 6,
  },
];