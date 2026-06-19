import Badge from "../../../shared/ui/Badge";
import { TASK_STATUS_LABELS, TASK_STATUSES } from "../../../shared/constants/taskStatuses";

function getVariant(status) {
  if (status === TASK_STATUSES.COMPLETED) return "success";
  if (status === TASK_STATUSES.IN_PROGRESS) return "warning";
  return "neutral";
}

export default function TaskStatusBadge({ status }) {
  return <Badge variant={getVariant(status)}>{TASK_STATUS_LABELS[status]}</Badge>;
}