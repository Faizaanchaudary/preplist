import { useParams } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import AccessCodeCard from "../components/AccessCodeCard";
import JoinCodeActivityList from "../components/JoinCodeActivityList";
import KitchenMembersTable from "../components/KitchenMembersTable";
import KitchenSectionsCard from "../components/KitchenSectionsCard";
import { useKitchenDetailsQuery } from "../api/useKitchenManagementQuery";

export default function KitchenDetailsPage() {
  const { kitchenId } = useParams();
  const { data, isLoading, isError, error } = useKitchenDetailsQuery(kitchenId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    if (error?.status === 404) {
      return (
        <FeaturePageShell
          title="Kitchen details"
          description="Kitchen details could not be found."
        >
          <EmptyState
            title="Kitchen not found"
            description="The selected kitchen does not exist in the current dataset."
          />
        </FeaturePageShell>
      );
    }

    return (
      <FeaturePageShell
        title="Kitchen details"
        description="Kitchen details could not be loaded."
      >
        <ErrorState title="Unable to load kitchen" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data?.kitchen) {
    return (
      <FeaturePageShell
        title="Kitchen details"
        description="Kitchen details could not be found."
      >
        <EmptyState
          title="Kitchen not found"
          description="The selected kitchen does not exist in the current dataset."
        />
      </FeaturePageShell>
    );
  }

  const sections = Array.isArray(data.sections) ? data.sections : [];
  const members = Array.isArray(data.members) ? data.members : [];
  const accessCodes = Array.isArray(data.accessCodes) ? data.accessCodes : [];
  const joinEvents = Array.isArray(data.joinEvents) ? data.joinEvents : [];

  return (
    <FeaturePageShell
      title={data.kitchen.name}
      description={`${data.kitchen.city} · ${data.kitchen.siteCode}`}
    >
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="min-w-0 space-y-5">
          <KitchenSectionsCard sections={sections} />

          <Card className="min-w-0 p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Access codes
            </h3>

            <div className="mt-4 space-y-3">
              {accessCodes.length ? (
                accessCodes.map((code) => (
                  <AccessCodeCard key={code.id} code={code} />
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  No access codes are available for this kitchen yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card className="min-w-0 p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Kitchen members
            </h3>

            <div className="mt-4 min-w-0">
              <KitchenMembersTable rows={members} />
            </div>
          </Card>

          <JoinCodeActivityList logs={joinEvents} />
        </div>
      </div>
    </FeaturePageShell>
  );
}