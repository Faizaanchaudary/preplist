export default function PlanFeatureList({ features = [] }) {
  const rows = Array.isArray(features) ? features : [];

  return (
    <div className="mt-5 flex-1 space-y-2">
      {rows.length ? (
        rows.map((feature) => (
          <div
            key={feature}
            className="rounded-[16px] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {feature}
          </div>
        ))
      ) : (
        <div className="rounded-[16px] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-muted)]">
          No features listed.
        </div>
      )}
    </div>
  );
}
