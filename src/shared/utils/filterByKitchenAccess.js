import { PERMISSIONS } from "../constants/permissions";
import { deriveRolePermissions } from "./deriveRolePermissions";

export function filterByKitchenAccess(
  items,
  currentUser,
  kitchenKey = "kitchenId"
) {
  if (!Array.isArray(items)) return [];

  const permissions = deriveRolePermissions(currentUser?.role);
  const canViewAll = permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS);

  if (canViewAll) {
    return items;
  }

  const accessibleKitchenIds = currentUser?.accessibleKitchenIds ?? [];

  return items.filter((item) => accessibleKitchenIds.includes(item[kitchenKey]));
}