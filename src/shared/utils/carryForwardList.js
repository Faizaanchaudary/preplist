export function carryForwardList(list, items, snapshotDate) {
  const date = new Date(snapshotDate);
  const dayKey = Number.isNaN(date.getTime())
    ? String(snapshotDate)
    : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
        date.getDate()
      ).padStart(2, "0")}`;

  return {
    id: `snap-${list.id}-${dayKey}`,
    listId: list.id,
    kitchenId: list.kitchenId,
    section: list.section,
    title: list.title,
    snapshotDate,
    carriedToActivity: true,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      checked: item.checked,
      status: item.status,
      notes: item.notes ?? "",
      completedBy: item.completedBy ?? null,
      completedAt: item.completedAt ?? null,
    })),
  };
}
