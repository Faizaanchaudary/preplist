import { TASK_STATUSES } from "../constants/taskStatuses";

export function deriveDashboardStats({
  kitchens,
  lists,
  checklistItems,
  memberships,
}) {
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(
    (item) => item.status === TASK_STATUSES.COMPLETED
  ).length;
  const activeLists = lists.filter((list) => list.isActive).length;

  return [
    {
      label: "Visible kitchens",
      value: kitchens.length,
      helper: "Role-aware scope",
    },
    {
      label: "Active lists",
      value: activeLists,
      helper: "Manual creation only",
    },
    {
      label: "Checklist completion",
      value: `${totalItems ? Math.round((completedItems / totalItems) * 100) : 0}%`,
      helper: `${completedItems}/${totalItems} completed`,
    },
    {
      label: "Joined members",
      value: memberships.length,
      helper: "Tracked via memberships",
    },
  ];
}