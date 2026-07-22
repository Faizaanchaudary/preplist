import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import Table from "../../../shared/ui/Table";
import { formatDate } from "../../../shared/utils/formatDate";
import { useRestaurantUsageQuery } from "../api/useRestaurantUsageQuery";

const PAGE_TITLE = "Restaurant Usage";
const PAGE_DESCRIPTION =
  "Aggregate adoption metrics per restaurant — no prep list, checklist, or recipe content is shown here.";

export default function RestaurantUsagePage() {
  const { data, isLoading, isError, error } = useRestaurantUsageQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <ErrorState title="Unable to load restaurant usage" error={error} />
      </FeaturePageShell>
    );
  }

  const rows = Array.isArray(data?.rows) ? data.rows : [];

  return (
    <FeaturePageShell title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      {rows.length ? (
        <Table
          columns={[
            { key: "kitchenName", label: "Restaurant" },
            { key: "companyName", label: "Company" },
            { key: "memberCount", label: "Members" },
            { key: "activeListCount", label: "Active lists" },
            {
              key: "completionPercentage",
              label: "Completion %",
              render: (row) => `${row.completionPercentage}%`,
            },
            {
              key: "usagePercentage",
              label: "Usage %",
              render: (row) => `${row.usagePercentage}%`,
            },
            {
              key: "lastActiveAt",
              label: "Last active",
              render: (row) => (row.lastActiveAt ? formatDate(row.lastActiveAt) : "—"),
            },
          ]}
          rows={rows}
          getRowKey={(row) => row.kitchenId}
          mobileCardTitleKey="kitchenName"
          mobileStackBreakpoint="lg"
        />
      ) : (
        <EmptyState
          title="No restaurants yet"
          description="Restaurant usage data will appear here once kitchens are active."
        />
      )}
    </FeaturePageShell>
  );
}
