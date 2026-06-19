import Drawer from "../../../shared/ui/Drawer";
import ProofImagePreview from "../../../shared/ui/ProofImagePreview";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";

export default function PhotoReviewDrawer({
  open,
  onClose,
  entry,
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Photo review"
      description="Completion proof linked to the completed checklist item."
    >
      {entry ? (
        <div className="space-y-4">
          <ProofImagePreview
            url={entry.photo?.url}
            label={entry.photo?.label ?? "Completion proof"}
            emptyTitle={entry.photo?.label ?? "Completion proof"}
            emptyDescription="No image was saved for this proof."
          />

          <div className="grid gap-3">
            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Task
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {entry.task}
              </p>
            </div>

            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Completed by
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {entry.completedBy}
              </p>
            </div>

            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Completed at
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {formatDate(entry.completedAt)} · {formatTime(entry.completedAt)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
