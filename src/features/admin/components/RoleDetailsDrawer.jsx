import Badge from "../../../shared/ui/Badge";
import Drawer from "../../../shared/ui/Drawer";

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
        {value || "—"}
      </p>
    </div>
  );
}

export default function RoleDetailsDrawer({ open, onClose, role }) {
  const permissions = Array.isArray(role?.permissions) ? role.permissions : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={role?.role ? `${role.role} details` : "Role details"}
      description="Raw permission keys are shown here for reference. Capability columns are used across the UI to keep navigation and actions scoped."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryItem label="Scope" value={role?.scope} />
        <SummaryItem label="Data access" value={role?.dataAccess} />
        <SummaryItem label="List operation" value={role?.listOperation} />
        <SummaryItem label="Recipe access" value={role?.recipeAccess} />
        <SummaryItem label="User/role access" value={role?.userRoleAccess} />
        <SummaryItem label="Subscription" value={role?.subscription} />
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            Permission keys
          </h4>
          <Badge variant="dark">{permissions.length}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {permissions.length ? (
            permissions.map((permission) => (
              <Badge
                key={permission}
                className="bg-white font-mono text-[11px] text-[var(--text-muted)] shadow-[var(--shadow-card)]"
              >
                {permission}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--text-muted)]">—</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

