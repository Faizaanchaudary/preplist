import Badge from "../../../shared/ui/Badge";
import Card from "../../../shared/ui/Card";
import { ROLE_OPTIONS } from "../../../shared/constants/roles";
import { deriveRolePermissions, formatRoleLabel } from "../../../shared/utils/deriveRolePermissions";

export default function RoleAccessPanel() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Roles & access
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Permission summary used across modules and repositories.
          </p>
        </div>
        <Badge variant="dark">{ROLE_OPTIONS.length} roles</Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {ROLE_OPTIONS.map((role) => {
          const permissions = deriveRolePermissions(role.value);

          return (
            <div
              key={role.value}
              className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {formatRoleLabel(role.value)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {role.value}
                  </p>
                </div>
                <Badge variant="neutral">{permissions.length} perms</Badge>
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                {permissions.length ? permissions.join(", ") : "—"}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

