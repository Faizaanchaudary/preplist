export default function RecipeStepsList({ steps = [] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Method
      </h4>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="flex gap-3 rounded-[16px] bg-[var(--surface-soft)] px-4 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--text-primary)]">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-[var(--text-primary)]">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}