import { ROLE_PERMISSION_MAP } from "../constants/permissions";
import { ROLE_OPTIONS } from "../constants/roles";

export function deriveRolePermissions(role) {
  return ROLE_PERMISSION_MAP[role] ?? [];
}

export function formatRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}