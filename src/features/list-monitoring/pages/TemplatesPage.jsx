import { useState } from "react";
import Button from "../../../shared/ui/Button";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import useAuthStore from "../../../store/useAuthStore";
import { useTemplatesQuery } from "../api/useListMonitoringQuery";
import TemplateApplyModal from "../components/TemplateApplyModal";
import TemplateCard from "../components/TemplateCard";
import TemplateFormModal from "../components/TemplateFormModal";

export default function TemplatesPage() {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState(null);
  const canManageLists = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MANAGE_LISTS)
  );

  const { data, isLoading, isError, error } = useTemplatesQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  const actions = canManageLists ? (
    <Button onClick={() => setIsTemplateModalOpen(true)}>Create template</Button>
  ) : null;

  const modal = canManageLists ? (
    <>
      <TemplateFormModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
      <TemplateApplyModal
        open={Boolean(applyTemplate)}
        template={applyTemplate}
        onClose={() => setApplyTemplate(null)}
      />
    </>
  ) : null;

  if (isError) {
    return (
      <>
        <FeaturePageShell
          title="Templates"
          description="Reusable prep templates that can be applied during manual list creation."
          actions={actions}
        >
          <ErrorState title="Unable to load templates" error={error} />
        </FeaturePageShell>
        {modal}
      </>
    );
  }

  if (!data) {
    return (
      <>
        <FeaturePageShell
          title="Templates"
          description="Reusable prep templates that can be applied during manual list creation."
          actions={actions}
        >
          <ErrorState
            title="Templates unavailable"
            description="Template data was not returned by the server."
          />
        </FeaturePageShell>
        {modal}
      </>
    );
  }

  const templates = Array.isArray(data.templates) ? data.templates : [];

  return (
    <>
      <FeaturePageShell
        title="Templates"
        description="Reusable prep templates that can be applied during manual list creation."
        actions={actions}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onApply={canManageLists ? setApplyTemplate : null}
            />
          ))}
        </div>
      </FeaturePageShell>
      {modal}
    </>
  );
}
