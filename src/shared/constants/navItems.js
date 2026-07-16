import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Logs,
  Settings2,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import { PERMISSIONS } from "./permissions";
import { ROLES } from "./roles";
import { ROUTES } from "./routes";

export const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    requiredPermissions: [],
  },
  {
    key: "organization",
    label: "Organization",
    href: ROUTES.ORGANIZATION,
    icon: Building2,
    requiredPermissions: [PERMISSIONS.VIEW_ORGANIZATION],
  },
  {
    key: "users",
    label: "Users",
    href: ROUTES.USERS,
    icon: UsersRound,
    requiredPermissions: [],
    requiredAnyPermissions: [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_COMPANY_USERS,
      PERMISSIONS.MANAGE_RESTAURANT_USERS,
      PERMISSIONS.ASSIGN_STAFF_ACCESS,
    ],
  },
  {
    key: "list-monitoring",
    label: "Prep Lists",
    href: ROUTES.LIST_MONITORING,
    icon: ClipboardList,
    requiredPermissions: [PERMISSIONS.OPERATE_LISTS],
  },
  {
    key: "recipes",
    label: "Recipe Book",
    href: ROUTES.RECIPE_BOOK,
    icon: BookOpen,
    requiredPermissions: [PERMISSIONS.VIEW_RECIPES],
    hiddenForRoles: [ROLES.FOUNDER],
  },
  {
    key: "kitchen-management",
    label: "Kitchens",
    href: ROUTES.KITCHEN_MANAGEMENT,
    icon: UtensilsCrossed,
    requiredPermissions: [PERMISSIONS.CREATE_LISTS],
  },
  {
    key: "activity-logs",
    label: "Activity",
    href: ROUTES.ACTIVITY_LOGS,
    icon: Logs,
    requiredPermissions: [],
    requiredAnyPermissions: [
      PERMISSIONS.VIEW_ACTIVITY_LOGS,
      PERMISSIONS.VIEW_OWN_ACTIVITY,
    ],
  },
  {
    key: "admin",
    label: "Admin",
    href: ROUTES.ADMIN,
    icon: Settings2,
    requiredPermissions: [PERMISSIONS.VIEW_ADMIN_MONITORING],
  },
];
