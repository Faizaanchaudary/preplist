import { PERMISSIONS } from "../constants/permissions";
import { ROLES, ROLE_OPTIONS } from "../constants/roles";
import { deriveRolePermissions } from "./deriveRolePermissions";

export function getUserPermissions(user) {
  const base = deriveRolePermissions(user?.role);
  const extras = Array.isArray(user?.permissions) ? user.permissions : [];

  return Array.from(new Set([...base, ...extras]));
}

export function userHasPermission(user, permission) {
  if (!permission) return true;
  return getUserPermissions(user).includes(permission);
}

export function userHasAllPermissions(user, permissions = []) {
  const required = Array.isArray(permissions) ? permissions : [];
  if (!required.length) return true;

  const resolved = getUserPermissions(user);
  return required.every((permission) => resolved.includes(permission));
}

export function userHasAnyPermission(user, permissions = []) {
  const required = Array.isArray(permissions) ? permissions : [];
  if (!required.length) return true;

  const resolved = getUserPermissions(user);
  return required.some((permission) => resolved.includes(permission));
}

export function filterNavItemsForUser(user, navItems = []) {
  const safeItems = Array.isArray(navItems) ? navItems : [];

  return safeItems.filter((item) => {
    const role = typeof user?.role === "string" ? user.role : "";
    const hiddenForRoles = Array.isArray(item?.hiddenForRoles)
      ? item.hiddenForRoles
      : [];
    const visibleForRoles = Array.isArray(item?.visibleForRoles)
      ? item.visibleForRoles
      : [];

    if (role && hiddenForRoles.includes(role)) return false;

    if (visibleForRoles.length && (!role || !visibleForRoles.includes(role))) {
      return false;
    }

    const requiresAll = item?.requiredPermissions ?? [];
    const requiresAny = item?.requiredAnyPermissions ?? [];

    if (!userHasAllPermissions(user, requiresAll)) return false;

    if (Array.isArray(requiresAny) && requiresAny.length) {
      return userHasAnyPermission(user, requiresAny);
    }

    return true;
  });
}

export function canViewAdmin(user) {
  return userHasPermission(user, PERMISSIONS.VIEW_ADMIN_MONITORING);
}

export function canManageKitchen(user) {
  return userHasPermission(user, PERMISSIONS.CREATE_LISTS);
}

export function canManageList(user) {
  return userHasPermission(user, PERMISSIONS.MANAGE_LISTS);
}

export function canAssignRole(user) {
  return getAssignableRoleValues(user).length > 0;
}

export function getAssignableRoleValues(user) {
  const permissions = getUserPermissions(user);

  if (permissions.includes(PERMISSIONS.ASSIGN_ANY_ROLE)) {
    return ROLE_OPTIONS.map((option) => option.value);
  }

  const assignable = new Set();

  if (permissions.includes(PERMISSIONS.ASSIGN_CHEF_ROLES)) {
    assignable.add(ROLES.HEAD_CHEF);
    assignable.add(ROLES.SOUS_CHEF);
  }

  if (permissions.includes(PERMISSIONS.ASSIGN_STAFF_ACCESS)) {
    assignable.add(ROLES.STAFF);
  }

  return Array.from(assignable);
}
