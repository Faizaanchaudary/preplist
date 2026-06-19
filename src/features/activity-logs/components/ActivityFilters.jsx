import Select from "../../../shared/ui/Select";
import Tabs from "../../../shared/ui/Tabs";

const VIEW_ITEMS = [
  { value: "timeline", label: "Timeline" },
  { value: "daily", label: "Daily history" },
  { value: "weekly", label: "Weekly history" },
  { value: "snapshots", label: "Snapshots" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "created_list", label: "Created list" },
  { value: "joined_via_code", label: "Joined via code" },
  { value: "checked_item", label: "Checked item" },
  { value: "unchecked_item", label: "Unchecked item" },
  { value: "status_changed", label: "Status changed" },
  { value: "completed_item", label: "Completed item" },
  { value: "attached_photo", label: "Attached photo" },
];

const PROOF_OPTIONS = [
  { value: "all", label: "All completions" },
  { value: "with_photo", label: "With proof photo" },
  { value: "without_photo", label: "Without proof photo" },
];

export default function ActivityFilters({
  view,
  onViewChange,
  actionFilter,
  onActionFilterChange,
  proofFilter,
  onProofFilterChange,
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Tabs items={VIEW_ITEMS} value={view} onChange={onViewChange} />

      {view === "timeline" ? (
        <div className="relative z-10 w-full lg:max-w-[220px]">
          <Select
            value={actionFilter}
            onChange={(event) => onActionFilterChange?.(event.target.value)}
            options={ACTION_OPTIONS}
            aria-label="Filter timeline by action"
          />
        </div>
      ) : null}

      {view === "daily" ? (
        <div className="relative z-10 w-full lg:max-w-[220px]">
          <Select
            value={proofFilter}
            onChange={(event) => onProofFilterChange?.(event.target.value)}
            options={PROOF_OPTIONS}
            aria-label="Filter daily history by proof photo"
          />
        </div>
      ) : null}
    </div>
  );
}
