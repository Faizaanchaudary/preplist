import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import { ROLE_OPTIONS } from "../../../shared/constants/roles";

export default function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  companyId,
  onCompanyChange,
  kitchenId,
  onKitchenChange,
  joinedViaCode,
  onJoinedViaCodeChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  companyOptions = [],
  kitchenOptions = [],
}) {
  const safeCompanyOptions = Array.isArray(companyOptions) ? companyOptions : [];
  const safeKitchenOptions = Array.isArray(kitchenOptions) ? kitchenOptions : [];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Input
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder="Search by name or email"
        className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
      />

      <Select
        value={role}
        onChange={(event) => onRoleChange?.(event.target.value)}
        options={[
          { value: "all", label: "All roles" },
          ...ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
        ]}
      />

      <Select
        value={status}
        onChange={(event) => onStatusChange?.(event.target.value)}
        options={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "invited", label: "Invited" },
          { value: "disabled", label: "Disabled" },
        ]}
      />

      <Select
        value={companyId}
        onChange={(event) => onCompanyChange?.(event.target.value)}
        options={[
          { value: "all", label: "All companies" },
          ...safeCompanyOptions.map((company) => ({
            value: company.id,
            label: company.name,
          })),
        ]}
      />

      <Select
        value={kitchenId}
        onChange={(event) => onKitchenChange?.(event.target.value)}
        options={[
          { value: "all", label: "All kitchens" },
          ...safeKitchenOptions.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ]}
      />

      <Select
        value={joinedViaCode}
        onChange={(event) => onJoinedViaCodeChange?.(event.target.value)}
        className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
        options={[
          { value: "all", label: "Joined via code (Any)" },
          { value: "yes", label: "Joined via code (Yes)" },
          { value: "no", label: "Joined via code (No)" },
        ]}
      />

      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 xl:col-span-2">
        <label className="text-xs font-medium text-[var(--text-muted)]">Created from</label>
        <Input
          type="date"
          value={createdFrom}
          onChange={(event) => onCreatedFromChange?.(event.target.value)}
          aria-label="Created from"
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 xl:col-span-2">
        <label className="text-xs font-medium text-[var(--text-muted)]">Created to</label>
        <Input
          type="date"
          value={createdTo}
          onChange={(event) => onCreatedToChange?.(event.target.value)}
          aria-label="Created to"
        />
      </div>
    </div>
  );
}
