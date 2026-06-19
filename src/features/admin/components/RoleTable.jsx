import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Table from "../../../shared/ui/Table";
import RoleDetailsDrawer from "./RoleDetailsDrawer";

export default function RoleTable({ rows = [] }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const resolvedRows = useMemo(() => {
    return Array.isArray(rows) ? rows : [];
  }, [rows]);

  return (
    <>
      <Table
        columns={[
          { key: "role", label: "Role" },
          { key: "scope", label: "Scope" },
          { key: "dataAccess", label: "Data access" },
          { key: "listOperation", label: "List operation" },
          { key: "recipeAccess", label: "Recipe access" },
          { key: "userRoleAccess", label: "User/role access" },
          { key: "subscription", label: "Subscription" },
          { key: "permissionCount", label: "Permission count" },
          {
            key: "details",
            label: "Details",
            render: (row) => (
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                onClick={() => setSelectedRole(row)}
              >
                View
              </Button>
            ),
          },
        ]}
        rows={resolvedRows}
        mobileCardTitleKey="role"
        mobileHiddenColumns={["permissionCount"]}
        mobileStackBreakpoint="lg"
      />

      <RoleDetailsDrawer
        open={Boolean(selectedRole)}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </>
  );
}
