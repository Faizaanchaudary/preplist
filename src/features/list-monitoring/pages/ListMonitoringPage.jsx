import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import Badge from "../../../shared/ui/Badge";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { ROUTES } from "../../../shared/constants/routes";
import { ROLES } from "../../../shared/constants/roles";
import useAuthStore from "../../../store/useAuthStore";
import { useListMonitoringQuery } from "../api/useListMonitoringQuery";
import ListCard from "../components/ListCard";
import ListFormModal from "../components/ListFormModal";
import SectionTabs from "../components/SectionTabs";

export default function ListMonitoringPage() {
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);

  const canCreateLists = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.CREATE_LISTS)
  );
  const canManageLists = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_LISTS)
  );

  const invitedListIds = Array.isArray(currentUser?.invitedListIds)
    ? currentUser.invitedListIds
    : [];
  const shouldShowJoinCta =
    currentUser?.role === ROLES.STAFF && invitedListIds.length === 0;

  const preferredSection =
    currentUser?.workingSectionByKitchen?.[activeKitchenId] ?? "";

  const [selectedSection, setSelectedSection] = useState(() =>
    preferredSection ? preferredSection : "all"
  );

  const { data, isLoading, isError, error } = useListMonitoringQuery({
    section: selectedSection,
  });

  if (isLoading && !data) {
    return <PageLoader />;
  }

  const actions = canManageLists || canCreateLists ? (
    <div className="flex flex-wrap items-center gap-3">
      {canManageLists ? (
        <Link to={`${ROUTES.LIST_MONITORING}/templates`}>
          <Button variant="secondary">Templates</Button>
        </Link>
      ) : null}

      {canCreateLists ? (
        <Button onClick={() => setIsListModalOpen(true)}>Create list</Button>
      ) : null}
    </div>
  ) : null;

  const modal = canCreateLists ? (
    <ListFormModal
      open={isListModalOpen}
      onClose={() => setIsListModalOpen(false)}
      onCreated={() => setSelectedSection("all")}
    />
  ) : null;

  if (isError) {
    return (
      <>
        <FeaturePageShell
          title="Prep Lists"
          description="Daily prep checklists grouped by section. Access codes let staff join lists safely, and checklist state is carry-forward ready."
          actions={actions}
        >
          <ErrorState title="Unable to load lists" error={error} />
        </FeaturePageShell>
        {modal}
      </>
    );
  }

  if (!data) {
    return (
      <>
        <FeaturePageShell
          title="Prep Lists"
          description="Daily prep checklists grouped by section. Access codes let staff join lists safely, and checklist state is carry-forward ready."
          actions={actions}
        >
          <ErrorState
            title="Lists unavailable"
            description="List data was not returned by the server."
          />
        </FeaturePageShell>
        {modal}
      </>
    );
  }

  const sections = Array.isArray(data.sections) ? data.sections : [];
  const lists = Array.isArray(data.lists) ? data.lists : [];

  return (
    <>
      <FeaturePageShell
        title="Prep Lists"
        description="Daily prep checklists grouped by section. Access codes let staff join lists safely, and checklist state is carry-forward ready."
        actions={actions}
      >
        {preferredSection ? (
          <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm text-[var(--text-muted)]">
              Current working section:{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {preferredSection}
              </span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SectionTabs
            sections={sections}
            value={selectedSection}
            onChange={setSelectedSection}
          />
          {selectedSection !== "all" ? <Badge>{selectedSection}</Badge> : null}
        </div>

        {lists.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                kitchenName={list.kitchenName}
                accessCode={list.accessCode ?? "—"}
                totalItems={Array.isArray(list.items) ? list.items.length : 0}
                completedItems={list.completedCount ?? 0}
              />
            ))}
          </div>
        ) : shouldShowJoinCta ? (
          <EmptyState
            title="You are not part of a kitchen yet"
            description="Join with an access code to get access to prep lists. Once you join, invited lists appear here automatically."
          >
            <Link to={ROUTES.JOIN_BY_CODE}>
              <Button>Join with access code</Button>
            </Link>
          </EmptyState>
        ) : (
          <EmptyState
            title="No lists available"
            description={
              selectedSection === "all"
                ? "No visible lists are available for this user right now."
                : `No lists are available in the ${selectedSection} section.`
            }
          >
            {canCreateLists ? (
              <Button onClick={() => setIsListModalOpen(true)}>
                Create list
              </Button>
            ) : null}
          </EmptyState>
        )}
      </FeaturePageShell>
      {modal}
    </>
  );
}
