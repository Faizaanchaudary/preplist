import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";
import { formatDate } from "../../../shared/utils/formatDate";

export default function CarryForwardSnapshot({ rows = [] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No snapshots available"
        description="No carry-forward list snapshots are available for the current scope."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {rows.map((snapshot) => (
        <Card key={snapshot.id} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {snapshot.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Snapshot: {formatDate(snapshot.snapshotDate)}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Preserved previous-day checklist state (read-only).
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="dark">Read-only</Badge>
              <Badge>{snapshot.items.length} items</Badge>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {snapshot.items.map((item) => (
              <div
                key={item.id}
                className="rounded-[18px] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)]"
              >
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-[var(--text-muted)]">
                  {item.checked ? "Checked" : "Unchecked"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
