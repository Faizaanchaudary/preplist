import Badge from "../../../shared/ui/Badge";
import Card from "../../../shared/ui/Card";

function PersonPill({ name, email }) {
  if (!name) return null;

  return (
    <div className="min-w-0 rounded-[18px] bg-white px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
        {name}
      </p>
      {email ? (
        <p className="truncate text-xs text-[var(--text-muted)]">{email}</p>
      ) : null}
    </div>
  );
}

function PeopleRow({ label, people = [], emptyLabel = "—", limit = 4 }) {
  const rows = Array.isArray(people) ? people : [];

  const visible = rows.slice(0, Math.max(0, limit));
  const remainingCount = Math.max(0, rows.length - visible.length);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visible.length ? (
          <>
            {visible.map((person) => (
              <PersonPill
                key={person.id ?? person.email ?? person.name}
                name={person.name}
                email={person.email}
              />
            ))}
            {remainingCount ? (
              <div className="rounded-[18px] bg-white px-3 py-2 text-sm font-medium text-[var(--text-muted)] shadow-[var(--shadow-card)]">
                +{remainingCount} more
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function KitchenCard({ kitchen }) {
  if (!kitchen) return null;

  const staffCount = Array.isArray(kitchen.staff) ? kitchen.staff.length : 0;

  return (
    <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--text-primary)]">
            {kitchen.name}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {kitchen.siteCode || "—"}
          </p>
        </div>
        <Badge variant="neutral">{staffCount} staff</Badge>
      </div>

      <div className="mt-4 space-y-4">
        <PeopleRow label="Head Chef" people={kitchen.headChefs} limit={3} />
        <PeopleRow label="Sous Chef" people={kitchen.sousChefs} limit={3} />
        <PeopleRow label="Staff" people={kitchen.staff} limit={4} />
      </div>
    </div>
  );
}

export default function CompanyCard({ company }) {
  if (!company) return null;

  const kitchens = Array.isArray(company.kitchens) ? company.kitchens : [];
  const executiveChefs = Array.isArray(company.executiveChefs)
    ? company.executiveChefs
    : [];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">
            {company.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Company hierarchy and restaurant access.
          </p>
        </div>
        <Badge variant="dark">{kitchens.length} kitchens</Badge>
      </div>

      <div className="mt-5 space-y-5">
        {company.founder ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Founder / Owner
            </p>
            <div className="mt-2">
              <PersonPill
                name={company.founder.name}
                email={company.founder.email}
              />
            </div>
          </div>
        ) : null}

        <PeopleRow label="Executive Chefs" people={executiveChefs} limit={4} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Restaurants / Kitchens
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {kitchens.map((kitchen) => (
              <KitchenCard key={kitchen.id} kitchen={kitchen} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

