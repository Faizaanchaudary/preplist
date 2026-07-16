import EmptyState from "../../../shared/ui/EmptyState";
import ChecklistItemRow from "./ChecklistItemRow";

export default function ChecklistGroup({
  title,
  items = [],
  getPhotoForItem,
  onPreviewPhoto,
  onAttachPhoto,
}) {
  if (!items.length) {
    return (
      <EmptyState
        className="p-0 shadow-none border-0 bg-transparent"
        title="No checklist items"
        description="There are no checklist items in this group."
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h4>
        <span className="text-sm text-[var(--text-muted)]">
          {items.length} items
        </span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
        {items.map((item) => {
          const photo = getPhotoForItem(item.id);

          return (
            <ChecklistItemRow
              key={item.id}
              item={item}
              photo={photo ?? null}
              onPreviewPhoto={() => onPreviewPhoto?.(item, photo)}
              onAttachPhoto={() => onAttachPhoto?.(item)}
            />
          );
        })}
      </div>
    </section>
  );
}