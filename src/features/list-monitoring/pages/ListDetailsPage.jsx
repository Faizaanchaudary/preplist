import { useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import Tabs from "../../../shared/ui/Tabs";
import CarryForwardNotice from "../components/CarryForwardNotice";
import ChecklistGroup from "../components/ChecklistGroup";
import CompletionPhotoModal from "../components/CompletionPhotoModal";
import ListHeader from "../components/ListHeader";
import { useListDetailsQuery } from "../api/useListMonitoringQuery";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export default function ListDetailsPage() {
  const { listId } = useParams();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [previewState, setPreviewState] = useState({
    open: false,
    item: null,
    photo: null,
  });

  const { data, isLoading, isError, error } = useListDetailsQuery(listId);

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (isError) {
    if (error?.status === 404) {
      return (
        <FeaturePageShell
          title="List details"
          description="List details could not be found."
        >
          <EmptyState
            title="List not found"
            description="The selected list does not exist in the current dataset."
          />
        </FeaturePageShell>
      );
    }

    return (
      <FeaturePageShell
        title="List details"
        description="List details could not be loaded."
      >
        <ErrorState title="Unable to load list" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data?.list) {
    return (
      <FeaturePageShell
        title="List details"
        description="List details could not be found."
      >
        <EmptyState
          title="List not found"
          description="The selected list does not exist in the current dataset."
        />
      </FeaturePageShell>
    );
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const photosByItemId = data.photosByItemId ?? {};

  const filteredItems =
    selectedFilter === "all"
      ? items
      : items.filter((item) => item.status === selectedFilter);

  const selectedFilterLabel =
    FILTERS.find((item) => item.value === selectedFilter)?.label ?? "All";

  return (
    <>
      <FeaturePageShell
        title="List details"
        description="Detailed checklist view with task state, completion proof, and carry-forward notice."
      >
        <Card className="p-5 sm:p-6">
          <ListHeader
            title={data.list.title}
            section={data.list.section}
            accessCode={data.accessCode?.code}
            active={data.list.isActive}
          />

          <div className="mt-5">
            <CarryForwardNotice />
          </div>

          <div className="mt-5">
            <Tabs
              items={FILTERS}
              value={selectedFilter}
              onChange={setSelectedFilter}
            />
          </div>

          <div className="mt-5">
            {filteredItems.length ? (
              <ChecklistGroup
                title={
                  selectedFilter === "all"
                    ? "Checklist items"
                    : `Filtered: ${selectedFilterLabel}`
                }
                items={filteredItems}
                getPhotoForItem={(itemId) => photosByItemId[itemId]}
                onPreviewPhoto={(item, photo) =>
                  setPreviewState({
                    open: true,
                    item,
                    photo,
                  })
                }
                onAttachPhoto={(item) =>
                  setPreviewState({
                    open: true,
                    item,
                    photo: null,
                  })
                }
              />
            ) : (
              <EmptyState
                className="border-0 bg-transparent p-0 shadow-none"
                title="No checklist items"
                description={
                  selectedFilter === "all"
                    ? "This list has no checklist items yet."
                    : `No items match the ${selectedFilterLabel} filter.`
                }
              />
            )}
          </div>
        </Card>
      </FeaturePageShell>

      <CompletionPhotoModal
        key={previewState.item?.id ?? "completion-photo"}
        open={previewState.open}
        item={previewState.item}
        photo={previewState.photo}
        onClose={() =>
          setPreviewState({
            open: false,
            item: null,
            photo: null,
          })
        }
      />
    </>
  );
}