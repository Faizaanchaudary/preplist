export default function AuthHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

