import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import ActionMenu from "../../../shared/ui/ActionMenu";
import Table from "../../../shared/ui/Table";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import useAuthStore from "../../../store/useAuthStore";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { getAssignableRoleValues } from "../../../shared/utils/rbac";

function getStatusVariant(status) {
  if (status === "active") return "success";
  if (status === "invited") return "warning";
  return "neutral";
}

export default function UsersTable({
  rows = [],
  onEditUser,
  onDeleteUser,
  onManageAccess,
}) {
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
      responsiveMode="scroll"
      tableMinWidthClassName="min-w-[1100px]"
      columns={[
        {
          key: "name",
          label: "Name",
          cellClassName: "min-w-[160px] whitespace-nowrap",
        },
        {
          key: "email",
          label: "Email",
          cellClassName: "min-w-[220px] whitespace-nowrap",
          render: (row) => (
            <span title={row.email} className="block max-w-[320px] truncate">
              {row.email}
            </span>
          ),
        },
        {
          key: "role",
          label: "Role",
          cellClassName: "min-w-[120px] whitespace-nowrap",
          render: (row) => <Badge variant="dark">{row.role}</Badge>,
        },
        {
          key: "status",
          label: "Status",
          cellClassName: "min-w-[110px] whitespace-nowrap",
          render: (row) => (
            <Badge variant={getStatusVariant(row.rawStatus)}>{row.status}</Badge>
          ),
        },
        {
          key: "company",
          label: "Company",
          cellClassName: "min-w-[150px]",
        },
        {
          key: "kitchen",
          label: "Restaurant/Kitchen",
          cellClassName: "min-w-[180px]",
        },
        {
          key: "accessScope",
          label: "Access Scope",
          cellClassName: "min-w-[160px]",
        },
        {
          key: "joinedViaCode",
          label: "Joined via code",
          headerClassName: "min-w-[130px]",
          cellClassName: "min-w-[130px] whitespace-nowrap",
          render: (row) =>
            row.joinedViaCode ? <Badge variant="success">Yes</Badge> : "No",
        },
        {
          key: "createdAt",
          label: "Created",
          cellClassName: "min-w-[170px] whitespace-nowrap",
          render: (row) =>
            row.createdAt ? (
              <span className="whitespace-nowrap">
                {formatDate(row.createdAt)}
                {" \u00b7 "}
                {formatTime(row.createdAt)}
              </span>
            ) : (
              "\u2014"
            ),
        },
        {
          key: "lastActiveAt",
          label: "Last Active",
          headerClassName: "min-w-[140px]",
          cellClassName: "min-w-[170px] whitespace-nowrap",
          render: (row) =>
            row.lastActiveAt ? (
              <span className="whitespace-nowrap">
                {formatDate(row.lastActiveAt)}
                {" \u00b7 "}
                {formatTime(row.lastActiveAt)}
              </span>
            ) : (
              "\u2014"
            ),
        },
        ...(canManage
          ? [
              {
                key: "actions",
                label: "Actions",
                headerClassName: "min-w-[120px]",
                cellClassName: "min-w-[120px] whitespace-nowrap",
                render: (row) => (
                  <div className="flex items-center justify-end">
                    <div className="hidden items-center gap-2 lg:flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser?.(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageAccess?.(row)}
                      >
                        <span className="hidden xl:inline">Manage access</span>
                        <span className="xl:hidden">Access</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => onDeleteUser?.(row)}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="lg:hidden">
                      <ActionMenu
                        ariaLabel="Open user actions"
                        items={[
                          { key: "edit", label: "Edit", onClick: () => onEditUser?.(row) },
                          {
                            key: "access",
                            label: "Manage access",
                            onClick: () => onManageAccess?.(row),
                          },
                          {
                            key: "delete",
                            label: "Delete",
                            tone: "danger",
                            onClick: () => onDeleteUser?.(row),
                          },
                        ]}
                      />
                    </div>
                  </div>
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
