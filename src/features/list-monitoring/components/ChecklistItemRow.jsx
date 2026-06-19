import { useMemo } from "react";
import Checkbox from "../../../shared/ui/Checkbox";
import Button from "../../../shared/ui/Button";
import Select from "../../../shared/ui/Select";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "../../../shared/constants/taskStatuses";
import { useUpdateChecklistItemMutation } from "../api/useListMonitoringMutations";
import RecipeLinkButton from "../../recipes/components/RecipeLinkButton";
import useAuthStore from "../../../store/useAuthStore";

const STATUS_OPTIONS = [
  {
    value: TASK_STATUSES.PENDING,
    label: TASK_STATUS_LABELS[TASK_STATUSES.PENDING],
  },
  {
    value: TASK_STATUSES.IN_PROGRESS,
    label: TASK_STATUS_LABELS[TASK_STATUSES.IN_PROGRESS],
  },
  {
    value: TASK_STATUSES.COMPLETED,
    label: TASK_STATUS_LABELS[TASK_STATUSES.COMPLETED],
  },
];

export default function ChecklistItemRow({
  item,
  photo,
  onPreviewPhoto,
  onAttachPhoto,
}) {
  const checkboxId = useMemo(() => `checklist-item-${item.id}`, [item.id]);
  const updateMutation = useUpdateChecklistItemMutation();
  const canOperate = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.OPERATE_LISTS)
  );

  const isCompleted = item.status === TASK_STATUSES.COMPLETED;
  const hasPhoto = Boolean(photo);
  const isDisabled = updateMutation.isPending || !canOperate;

  function handleToggleChecked(nextChecked) {
    if (!canOperate) return;
    updateMutation.mutate({
      listId: item.listId,
      itemId: item.id,
      checked: nextChecked,
    });
  }

  function handleStatusChange(nextStatus) {
    if (!canOperate) return;
    updateMutation.mutate({
      listId: item.listId,
      itemId: item.id,
      status: nextStatus,
    });
  }

  return (
    <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Checkbox
            id={checkboxId}
            checked={item.checked}
            disabled={isDisabled}
            onChange={handleToggleChecked}
            label={item.title}
            className="items-start"
          />

          {item.notes ? (
            <p className="mt-2 pl-8 text-sm leading-6 text-[var(--text-muted)]">
              {item.notes}
            </p>
          ) : null}
        </div>

        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Select
            value={item.status}
            onChange={(event) => handleStatusChange(event.target.value)}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            className="h-10 rounded-[16px] px-3 text-xs"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 pl-8 text-sm text-[var(--text-muted)]">
        <span>{item.checked ? "Checked" : "Unchecked"}</span>

        {item.completedAt ? (
          <span>
            {formatDate(item.completedAt)} · {formatTime(item.completedAt)}
          </span>
        ) : null}

        {item.recipeId ? (
          <RecipeLinkButton recipeId={item.recipeId} className="px-3 py-2" />
        ) : null}

        {hasPhoto ? (
          <Button
            variant="secondary"
            className="px-3 py-2"
            onClick={onPreviewPhoto}
            disabled={updateMutation.isPending}
          >
            View proof
          </Button>
        ) : null}

        {!hasPhoto && isCompleted && canOperate ? (
          <Button
            variant="secondary"
            className="px-3 py-2"
            onClick={onAttachPhoto}
            disabled={isDisabled}
          >
            Attach proof
          </Button>
        ) : null}
      </div>

      {updateMutation.error ? (
        <div className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {updateMutation.error.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
