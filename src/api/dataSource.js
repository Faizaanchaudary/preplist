/**
 * Data layer entry point.
 *
 * Set VITE_DATA_SOURCE=firebase in .env to use Firebase repositories.
 * Feature hooks can import from here when ready (pages/components unchanged).
 *
 * @see docs/FIREBASE_BACKEND.md
 */

const useFirebase = import.meta.env.VITE_DATA_SOURCE === "firebase";

async function loadRepositories() {
  if (useFirebase) {
    return import("../backend/repositories/index.js");
  }

  return {
    getCurrentSession: (await import("../mocks/repositories/auth.repository.js"))
      .getCurrentSession,
    login: (await import("../mocks/repositories/auth.repository.js")).login,
    logout: (await import("../mocks/repositories/auth.repository.js")).logout,
    pinLogin: (await import("../mocks/repositories/auth.repository.js")).pinLogin,
    selectKitchen: (await import("../mocks/repositories/auth.repository.js"))
      .selectKitchen,
    joinByCode: (await import("../mocks/repositories/auth.repository.js")).joinByCode,
    getDashboardData: (await import("../mocks/repositories/dashboard.repository.js"))
      .getDashboardData,
    getKitchens: (await import("../mocks/repositories/kitchen.repository.js"))
      .getKitchens,
    getKitchenDetails: (await import("../mocks/repositories/kitchen.repository.js"))
      .getKitchenDetails,
    createKitchen: (await import("../mocks/repositories/kitchen.repository.js"))
      .createKitchen,
    updateKitchen: (await import("../mocks/repositories/kitchen.repository.js"))
      .updateKitchen,
    deleteKitchen: (await import("../mocks/repositories/kitchen.repository.js"))
      .deleteKitchen,
    getPrepLists: (await import("../mocks/repositories/list.repository.js"))
      .getPrepLists,
    getListDetails: (await import("../mocks/repositories/list.repository.js"))
      .getListDetails,
    getTemplates: (await import("../mocks/repositories/list.repository.js")).getTemplates,
    createList: (await import("../mocks/repositories/list.repository.js")).createList,
    updateChecklistItem: (await import("../mocks/repositories/list.repository.js"))
      .updateChecklistItem,
    attachChecklistItemPhoto: (await import("../mocks/repositories/list.repository.js"))
      .attachChecklistItemPhoto,
    createTemplate: (await import("../mocks/repositories/list.repository.js"))
      .createTemplate,
    applyTemplate: (await import("../mocks/repositories/list.repository.js"))
      .applyTemplate,
    getRecipes: (await import("../mocks/repositories/recipe.repository.js")).getRecipes,
    getRecipeDetails: (await import("../mocks/repositories/recipe.repository.js"))
      .getRecipeDetails,
    createRecipe: (await import("../mocks/repositories/recipe.repository.js"))
      .createRecipe,
    updateRecipe: (await import("../mocks/repositories/recipe.repository.js"))
      .updateRecipe,
    scanRecipe: (await import("../mocks/repositories/recipe.repository.js")).scanRecipe,
    getRecipeDrafts: (await import("../mocks/repositories/recipe.repository.js"))
      .getRecipeDrafts,
    submitRecipeDraft: (await import("../mocks/repositories/recipe.repository.js"))
      .submitRecipeDraft,
    approveRecipeDraft: (await import("../mocks/repositories/recipe.repository.js"))
      .approveRecipeDraft,
    rejectRecipeDraft: (await import("../mocks/repositories/recipe.repository.js"))
      .rejectRecipeDraft,
    getUsers: (await import("../mocks/repositories/users.repository.js")).getUsers,
    createUser: (await import("../mocks/repositories/users.repository.js")).createUser,
    updateUser: (await import("../mocks/repositories/users.repository.js")).updateUser,
    deleteUser: (await import("../mocks/repositories/users.repository.js")).deleteUser,
    assignUserRole: (await import("../mocks/repositories/organization.repository.js"))
      .assignUserRole,
    updateUserAccess: (
      await import("../mocks/repositories/organization.repository.js")
    ).updateUserAccess,
    getOrganizationOverview: (
      await import("../mocks/repositories/organization.repository.js")
    ).getOrganizationOverview,
    getOrganizationUsers: (
      await import("../mocks/repositories/organization.repository.js")
    ).getOrganizationUsers,
    getActivityLogs: (await import("../mocks/repositories/activity.repository.js"))
      .getActivityLogs,
    getDailyHistory: (await import("../mocks/repositories/activity.repository.js"))
      .getDailyHistory,
    getWeeklyHistory: (await import("../mocks/repositories/activity.repository.js"))
      .getWeeklyHistory,
    getCarryForwardSnapshots: (
      await import("../mocks/repositories/activity.repository.js")
    ).getCarryForwardSnapshots,
    getSubscriptionPlans: (
      await import("../mocks/repositories/subscription.repository.js")
    ).getSubscriptionPlans,
    getRestaurantSubscriptionUsage: (
      await import("../mocks/repositories/subscription.repository.js")
    ).getRestaurantSubscriptionUsage,
    createSubscriptionPlan: (
      await import("../mocks/repositories/subscription.repository.js")
    ).createSubscriptionPlan,
    updateSubscriptionPlan: (
      await import("../mocks/repositories/subscription.repository.js")
    ).updateSubscriptionPlan,
    deleteSubscriptionPlan: (
      await import("../mocks/repositories/subscription.repository.js")
    ).deleteSubscriptionPlan,
    assignRestaurantPlan: (
      await import("../mocks/repositories/subscription.repository.js")
    ).assignRestaurantPlan,
    removeRestaurantPlan: (
      await import("../mocks/repositories/subscription.repository.js")
    ).removeRestaurantPlan,
    getAdminRoles: (await import("../mocks/repositories/admin.repository.js"))
      .getAdminRoles,
  };
}

