import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Table from "../../../shared/ui/Table";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import useAuthStore from "../../../store/useAuthStore";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { getAssignableRoleValues } from "../../../shared/utils/rbac";

export default function OrganizationUsersTable({ rows = [], onManageUser }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canAssignRoles = getAssignableRoleValues(currentUser).length > 0;

  const canManageAccess =
    hasPermission(PERMISSIONS.MANAGE_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_COMPANY_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_RESTAURANT_USERS);

  const canManage = canAssignRoles || canManageAccess;

  return (
    <Table
      mobileStackBreakpoint="lg"
      mobileCardTitleKey="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "company", label: "Company" },
        { key: "kitchen", label: "Restaurant/Kitchen" },
        { key: "accessScope", label: "Access Scope" },
        {
          key: "joinedViaCode",
          label: "Joined Via Code",
          render: (row) =>
            row.joinedViaCode ? <Badge variant="success">Yes</Badge> : "No",
        },
        {
          key: "lastActiveAt",
          label: "Last Active",
          render: (row) =>
            row.lastActiveAt ? (
              <span>
                {formatDate(row.lastActiveAt)} · {formatTime(row.lastActiveAt)}
              </span>
            ) : (
              "—"
            ),
        },
        ...(canManage
          ? [
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <Button
                    variant="secondary"
                    className="px-3 py-2"
                    onClick={() => onManageUser?.(row)}
                  >
                    Manage
                  </Button>
                ),
              },
            ]
          : []),
      ]}
      rows={Array.isArray(rows) ? rows : []}
      emptyMessage="No users available for this scope."
    />
  );
}

