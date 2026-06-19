import PageTransition from "../../app/layouts/PageTransition";
import Card from "./Card";
import PageHeader from "./PageHeader";

export default function FeaturePageShell({
  title,
  description,
  actions,
  children,
}) {
  return (
    <PageTransition>
      <section className="space-y-5">
        <PageHeader title={title} description={description} actions={actions} />
        {children ? (
          children
        ) : (
          <Card className="p-6 sm:p-8">
            <div className="rounded-[24px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-6">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Production scaffold is ready for this module.
              </p>
            </div>
          </Card>
        )}
      </section>
    </PageTransition>
  );
}