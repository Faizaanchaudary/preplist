import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import Table from "../../../shared/ui/Table";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";

export default function DailyHistoryPanel({
  rows = [],
  onPreviewPhoto,
}) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No daily history"
        description="No completed checklist items are available for the current scope."
      />
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Daily history
      </h3>

      <Table
        className="mt-4"
        columns={[
          { key: "task", label: "Task" },
          { key: "listTitle", label: "List" },
          { key: "section", label: "Section" },
          { key: "completedBy", label: "Completed by" },
          {
            key: "completedAt",
            label: "Completed at",
            render: (row) =>
              `${formatDate(row.completedAt)} · ${formatTime(row.completedAt)}`,
          },
          {
            key: "proof",
            label: "Proof",
            render: (row) =>
              row.hasPhoto ? (
                <Button
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() => onPreviewPhoto?.(row)}
                >
                  View proof
                </Button>
              ) : (
                "—"
              ),
          },
        ]}
        rows={rows}
      />
    </Card>
  );
}