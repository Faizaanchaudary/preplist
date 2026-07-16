/**
 * Firestore collection name constants.
 *
 * Always use these constants in repositories — never use raw strings.
 * This makes renaming a collection a single-file change.
 */
export const COLLECTIONS = {
  COMPANIES: "companies",
  KITCHENS: "kitchens",
  USERS: "users",
  KITCHEN_SECTIONS: "kitchenSections",
  KITCHEN_MEMBERSHIPS: "kitchenMemberships",
  ACCESS_CODES: "accessCodes",
  LISTS: "lists",
  CHECKLIST_ITEMS: "checklistItems",
  TEMPLATES: "templates",
  ACTIVITY_LOGS: "activityLogs",
  LIST_SNAPSHOTS: "listSnapshots",
  PHOTOS: "photos",
  COMPLETIONS: "completions",
  SUBSCRIPTION_PLANS: "subscriptionPlans",
  RECIPES: "recipes",
  RECIPE_DRAFTS: "recipeDrafts",
  SESSIONS: "sessions",

  // Category collections — each domain has its own collection so they
  // can evolve independently without cross-domain coupling.
  RECIPE_CATEGORIES: "recipeCategories",
  TEMPLATE_CATEGORIES: "templateCategories",
  ACTIVITY_CATEGORIES: "activityCategories",
};

export const DB_COLLECTION_KEYS = [
  "companies",
  "kitchens",
  "users",
  "kitchenSections",
  "kitchenMemberships",
  "accessCodes",
  "lists",
  "checklistItems",
  "templates",
  "activityLogs",
  "listSnapshots",
  "photos",
  "completions",
  "subscriptionPlans",
  "recipes",
  "recipeDrafts",
  // Category collections
  "recipeCategories",
  "templateCategories",
  "activityCategories",
];

export const COLLECTION_KEY_MAP = {
  companies: COLLECTIONS.COMPANIES,
  kitchens: COLLECTIONS.KITCHENS,
  users: COLLECTIONS.USERS,
  kitchenSections: COLLECTIONS.KITCHEN_SECTIONS,
  kitchenMemberships: COLLECTIONS.KITCHEN_MEMBERSHIPS,
  accessCodes: COLLECTIONS.ACCESS_CODES,
  lists: COLLECTIONS.LISTS,
  checklistItems: COLLECTIONS.CHECKLIST_ITEMS,
  templates: COLLECTIONS.TEMPLATES,
  activityLogs: COLLECTIONS.ACTIVITY_LOGS,
  listSnapshots: COLLECTIONS.LIST_SNAPSHOTS,
  photos: COLLECTIONS.PHOTOS,
  completions: COLLECTIONS.COMPLETIONS,
  subscriptionPlans: COLLECTIONS.SUBSCRIPTION_PLANS,
  recipes: COLLECTIONS.RECIPES,
  recipeDrafts: COLLECTIONS.RECIPE_DRAFTS,
  recipeCategories: COLLECTIONS.RECIPE_CATEGORIES,
  templateCategories: COLLECTIONS.TEMPLATE_CATEGORIES,
  activityCategories: COLLECTIONS.ACTIVITY_CATEGORIES,
};