const repositoriesPromise = loadRepositories();

async function getRepo() {
  return repositoriesPromise;
}

export async function getCurrentSession(...args) {
  return (await getRepo()).getCurrentSession(...args);
}

export async function login(...args) {
  return (await getRepo()).login(...args);
}

export async function logout(...args) {
  return (await getRepo()).logout(...args);
}

export async function pinLogin(...args) {
  return (await getRepo()).pinLogin(...args);
}

export async function selectKitchen(...args) {
  return (await getRepo()).selectKitchen(...args);
}

export async function joinByCode(...args) {
  return (await getRepo()).joinByCode(...args);
}

export async function getDashboardData(...args) {
  return (await getRepo()).getDashboardData(...args);
}

export async function getKitchens(...args) {
  return (await getRepo()).getKitchens(...args);
}

export async function getKitchenDetails(...args) {
  return (await getRepo()).getKitchenDetails(...args);
}

export async function createKitchen(...args) {
  return (await getRepo()).createKitchen(...args);
}

export async function updateKitchen(...args) {
  return (await getRepo()).updateKitchen(...args);
}

export async function deleteKitchen(...args) {
  return (await getRepo()).deleteKitchen(...args);
}

export async function getPrepLists(...args) {
  return (await getRepo()).getPrepLists(...args);
}

export async function getListDetails(...args) {
  return (await getRepo()).getListDetails(...args);
}

export async function getTemplates(...args) {
  return (await getRepo()).getTemplates(...args);
}

export async function createList(...args) {
  return (await getRepo()).createList(...args);
}

export async function updateChecklistItem(...args) {
  return (await getRepo()).updateChecklistItem(...args);
}

export async function attachChecklistItemPhoto(...args) {
  return (await getRepo()).attachChecklistItemPhoto(...args);
}

export async function createTemplate(...args) {
  return (await getRepo()).createTemplate(...args);
}

export async function applyTemplate(...args) {
  return (await getRepo()).applyTemplate(...args);
}

export async function getRecipes(...args) {
  return (await getRepo()).getRecipes(...args);
}

export async function getRecipeDetails(...args) {
  return (await getRepo()).getRecipeDetails(...args);
}

export async function createRecipe(...args) {
  return (await getRepo()).createRecipe(...args);
}

export async function updateRecipe(...args) {
  return (await getRepo()).updateRecipe(...args);
}

export async function scanRecipe(...args) {
  return (await getRepo()).scanRecipe(...args);
}

export async function getRecipeDrafts(...args) {
  return (await getRepo()).getRecipeDrafts(...args);
}

export async function submitRecipeDraft(...args) {
  return (await getRepo()).submitRecipeDraft(...args);
}

export async function approveRecipeDraft(...args) {
  return (await getRepo()).approveRecipeDraft(...args);
}

export async function rejectRecipeDraft(...args) {
  return (await getRepo()).rejectRecipeDraft(...args);
}

export async function getUsers(...args) {
  return (await getRepo()).getUsers(...args);
}

export async function createUser(...args) {
  return (await getRepo()).createUser(...args);
}

export async function updateUser(...args) {
  return (await getRepo()).updateUser(...args);
}

export async function deleteUser(...args) {
  return (await getRepo()).deleteUser(...args);
}

export async function assignUserRole(...args) {
  return (await getRepo()).assignUserRole(...args);
}

export async function updateUserAccess(...args) {
  return (await getRepo()).updateUserAccess(...args);
}

export async function getOrganizationOverview(...args) {
  return (await getRepo()).getOrganizationOverview(...args);
}

export async function getOrganizationUsers(...args) {
  return (await getRepo()).getOrganizationUsers(...args);
}

export async function getActivityLogs(...args) {
  return (await getRepo()).getActivityLogs(...args);
}

export async function getDailyHistory(...args) {
  return (await getRepo()).getDailyHistory(...args);
}

export async function getWeeklyHistory(...args) {
  return (await getRepo()).getWeeklyHistory(...args);
}

export async function getCarryForwardSnapshots(...args) {
  return (await getRepo()).getCarryForwardSnapshots(...args);
}

export async function getSubscriptionPlans(...args) {
  return (await getRepo()).getSubscriptionPlans(...args);
}

export async function getRestaurantSubscriptionUsage(...args) {
  return (await getRepo()).getRestaurantSubscriptionUsage(...args);
}

export async function createSubscriptionPlan(...args) {
  return (await getRepo()).createSubscriptionPlan(...args);
}

export async function updateSubscriptionPlan(...args) {
  return (await getRepo()).updateSubscriptionPlan(...args);
}

export async function deleteSubscriptionPlan(...args) {
  return (await getRepo()).deleteSubscriptionPlan(...args);
}

export async function assignRestaurantPlan(...args) {
  return (await getRepo()).assignRestaurantPlan(...args);
}

export async function removeRestaurantPlan(...args) {
  return (await getRepo()).removeRestaurantPlan(...args);
}

export async function getAdminRoles(...args) {
  return (await getRepo()).getAdminRoles(...args);
}
