import { useState } from "react";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import Tabs from "../../../shared/ui/Tabs";
import OrganizationStats from "../components/OrganizationStats";
import OrganizationTree from "../components/OrganizationTree";
import { useOrganizationOverviewQuery } from "../api/useOrganizationQuery";

export default function OrganizationPage() {
  const [activeCompanyId, setActiveCompanyId] = useState("all");

  const overviewQuery = useOrganizationOverviewQuery({ companyId: activeCompanyId });

  const isLoading = overviewQuery.isLoading;
  const isError = overviewQuery.isError;
  const error = overviewQuery.error;

  const companies = Array.isArray(overviewQuery.data?.companies)
    ? overviewQuery.data.companies
    : [];
  const stats = Array.isArray(overviewQuery.data?.stats) ? overviewQuery.data.stats : [];
  const tree = overviewQuery.data?.tree ?? null;

  const safeCompanies = Array.isArray(companies) ? companies : [];

  const companyTabs = [
    { value: "all", label: "All Companies" },
    ...safeCompanies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell
        title="Organization"
        description="Company hierarchy, restaurants/kitchens, and reporting structure."
      >
        <ErrorState title="Unable to load organization" error={error} />
      </FeaturePageShell>
    );
  }

  return (
    <FeaturePageShell
      title="Organization"
      description="Company hierarchy, restaurants/kitchens, and reporting structure."
    >
      {stats.length ? <OrganizationStats stats={stats} /> : null}

      {companyTabs.length > 2 ? (
        <Tabs items={companyTabs} value={activeCompanyId} onChange={setActiveCompanyId} />
      ) : null}

      {Array.isArray(tree?.companies) && tree.companies.length ? (
        <OrganizationTree tree={tree} />
      ) : (
        <EmptyState
          title="Organization not available"
          description="No organization data is visible for this role scope."
        />
      )}
    </FeaturePageShell>
  );
}
