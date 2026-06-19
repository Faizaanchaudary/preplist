import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Checkbox from "../../../shared/ui/Checkbox";
import Drawer from "../../../shared/ui/Drawer";
import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";
import { cn } from "../../../shared/utils/cn";
import { ROLES, ROLE_OPTIONS } from "../../../shared/constants/roles";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "disabled", label: "Disabled" },
];

function normalizeIdArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function buildInitialForm(user, companies) {
  const companyIds = normalizeIdArray(user?.companyIds);
  const resolvedCompanyId =
    companyIds[0] ?? (Array.isArray(companies) && companies[0]?.id ? companies[0].id : "");

  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.rawRole ?? user?.role ?? ROLES.STAFF,
    status: user?.rawStatus ?? user?.status ?? "invited",
    companyId: resolvedCompanyId,
    accessibleKitchenIds: normalizeIdArray(user?.accessibleKitchenIds),
    invitedListIds: normalizeIdArray(user?.invitedListIds),
    assignedSectionsByKitchen:
      user && typeof user.assignedSectionsByKitchen === "object"
        ? user.assignedSectionsByKitchen
        : {},
    tempPin: user?.tempPin ?? "",
    inviteNote: user?.inviteNote ?? "",
  };
}

export default function UserEditorDrawer({
  open,
  mode = "create",
  user,
  companies = [],
  kitchens = [],
  lists = [],
  sectionsByKitchenId = {},
  allowedRoleValues = null,
  isSaving = false,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => buildInitialForm(user, companies));
  const [errorMessage, setErrorMessage] = useState("");

  const roleOptions = useMemo(() => {
    const allowed = Array.isArray(allowedRoleValues)
      ? new Set(allowedRoleValues)
      : null;

    return ROLE_OPTIONS.filter((option) => (allowed ? allowed.has(option.value) : true)).map(
      (option) => ({ value: option.value, label: option.label })
    );
  }, [allowedRoleValues]);

  const companyOptions = useMemo(() => {
    const safeCompanies = Array.isArray(companies) ? companies : [];
    return safeCompanies.map((company) => ({ value: company.id, label: company.name }));
  }, [companies]);

  const visibleKitchens = useMemo(() => {
    const safeKitchens = Array.isArray(kitchens) ? kitchens : [];
    const companyId = String(form.companyId ?? "").trim();

    if (!companyId) return safeKitchens;

    return safeKitchens.filter((kitchen) => kitchen.companyId === companyId);
  }, [kitchens, form.companyId]);

  const selectedKitchenIds = normalizeIdArray(form.accessibleKitchenIds);

  const listChoices = useMemo(() => {
    const safeLists = Array.isArray(lists) ? lists : [];
    const selectedSet = new Set(selectedKitchenIds);

    return safeLists
      .filter((list) => selectedSet.has(list.kitchenId))
      .map((list) => ({
        id: list.id,
        label: list.section ? `${list.title} \u00b7 ${list.section}` : list.title,
      }));
  }, [lists, selectedKitchenIds]);

  const roleRequiresKitchen = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF]);

  function toggleKitchen(kitchenId) {
    setForm((previous) => {
      const next = new Set(normalizeIdArray(previous.accessibleKitchenIds));
      if (next.has(kitchenId)) next.delete(kitchenId);
      else next.add(kitchenId);
      return { ...previous, accessibleKitchenIds: Array.from(next) };
    });
  }

  function toggleList(listId) {
    setForm((previous) => {
      const next = new Set(normalizeIdArray(previous.invitedListIds));
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return { ...previous, invitedListIds: Array.from(next) };
    });
  }

  function toggleSection(kitchenId, sectionName) {
    setForm((previous) => {
      const current = previous.assignedSectionsByKitchen ?? {};
      const existing = Array.isArray(current[kitchenId]) ? current[kitchenId] : [];

      const nextForKitchen = new Set(existing);
      if (nextForKitchen.has(sectionName)) nextForKitchen.delete(sectionName);
      else nextForKitchen.add(sectionName);

      return {
        ...previous,
        assignedSectionsByKitchen: {
          ...current,
          [kitchenId]: Array.from(nextForKitchen),
        },
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();
    const role = String(form.role ?? "").trim();
    const status = String(form.status ?? "").trim();
    const companyId = String(form.companyId ?? "").trim();
    const accessibleKitchenIds = normalizeIdArray(form.accessibleKitchenIds);

    if (!name) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("A valid email is required.");
      return;
    }

    if (!role) {
      setErrorMessage("Role selection is required.");
      return;
    }

    if (!companyId) {
      setErrorMessage("Company selection is required.");
      return;
    }

    if (roleRequiresKitchen.has(role) && !accessibleKitchenIds.length) {
      setErrorMessage("Select at least one restaurant/kitchen for this role.");
      return;
    }

    setErrorMessage("");

    try {
      await onSave?.({
        name,
        email,
        role,
        status,
        companyId,
        accessibleKitchenIds,
        invitedListIds: normalizeIdArray(form.invitedListIds),
        assignedSectionsByKitchen: form.assignedSectionsByKitchen ?? {},
        tempPin: String(form.tempPin ?? "").trim(),
        inviteNote: String(form.inviteNote ?? "").trim(),
      });
    } catch (error) {
      setErrorMessage(
        error?.data?.message || error?.message || "Unable to save user."
      );
    }
  }

  const title = isEdit ? "Edit user" : "Add user";

  return (
    <Drawer
      open={open}
      onClose={isSaving ? undefined : onClose}
      title={title}
      description="Create and manage mock users. Created date and last active are tracked automatically."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Name
            </label>
            <Input
              value={form.name}
              onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
              placeholder="Jane Doe"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Email
            </label>
            <Input
              value={form.email}
              onChange={(event) => setForm((p) => ({ ...p, email: event.target.value }))}
              placeholder="jane@company.com"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Role
            </label>
            <Select
              value={form.role}
              onChange={(event) => setForm((p) => ({ ...p, role: event.target.value }))}
              options={roleOptions}
              disabled={isSaving || roleOptions.length <= 1}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Status
            </label>
            <Select
              value={form.status}
              onChange={(event) => setForm((p) => ({ ...p, status: event.target.value }))}
              options={STATUS_OPTIONS}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Company
          </label>
          <Select
            value={form.companyId}
            onChange={(event) =>
              setForm((p) => ({
                ...p,
                companyId: event.target.value,
                accessibleKitchenIds: [],
                invitedListIds: [],
                assignedSectionsByKitchen: {},
              }))
            }
            options={companyOptions}
            disabled={isSaving || companyOptions.length <= 1}
          />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Restaurants/Kitchens
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Select which locations the user can access.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {visibleKitchens.length ? (
              visibleKitchens.map((kitchen) => (
                <label
                  key={kitchen.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--stroke-soft)] bg-white px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">
                    {kitchen.siteCode ? `${kitchen.name} (${kitchen.siteCode})` : kitchen.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedKitchenIds.includes(kitchen.id)}
                    onChange={() => toggleKitchen(kitchen.id)}
                    disabled={isSaving}
                  />
                </label>
              ))
            ) : (
              <div className="rounded-[18px] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-muted)]">
                No kitchens are available for this company scope.
              </div>
            )}
          </div>
        </div>

        {selectedKitchenIds.length ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Assigned section(s)
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Used for staff section routing. Optional for non-staff roles.
              </p>
            </div>

            <div className="space-y-4">
              {selectedKitchenIds.map((kitchenId) => {
                const sections = Array.isArray(sectionsByKitchenId?.[kitchenId])
                  ? sectionsByKitchenId[kitchenId]
                  : [];
                const selected = Array.isArray(form.assignedSectionsByKitchen?.[kitchenId])
                  ? form.assignedSectionsByKitchen[kitchenId]
                  : [];

                return (
                  <div
                    key={kitchenId}
                    className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {kitchens.find((k) => k.id === kitchenId)?.name ?? kitchenId}
                    </p>

                    <div
                      className={cn(
                        "mt-3 grid gap-2",
                        sections.length > 4 ? "sm:grid-cols-2" : ""
                      )}
                    >
                      {sections.length ? (
                        sections.map((sectionName) => (
                          <Checkbox
                            key={sectionName}
                            id={`${kitchenId}-${sectionName}`}
                            label={sectionName}
                            checked={selected.includes(sectionName)}
                            onChange={() => toggleSection(kitchenId, sectionName)}
                            disabled={isSaving}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-[var(--text-muted)]">No sections configured.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {listChoices.length ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Invited lists</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Lists the user can operate, even without full kitchen permissions.
              </p>
            </div>

            <div className="grid gap-2">
              {listChoices.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--stroke-soft)] bg-white px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">
                    {list.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={normalizeIdArray(form.invitedListIds).includes(list.id)}
                    onChange={() => toggleList(list.id)}
                    disabled={isSaving}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Temporary PIN (optional)
            </label>
            <Input
              value={form.tempPin}
              onChange={(event) => setForm((p) => ({ ...p, tempPin: event.target.value }))}
              placeholder="1234"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Invite note (optional)
            </label>
            <Input
              value={form.inviteNote}
              onChange={(event) =>
                setForm((p) => ({ ...p, inviteNote: event.target.value }))
              }
              placeholder="Invite sent via SMS"
              disabled={isSaving}
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Add user"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
