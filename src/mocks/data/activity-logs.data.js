/**
 * Mock activity log entries.
 *
 * New fields (mobile-app compatible):
 *   categoryId   — references activityCategories; used for tab-filter on mobile Activity screen
 *   isCompleted  — boolean flag; replaces the need for a separate history collection
 *   completedBy  — userId of staff who marked the task complete (null if not yet done)
 *   completedAt  — ISO timestamp when isCompleted was set to true (null if not yet done)
 */
export const activityLogs = [
  {
    id: "al-001",
    kitchenId: "k-001",
    listId: "l-001",
    actorId: "u-003",
    categoryId: "ac-003", // Prep
    action: "created_list",
    message: "Elena Russo created Morning Grill Prep",
    isCompleted: false,
    completedBy: null,
    completedAt: null,
    createdAt: "2026-04-26T07:15:00.000Z",
  },
  {
    id: "al-002",
    kitchenId: "k-001",
    listId: "l-001",
    actorId: "u-005",
    categoryId: "ac-003", // Prep
    action: "joined_via_code",
    message: "Lina Park joined Morning Grill Prep via access code",
    isCompleted: false,
    completedBy: null,
    completedAt: null,
    createdAt: "2026-04-26T07:22:00.000Z",
  },
  {
    id: "al-003",
    kitchenId: "k-001",
    listId: "l-001",
    actorId: "u-005",
    categoryId: "ac-001", // Cold Section
    action: "checked_item",
    message: "Lina Park checked Trim ribeye portions",
    isCompleted: true,
    completedBy: "u-003",
    completedAt: "2026-04-26T08:30:00.000Z",
    createdAt: "2026-04-26T08:10:00.000Z",
  },
  {
    id: "al-004",
    kitchenId: "k-001",
    listId: "l-002",
    actorId: "u-003",
    categoryId: "ac-005", // Pastry
    action: "checked_item",
    message: "Elena Russo checked Bake focaccia rounds",
    isCompleted: true,
    completedBy: "u-003",
    completedAt: "2026-04-26T08:05:00.000Z",
    createdAt: "2026-04-26T07:50:00.000Z",
  },
  {
    id: "al-005",
    kitchenId: "k-002",
    listId: "l-004",
    actorId: "u-006",
    categoryId: "ac-003", // Prep
    action: "checked_item",
    message: "Diego Santos checked Dice banquet vegetables",
    isCompleted: false,
    completedBy: null,
    completedAt: null,
    createdAt: "2026-04-26T09:20:00.000Z",
  },
];