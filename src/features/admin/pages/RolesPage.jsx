import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import RoleTable from "../components/RoleTable";
import { useAdminRolesQuery } from "../api/useAdminQuery";

export default function RolesPage() {
  const { data, isLoading, isError, error } = useAdminRolesQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell
        title="Roles"
        description="Locked RBAC foundation for Super Admin, Executive Chef, Head Chef, Sous Chef, and Staff/User."
      >
        <ErrorState title="Unable to load roles" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data) {
    return (
      <FeaturePageShell
        title="Roles"
        description="Locked RBAC foundation for Super Admin, Executive Chef, Head Chef, Sous Chef, and Staff/User."
      >
        <ErrorState
          title="Roles unavailable"
          description="Role data was not returned by the server."
        />
      </FeaturePageShell>
    );
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <FeaturePageShell
      title="Roles"
      description="Locked RBAC foundation for Super Admin, Executive Chef, Head Chef, Sous Chef, and Staff/User."
    >
      {rows.length ? (
        <RoleTable rows={rows} />
      ) : (
        <EmptyState
          title="No roles available"
          description="Role permission data is not available right now."
        />
      )}
    </FeaturePageShell>
  );
}