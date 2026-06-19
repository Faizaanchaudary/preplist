export const ROLES = {
  SUPER_ADMIN: "super_admin",
  FOUNDER: "founder",
  EXECUTIVE_CHEF: "executive_chef",
  HEAD_CHEF: "head_chef",
  SOUS_CHEF: "sous_chef",
  STAFF: "staff",
};

export const ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, label: "Super Admin" },
  { value: ROLES.FOUNDER, label: "Founder/Owner" },
  { value: ROLES.EXECUTIVE_CHEF, label: "Executive Chef" },
  { value: ROLES.HEAD_CHEF, label: "Head Chef" },
  { value: ROLES.SOUS_CHEF, label: "Sous Chef" },
  { value: ROLES.STAFF, label: "Staff/User" },
];
