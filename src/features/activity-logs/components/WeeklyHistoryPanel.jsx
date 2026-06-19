import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import ProgressBar from "../../../shared/ui/ProgressBar";

export default function WeeklyHistoryPanel({ rows = [] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No weekly history"
        description="There are no weekly completion records available right now."
      />
    );
  }

  const maxCompletions = Math.max(
    ...rows.map((row) => row.completions ?? 0),
    1
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {rows.map((row) => (
        <Card key={row.id} className="p-5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {row.dayLabel}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {row.completions ?? 0}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {row.photoCount ?? 0} photo proofs
          </p>
          <div className="mt-4">
            <ProgressBar value={row.completions ?? 0} max={maxCompletions} />
          </div>
        </Card>
      ))}
    </div>
  );
}