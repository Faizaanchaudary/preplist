import { Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import RequireAuth from "../../shared/guards/RequireAuth";
import RequirePermission from "../../shared/guards/RequirePermission";
import RequireKitchenSelection from "../../shared/guards/RequireKitchenSelection";
import { ROUTES, ROUTE_SEGMENTS } from "../../shared/constants/routes";
import { PERMISSIONS } from "../../shared/constants/permissions";
import {
  ActivityLogsPage,
  AdminPage,
  DashboardPage,
  JoinByCodePage,
  KitchenDetailsPage,
  KitchenManagementPage,
  LoginPage,
  PinLoginPage,
  ForgotPasswordPage,
  SelectKitchenPage,
  SplashPage,
  ListDetailsPage,
  ListMonitoringPage,
  OrganizationPage,
  RolesPage,
  RestaurantUsagePage,
  SubscriptionPage,
  TemplatesPage,
  UsersPage,
  RecipeBookPage,
  
} from "./lazyRoutes";

const routeConfig = [
  {
    path: ROUTE_SEGMENTS.SPLASH,
    element: <SplashPage />,
  },
  {
    path: ROUTE_SEGMENTS.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTE_SEGMENTS.PIN_LOGIN,
    element: <PinLoginPage />,
  },
  {
    path: ROUTE_SEGMENTS.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTE_SEGMENTS.JOIN_BY_CODE,
    element: <JoinByCodePage />,
  },
  {
    path: ROUTE_SEGMENTS.SELECT_KITCHEN,
    element: (
      <RequireAuth>
        <SelectKitchenPage />
      </RequireAuth>
    ),
  },
  {
    element: (
      <RequireAuth>
        <RequireKitchenSelection>
          <AppShell />
        </RequireKitchenSelection>
      </RequireAuth>
    ),
    children: [
      {
        path: ROUTE_SEGMENTS.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTE_SEGMENTS.ORGANIZATION,
        element: (
          <RequirePermission permission={PERMISSIONS.VIEW_ORGANIZATION}>
            <OrganizationPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.USERS,
        element: (
          <RequirePermission
            permissions={[
              PERMISSIONS.MANAGE_USERS,
              PERMISSIONS.MANAGE_COMPANY_USERS,
              PERMISSIONS.MANAGE_RESTAURANT_USERS,
              PERMISSIONS.ASSIGN_STAFF_ACCESS,
            ]}
            match="any"
          >
            <UsersPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.KITCHEN_MANAGEMENT,
        element: (
          <RequirePermission permission={PERMISSIONS.CREATE_LISTS}>
            <KitchenManagementPage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.KITCHEN_MANAGEMENT}/:kitchenId`,
        element: (
          <RequirePermission permission={PERMISSIONS.CREATE_LISTS}>
            <KitchenDetailsPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.LIST_MONITORING,
        element: (
          <RequirePermission permission={PERMISSIONS.OPERATE_LISTS}>
            <ListMonitoringPage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.LIST_MONITORING}/templates`,
        element: (
          <RequirePermission permission={PERMISSIONS.MANAGE_LISTS}>
            <TemplatesPage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.LIST_MONITORING}/:listId`,
        element: (
          <RequirePermission permission={PERMISSIONS.OPERATE_LISTS}>
            <ListDetailsPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.RECIPE_BOOK,
        element: (
          <RequirePermission permission={PERMISSIONS.VIEW_RECIPES}>
            <RecipeBookPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.ACTIVITY_LOGS,
        element: (
          <RequirePermission
            permissions={[
              PERMISSIONS.VIEW_ACTIVITY_LOGS,
              PERMISSIONS.VIEW_OWN_ACTIVITY,
            ]}
            match="any"
          >
            <ActivityLogsPage />
          </RequirePermission>
        ),
      },
      {
        path: ROUTE_SEGMENTS.ADMIN,
        element: (
          <RequirePermission permission={PERMISSIONS.VIEW_ADMIN_MONITORING}>
            <AdminPage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.ADMIN}/roles`,
        element: (
          <RequirePermission permission={PERMISSIONS.VIEW_ADMIN_MONITORING}>
            <RolesPage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.ADMIN}/${ROUTE_SEGMENTS.RESTAURANT_USAGE}`,
        element: (
          <RequirePermission permission={PERMISSIONS.VIEW_KITCHEN_USAGE_ANALYTICS}>
            <RestaurantUsagePage />
          </RequirePermission>
        ),
      },
      {
        path: `${ROUTE_SEGMENTS.ADMIN}/users`,
        element: <Navigate to={ROUTES.USERS} replace />,
      },
      {
        path: `${ROUTE_SEGMENTS.ADMIN}/kitchen-management`,
        element: <Navigate to={ROUTES.KITCHEN_MANAGEMENT} replace />,
      },
      {
        path: `${ROUTE_SEGMENTS.ADMIN}/monitoring`,
        element: <Navigate to={ROUTES.ACTIVITY_LOGS} replace />,
      },
      {
        path: ROUTE_SEGMENTS.SUBSCRIPTION,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
    ],
  },
];

export default routeConfig;
