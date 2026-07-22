import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { ROLES } from "../../shared/constants/roles.js";
import { getUserPermissions } from "../../shared/utils/rbac.js";

// super_admin keeps VIEW_ALL_KITCHENS for kitchen *metadata* listing (see
// getVisibleKitchens) but must never receive raw list/checklist/recipe/log
// content — restaurants keep operational privacy. Aggregate usage numbers
// for super_admin are computed separately in buildRestaurantUsagePayload.
function hasRawContentBypass(user, permissions) {
  return (
    permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS) && user.role !== ROLES.SUPER_ADMIN
  );
}

export function getVisibleKitchens(db, user) {
  if (!user) return [];

  const permissions = getUserPermissions(user);

  if (permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS)) {
    return db.kitchens;
  }

  const accessibleKitchenIds = Array.isArray(user.accessibleKitchenIds)
    ? user.accessibleKitchenIds
    : [];

  return db.kitchens.filter((kitchen) => accessibleKitchenIds.includes(kitchen.id));
}

export function getVisibleLists(db, user) {
  if (!user) return [];

  const permissions = getUserPermissions(user);

  // NOT gated by hasRawContentBypass: getVisibleLists/getVisibleChecklistItems
  // also back buildDashboardPayload's aggregate math (completionPercentage,
  // activeListCount) for every role including super_admin — those numbers
  // are safe (counts only). The actual raw-content leak is guarded directly
  // at getPrepLists/getListDetails (list.repository.js) instead.
  if (permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS)) {
    return db.lists;
  }

  const canViewByKitchen =
    permissions.includes(PERMISSIONS.MANAGE_LISTS) ||
    permissions.includes(PERMISSIONS.CREATE_LISTS) ||
    permissions.includes(PERMISSIONS.VIEW_LIST_SUMMARY);

  if (canViewByKitchen) {
    const visibleKitchenIds = new Set(getVisibleKitchens(db, user).map((k) => k.id));
    return db.lists.filter((list) => visibleKitchenIds.has(list.kitchenId));
  }

  const invitedListIds = Array.isArray(user.invitedListIds) ? user.invitedListIds : [];
  return db.lists.filter((list) => invitedListIds.includes(list.id));
}

export function getVisibleChecklistItems(db, user) {
  const visibleListIds = new Set(getVisibleLists(db, user).map((list) => list.id));
  return db.checklistItems.filter((item) => visibleListIds.has(item.listId));
}

export function getVisibleActivityLogs(db, user) {
  if (!user) return [];

  const permissions = getUserPermissions(user);

  if (hasRawContentBypass(user, permissions)) {
    return db.activityLogs;
  }

  const accessibleKitchenIds = Array.isArray(user.accessibleKitchenIds)
    ? user.accessibleKitchenIds
    : [];

  const visibleListIds = new Set(getVisibleLists(db, user).map((list) => list.id));
  const invitedListIds = Array.isArray(user.invitedListIds) ? user.invitedListIds : [];

  if (permissions.includes(PERMISSIONS.VIEW_ACTIVITY_LOGS)) {
    return db.activityLogs.filter((log) => {
      if (log.listId) {
        return visibleListIds.has(log.listId);
      }

      return accessibleKitchenIds.includes(log.kitchenId);
    });
  }

  if (permissions.includes(PERMISSIONS.VIEW_OWN_ACTIVITY)) {
    return db.activityLogs.filter((log) => {
      if (log.actorId === user.id) return true;
      if (log.listId) return invitedListIds.includes(log.listId);
      return false;
    });
  }

  return [];
}

export function getVisibleSnapshots(db, user) {
  if (!user) return [];

  const permissions = getUserPermissions(user);

  if (hasRawContentBypass(user, permissions)) {
    return db.listSnapshots;
  }

  const accessibleKitchenIds = Array.isArray(user.accessibleKitchenIds)
    ? user.accessibleKitchenIds
    : [];

  const visibleListIds = new Set(getVisibleLists(db, user).map((list) => list.id));

  return db.listSnapshots.filter((snapshot) => {
    if (snapshot.listId) {
      return visibleListIds.has(snapshot.listId);
    }

    return accessibleKitchenIds.includes(snapshot.kitchenId);
  });
}

export function getVisibleRecipes(db, user) {
  if (!user) return [];

  const permissions = getUserPermissions(user);

  if (hasRawContentBypass(user, permissions)) {
    return db.recipes;
  }

  const accessibleKitchenIds = Array.isArray(user.accessibleKitchenIds)
    ? user.accessibleKitchenIds
    : [];

  return db.recipes.filter((recipe) =>
    Array.isArray(recipe.kitchenIds)
      ? recipe.kitchenIds.some((kitchenId) => accessibleKitchenIds.includes(kitchenId))
      : false
  );
}

export function touchUser(db, userId, now = new Date()) {
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) return;
  user.lastActiveAt = now.toISOString();
}
