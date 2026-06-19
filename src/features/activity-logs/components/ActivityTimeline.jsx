import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";

export default function ActivityTimeline({ logs = [] }) {
  if (!logs.length) {
    return (
      <EmptyState
        title="No activity events"
        description="There are no activity events for the current filter."
      />
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Timeline
      </h3>

      <div className="mt-4 space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-[20px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {log.message}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}