import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Modal from "../../../shared/ui/Modal";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";
import UserAccessModal from "../components/UserAccessModal";
import UserEditorDrawer from "../components/UserEditorDrawer";
import UserFilters from "../components/UserFilters";
import UserStats from "../components/UserStats";
import UsersTable from "../components/UsersTable";
import { useUsersQuery } from "../api/useUsersQuery";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} from "../api/useUsersMutations";
import useAuthStore from "../../../store/useAuthStore";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { ROLES } from "../../../shared/constants/roles";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState("all");
  const [kitchenId, setKitchenId] = useState("all");
  const [joinedViaCode, setJoinedViaCode] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editorMode, setEditorMode] = useState("create");
  const [editorUser, setEditorUser] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);
  const [deleteUserRow, setDeleteUserRow] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      role,
      status,
      companyId,
      kitchenId,
      joinedViaCode,
      createdFrom,
      createdTo,
    }),
    [debouncedSearch, role, status, companyId, kitchenId, joinedViaCode, createdFrom, createdTo]
  );

  const { data, isLoading, isFetching, isError, error } = useUsersQuery(filters);
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const isSavingUser = createUserMutation.isPending || updateUserMutation.isPending;

  const companies = Array.isArray(data?.companies) ? data.companies : [];
  const stats = Array.isArray(data?.stats) ? data.stats : [];
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const kitchenOptions = Array.isArray(data?.kitchenOptions) ? data.kitchenOptions : [];
  const kitchens = Array.isArray(data?.kitchens) ? data.kitchens : [];
  const lists = Array.isArray(data?.lists) ? data.lists : [];
  const sectionsByKitchenId =
    data?.sectionsByKitchenId && typeof data.sectionsByKitchenId === "object"
      ? data.sectionsByKitchenId
      : {};

  const canCreateUser =
    hasPermission(PERMISSIONS.MANAGE_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_COMPANY_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_RESTAURANT_USERS) ||
    hasPermission(PERMISSIONS.ASSIGN_ANY_ROLE) ||
    hasPermission(PERMISSIONS.ASSIGN_CHEF_ROLES) ||
    hasPermission(PERMISSIONS.ASSIGN_STAFF_ACCESS);

  const allowedRoleValues = (() => {
    if (!currentUser) return [ROLES.STAFF];
    if (currentUser.role === ROLES.SUPER_ADMIN) return Object.values(ROLES);
    if (currentUser.role === ROLES.FOUNDER) {
      return [ROLES.EXECUTIVE_CHEF, ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF];
    }
    if (currentUser.role === ROLES.EXECUTIVE_CHEF) {
      return [ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF];
    }
    if (currentUser.role === ROLES.HEAD_CHEF || currentUser.role === ROLES.SOUS_CHEF) {
      return [ROLES.STAFF];
    }
    return [ROLES.STAFF];
  })();

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4_000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function handleCompanyChange(nextCompanyId) {
    setCompanyId(nextCompanyId);

    if (nextCompanyId === "all" || kitchenId === "all") return;

    const selectedKitchen = kitchens.find((kitchen) => kitchen.id === kitchenId) ?? null;

    if (selectedKitchen?.companyId && selectedKitchen.companyId !== nextCompanyId) {
      setKitchenId("all");
    }
  }

  function handleKitchenChange(nextKitchenId) {
    setKitchenId(nextKitchenId);

    if (nextKitchenId === "all") return;

    const selectedKitchen = kitchens.find((kitchen) => kitchen.id === nextKitchenId) ?? null;

    if (
      selectedKitchen?.companyId &&
      companyId !== "all" &&
      selectedKitchen.companyId !== companyId
    ) {
      setCompanyId(selectedKitchen.companyId);
    }
  }

  function openCreateDrawer() {
    setEditorMode("create");
    setEditorUser(null);
    setEditorInstanceKey((value) => value + 1);
    setIsEditorOpen(true);
  }

  function openEditDrawer(row) {
    if (!row?.id) return;
    setEditorMode("edit");
    setEditorUser(row);
    setEditorInstanceKey((value) => value + 1);
    setIsEditorOpen(true);
  }

  function closeEditorDrawer() {
    if (isSavingUser) return;
    setIsEditorOpen(false);
    setEditorUser(null);
  }

  async function handleSaveUser(payload) {
    if (editorMode === "edit" && editorUser?.id) {
      await updateUserMutation.mutateAsync({ userId: editorUser.id, payload });
      setSuccessMessage("User updated.");
    } else {
      await createUserMutation.mutateAsync(payload);
      setSuccessMessage("User added.");
    }

    setIsEditorOpen(false);
    setEditorUser(null);
  }

  function requestDelete(row) {
    if (!row?.id) return;
    setDeleteError("");
    setDeleteUserRow(row);
  }

  function closeDeleteModal() {
    if (deleteUserMutation.isPending) return;
    setDeleteError("");
    setDeleteUserRow(null);
  }

  async function confirmDelete() {
    if (!deleteUserRow?.id) return;

    setDeleteError("");

    try {
      await deleteUserMutation.mutateAsync(deleteUserRow.id);
      setSuccessMessage("User deleted.");
      setDeleteUserRow(null);
    } catch (mutationError) {
      setDeleteError(
        mutationError?.data?.message || mutationError?.message || "Unable to delete user."
      );
    }
  }

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (isError && !data) {
    return (
      <FeaturePageShell
        title="Users"
        description="Search, filter, and manage staff access."
      >
        <ErrorState title="Unable to load users" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data) {
    return (
      <FeaturePageShell
        title="Users"
        description="Search, filter, and manage staff access."
      >
        <ErrorState
          title="Users unavailable"
          description="User data was not returned by the server."
        />
      </FeaturePageShell>
    );
  }

  return (
    <>
        <FeaturePageShell
          title="Users"
          description="Search, filter, and manage staff access."
          actions={
            canCreateUser ? (
              <Button onClick={openCreateDrawer} className="w-full sm:w-auto">
                Add user
              </Button>
            ) : null
          }
        >
          {stats.length ? <UserStats stats={stats} /> : null}

        {successMessage ? (
          <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--success-soft)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--success-strong)]">
              {successMessage}
            </p>
          </div>
        ) : null}

        <Card className="p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Filters
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Search by name/email, then narrow by role, status, company, kitchen, or account
                created date.
              </p>
            </div>

            <UserFilters
              search={search}
              onSearchChange={setSearch}
              role={role}
              onRoleChange={setRole}
              status={status}
              onStatusChange={setStatus}
              companyId={companyId}
              onCompanyChange={handleCompanyChange}
              kitchenId={kitchenId}
              onKitchenChange={handleKitchenChange}
              joinedViaCode={joinedViaCode}
              onJoinedViaCodeChange={setJoinedViaCode}
              createdFrom={createdFrom}
              onCreatedFromChange={setCreatedFrom}
              createdTo={createdTo}
              onCreatedToChange={setCreatedTo}
              companyOptions={companies}
              kitchenOptions={kitchenOptions}
            />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          {isFetching ? (
            <div className="mb-4 rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm text-[var(--text-muted)]">Updating users...</p>
            </div>
          ) : null}

          {rows.length ? (
            <UsersTable
              rows={rows}
              onEditUser={openEditDrawer}
              onDeleteUser={requestDelete}
              onManageAccess={setSelectedUser}
            />
          ) : (
            <EmptyState
              title="No users found"
              description="No users match the current filters for this scope."
            />
          )}
        </Card>
      </FeaturePageShell>

      <UserAccessModal
        key={selectedUser?.id ?? "user-access"}
        open={Boolean(selectedUser)}
        user={selectedUser}
        kitchenOptions={kitchenOptions}
        onClose={() => setSelectedUser(null)}
      />

      <UserEditorDrawer
        key={editorInstanceKey}
        open={isEditorOpen}
        mode={editorMode}
        user={editorUser}
        companies={companies}
        kitchens={kitchens}
        lists={lists}
        sectionsByKitchenId={sectionsByKitchenId}
        allowedRoleValues={allowedRoleValues}
        isSaving={isSavingUser}
        onClose={closeEditorDrawer}
        onSave={handleSaveUser}
      />

      <Modal
        open={Boolean(deleteUserRow)}
        onClose={closeDeleteModal}
        title={deleteUserRow?.name ? `Delete ${deleteUserRow.name}?` : "Delete user?"}
        description="This removes the user from local mock data. This cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Deleting a user removes their kitchen memberships in mock mode.
          </p>

          {deleteError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-600/90"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
