import { ROLE_OPTIONS, ROLES } from "../constants/roles";
import { deriveRolePermissions, formatRoleLabel } from "./deriveRolePermissions";

const ROLE_CAPABILITY_MAP = {
  [ROLES.SUPER_ADMIN]: {
    scope: "All companies",
    dataAccess: "Full",
    listOperation: "Yes",
    recipeAccess: "Manage",
    userRoleAccess: "Full",
    subscription: "Yes",
  },
  [ROLES.FOUNDER]: {
    scope: "Assigned companies",
    dataAccess: "View only",
    listOperation: "No",
    recipeAccess: "View",
    userRoleAccess: "View users",
    subscription: "Yes",
  },
  [ROLES.EXECUTIVE_CHEF]: {
    scope: "Assigned companies",
    dataAccess: "Full",
    listOperation: "Yes",
    recipeAccess: "Manage",
    userRoleAccess: "Chef/User roles",
    subscription: "Yes",
  },
  [ROLES.HEAD_CHEF]: {
    scope: "Assigned kitchens",
    dataAccess: "Kitchen only",
    listOperation: "Yes",
    recipeAccess: "Manage",
    userRoleAccess: "Staff only",
    subscription: "No",
  },
  [ROLES.SOUS_CHEF]: {
    scope: "Assigned kitchens",
    dataAccess: "Kitchen only",
    listOperation: "Yes",
    recipeAccess: "Limited/Manage if enabled",
    userRoleAccess: "Staff only",
    subscription: "No",
  },
  [ROLES.STAFF]: {
    scope: "Invited lists",
    dataAccess: "Own/list only",
    listOperation: "Yes",
    recipeAccess: "View",
    userRoleAccess: "No",
    subscription: "No",
  },
};

function resolveCapability(role) {
  if (!role) return null;
  return ROLE_CAPABILITY_MAP[role] ?? null;
}

export function getRoleSummaryRow(role) {
  const roleValue = typeof role === "string" ? role : "";
  if (!roleValue) return null;

  const capability = resolveCapability(roleValue);
  const permissions = deriveRolePermissions(roleValue);

  return {
    id: roleValue,
    role: roleValue,
    roleLabel: formatRoleLabel(roleValue),
    scope: capability?.scope ?? "—",
    dataAccess: capability?.dataAccess ?? "—",
    listOperation: capability?.listOperation ?? "—",
    recipeAccess: capability?.recipeAccess ?? "—",
    userRoleAccess: capability?.userRoleAccess ?? "—",
    subscription: capability?.subscription ?? "—",
    permissionCount: permissions.length,
    permissions,
  };
}

export function getAllRoleSummaryRows() {
  return ROLE_OPTIONS.map((option) => getRoleSummaryRow(option.value)).filter(
    Boolean
  );
}
