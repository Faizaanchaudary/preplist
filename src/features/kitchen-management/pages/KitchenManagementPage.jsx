import { useState } from "react";
import Button from "../../../shared/ui/Button";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import useAuthStore from "../../../store/useAuthStore";
import KitchenCard from "../components/KitchenCard";
import KitchenFormModal from "../components/KitchenFormModal";
import { useKitchenManagementQuery } from "../api/useKitchenManagementQuery";

export default function KitchenManagementPage() {
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const canManageKitchens = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_KITCHENS)
  );
  const { data, isLoading, isError, error } = useKitchenManagementQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  const actions = canManageKitchens ? (
    <Button onClick={() => setIsKitchenModalOpen(true)}>Add kitchen</Button>
  ) : null;

  if (isError) {
    return (
      <>
        <FeaturePageShell
          title="Kitchen management"
          description="Kitchen-level visibility for sites, members, sections, and access-code usage."
          actions={actions}
        >
          <ErrorState title="Unable to load kitchens" error={error} />
        </FeaturePageShell>

        <KitchenFormModal
          open={isKitchenModalOpen}
          onClose={() => setIsKitchenModalOpen(false)}
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <FeaturePageShell
          title="Kitchen management"
          description="Kitchen-level visibility for sites, members, sections, and access-code usage."
          actions={actions}
        >
          <ErrorState
            title="Kitchens unavailable"
            description="Kitchen data was not returned by the server."
          />
        </FeaturePageShell>

        <KitchenFormModal
          open={isKitchenModalOpen}
          onClose={() => setIsKitchenModalOpen(false)}
        />
      </>
    );
  }

  const kitchens = Array.isArray(data.kitchens) ? data.kitchens : [];

  return (
    <>
      <FeaturePageShell
        title="Kitchen management"
        description="Kitchen-level visibility for sites, members, sections, and access-code usage."
        actions={actions}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {kitchens.map((kitchen) => (
            <KitchenCard
              key={kitchen.id}
              kitchen={kitchen}
              sectionCount={
                Array.isArray(kitchen.sections) ? kitchen.sections.length : 0
              }
              memberCount={
                Array.isArray(kitchen.members) ? kitchen.members.length : 0
              }
              codeCount={
                Array.isArray(kitchen.accessCodes) ? kitchen.accessCodes.length : 0
              }
            />
          ))}
        </div>
      </FeaturePageShell>

      <KitchenFormModal
        open={isKitchenModalOpen}
        onClose={() => setIsKitchenModalOpen(false)}
      />
    </>
  );
}
