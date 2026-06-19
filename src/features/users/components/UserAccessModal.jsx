import { useMemo, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Select from "../../../shared/ui/Select";
import Checkbox from "../../../shared/ui/Checkbox";
import Badge from "../../../shared/ui/Badge";
import useAuthStore from "../../../store/useAuthStore";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { ROLE_OPTIONS, ROLES } from "../../../shared/constants/roles";
import { getAssignableRoleValues } from "../../../shared/utils/rbac";
import {
  useAssignUserRoleMutation,
  useUpdateUserAccessMutation,
} from "../api/useUsersMutations";

function normalizeIdArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export default function UserAccessModal({
  open,
  user,
  kitchenOptions = [],
  onClose,
}) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const assignRoleMutation = useAssignUserRoleMutation();
  const updateAccessMutation = useUpdateUserAccessMutation();

  const canAssignRoles = getAssignableRoleValues(currentUser);

  const canManageAccess =
    hasPermission(PERMISSIONS.MANAGE_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_COMPANY_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_RESTAURANT_USERS);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [role, setRole] = useState(() => user?.rawRole ?? "");
  const [accessibleKitchenIds, setAccessibleKitchenIds] = useState(() =>
    normalizeIdArray(user?.accessibleKitchenIds)
  );
  const [canScanDrafts, setCanScanDrafts] = useState(() =>
    normalizeIdArray(user?.permissions).includes(PERMISSIONS.SCAN_RECIPE_DRAFTS)
  );

  const isPending = assignRoleMutation.isPending || updateAccessMutation.isPending;

  const roleOptions = useMemo(() => {
    const allowedRoles = new Set(canAssignRoles);

    return [
      { value: "", label: "Select a role" },
      ...ROLE_OPTIONS.filter((option) => allowedRoles.has(option.value)).map(
        (option) => ({
          value: option.value,
          label: option.label,
        })
      ),
    ];
  }, [canAssignRoles]);

  const kitchenChoices = Array.isArray(kitchenOptions) ? kitchenOptions : [];

  function toggleKitchen(kitchenId) {
    setAccessibleKitchenIds((previous) => {
      const set = new Set(previous);
      if (set.has(kitchenId)) set.delete(kitchenId);
      else set.add(kitchenId);
      return Array.from(set);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!user?.id || isPending) return;

    try {
      if (canAssignRoles.length && role && role !== user.rawRole) {
        await assignRoleMutation.mutateAsync({ userId: user.id, role });
      }

      if (canManageAccess) {
        const nextPermissions = new Set(normalizeIdArray(user.permissions));

        if (canScanDrafts) nextPermissions.add(PERMISSIONS.SCAN_RECIPE_DRAFTS);
        else nextPermissions.delete(PERMISSIONS.SCAN_RECIPE_DRAFTS);

        await updateAccessMutation.mutateAsync({
          userId: user.id,
          payload: {
            accessibleKitchenIds,
            permissions: Array.from(nextPermissions),
          },
        });
      }

      onClose?.();
    } catch {
      // Errors surfaced below.
    }
  }

  const errorMessage =
    assignRoleMutation.error?.message || updateAccessMutation.error?.message || "";

  const roleError =
    hasSubmitted && canAssignRoles.length
      ? role
        ? ""
        : "Role selection is required."
      : "";

  const showRoleSection = canAssignRoles.length > 0;
  const showAccessSection = canManageAccess;

  const showScanDraftToggle = (user?.rawRole ?? "") === ROLES.STAFF;

  return (
    <Modal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="User access"
      description="Manage role assignment and restaurant access within scope."
    >
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              User
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {user.name}
              {" \u00b7 "}
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="dark">{user.role}</Badge>
              {user.joinedViaCode ? (
                <Badge variant="success">Joined via code</Badge>
              ) : null}
            </div>
          </div>

          {showRoleSection ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Role
              </label>
              <Select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                options={roleOptions}
                disabled={isPending}
              />
              {roleError ? <p className="text-sm text-red-600">{roleError}</p> : null}
            </div>
          ) : null}

          {showAccessSection ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Restaurants/Kitchens
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Select which restaurants the user can access.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {kitchenChoices.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--stroke-soft)] bg-white px-4 py-3"
                  >
                    <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">
                      {option.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibleKitchenIds.includes(option.value)}
                      onChange={() => toggleKitchen(option.value)}
                      disabled={isPending}
                    />
                  </label>
                ))}
              </div>

              {showScanDraftToggle ? (
                <Checkbox
                  id="scan-drafts"
                  checked={canScanDrafts}
                  onChange={setCanScanDrafts}
                  disabled={isPending}
                  label="Allow staff to scan recipe drafts (pending review)"
                />
              ) : null}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : null}

          {!showRoleSection && !showAccessSection ? (
            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                You do not have permission to manage this user's access.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Close
            </Button>
            {showRoleSection || showAccessSection ? (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
