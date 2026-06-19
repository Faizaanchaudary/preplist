import { lazy } from "react";

export const DashboardPage = lazy(() =>
  import("../../features/dashboard/pages/DashboardPage")
);

export const OrganizationPage = lazy(() =>
  import("../../features/organization/pages/OrganizationPage")
);

export const KitchenManagementPage = lazy(() =>
  import("../../features/kitchen-management/pages/KitchenManagementPage")
);

export const KitchenDetailsPage = lazy(() =>
  import("../../features/kitchen-management/pages/KitchenDetailsPage")
);

export const ListMonitoringPage = lazy(() =>
  import("../../features/list-monitoring/pages/ListMonitoringPage")
);

export const ListDetailsPage = lazy(() =>
  import("../../features/list-monitoring/pages/ListDetailsPage")
);

export const TemplatesPage = lazy(() =>
  import("../../features/list-monitoring/pages/TemplatesPage")
);

export const ActivityLogsPage = lazy(() =>
  import("../../features/activity-logs/pages/ActivityLogsPage")
);

export const AdminPage = lazy(() =>
  import("../../features/admin/pages/AdminPage")
);

export const RolesPage = lazy(() =>
  import("../../features/admin/pages/RolesPage")
);

export const SubscriptionPage = lazy(() =>
  import("../../features/subscription/pages/SubscriptionPage")
);

export const UsersPage = lazy(() =>
  import("../../features/users/pages/UsersPage")
);

export const SplashPage = lazy(() =>
  import("../../features/auth/pages/SplashPage")
);

export const JoinByCodePage = lazy(() =>
  import("../../features/auth/pages/JoinByCodePage")
);

export const LoginPage = lazy(() =>
  import("../../features/auth/pages/LoginPage")
);

export const PinLoginPage = lazy(() =>
  import("../../features/auth/pages/PinLoginPage")
);

export const ForgotPasswordPage = lazy(() =>
  import("../../features/auth/pages/ForgotPasswordPage")
);

export const SelectKitchenPage = lazy(() =>
  import("../../features/auth/pages/SelectKitchenPage")
);
export const RecipeBookPage = lazy(() =>
  import("../../features/recipes/pages/RecipeBookPage")
);
