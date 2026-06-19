import Badge from "../../../shared/ui/Badge";
import Card from "../../../shared/ui/Card";
import Table from "../../../shared/ui/Table";
import { getAllRoleSummaryRows } from "../../../shared/utils/roleSummary";

export default function RoleAccessSummary() {
  const rows = getAllRoleSummaryRows().map((row) => ({
    id: row.id,
    role: row.roleLabel,
    scope: row.scope,
    dataAccess: row.dataAccess,
    listOperation: row.listOperation,
    subscription: row.subscription,
  }));

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Role access summary
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            High-level capabilities used to filter data visibility and checklist actions.
          </p>
        </div>
        <Badge variant="dark">{rows.length} roles</Badge>
      </div>

      <div className="mt-5">
        <Table
          columns={[
            { key: "role", label: "Role" },
            { key: "scope", label: "Scope" },
            { key: "dataAccess", label: "Data access" },
            { key: "listOperation", label: "List operation" },
            { key: "subscription", label: "Subscription" },
          ]}
          rows={rows}
          mobileCardTitleKey="role"
          mobileHiddenColumns={["subscription"]}
          mobileStackBreakpoint="lg"
        />
      </div>
    </Card>
  );
}

