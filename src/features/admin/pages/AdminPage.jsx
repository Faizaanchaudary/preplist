import { Link } from "react-router-dom";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";

export default function AdminPage() {
  const canAssignAnyRole = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.ASSIGN_ANY_ROLE)
  );
  const canAssignChefRoles = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.ASSIGN_CHEF_ROLES)
  );
  const canViewAdminMonitoring = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.VIEW_ADMIN_MONITORING)
  );
  const canViewOrganization = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.VIEW_ORGANIZATION)
  );
  const canViewSubscription = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.VIEW_SUBSCRIPTION)
  );
  const canManageUsers = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_USERS)
  );
  const canManageCompanyUsers = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_COMPANY_USERS)
  );
  const canManageRestaurantUsers = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_RESTAURANT_USERS)
  );
  const canAssignStaffAccess = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.ASSIGN_STAFF_ACCESS)
  );
  const canCreateLists = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.CREATE_LISTS)
  );
  const canViewActivityLogs = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.VIEW_ACTIVITY_LOGS)
  );
  const canViewRestaurantUsage = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.VIEW_KITCHEN_USAGE_ANALYTICS)
  );
  const canViewUsers =
    canManageUsers ||
    canManageCompanyUsers ||
    canManageRestaurantUsers ||
    canAssignStaffAccess;
  const canViewKitchenManagement = canCreateLists;
  const canViewActivity = canViewActivityLogs;
  const canViewRoles =
    canAssignAnyRole || canAssignChefRoles || canViewAdminMonitoring;
  const hasAdminCards =
    canViewRoles ||
    canViewUsers ||
    canViewKitchenManagement ||
    canViewActivity ||
    canViewOrganization ||
    canViewSubscription ||
    canViewRestaurantUsage;

  return (
    <FeaturePageShell
      title="Admin"
      description="Administrative control hub. Open the module that owns each workflow."
    >
      {hasAdminCards ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {canViewOrganization ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Organization</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Company hierarchy, restaurant access, and leadership structure.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.ORGANIZATION}>
                  <Button variant="secondary">Open organization</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewUsers ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Users</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                User management, access control, and role assignment.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.USERS}>
                  <Button variant="secondary">Open users</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewRoles ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Roles & Permissions</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                RBAC capability review for the mock role model.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.ADMIN_ROLES}>
                  <Button variant="secondary">Open roles</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewKitchenManagement ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Kitchen Management</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Restaurants, sections, members, access codes, and join activity.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.KITCHEN_MANAGEMENT}>
                  <Button variant="secondary">Open kitchens</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewActivity ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Monitoring</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Timeline, daily history, weekly history, snapshots, and photo review.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.ACTIVITY_LOGS}>
                  <Button variant="secondary">Open activity</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewRestaurantUsage ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Restaurant Usage</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Aggregate adoption percentage per restaurant — no prep list or recipe content.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.ADMIN_RESTAURANT_USAGE}>
                  <Button variant="secondary">Open restaurant usage</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {canViewSubscription ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Subscription</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Restaurant-level mock plan definitions and usage assignments.
              </p>
              <div className="mt-4">
                <Link to={ROUTES.SUBSCRIPTION}>
                  <Button variant="secondary">Open subscription</Button>
                </Link>
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No admin actions available"
          description="Your current role does not have admin action access."
        />
      )}
    </FeaturePageShell>
  );
}
