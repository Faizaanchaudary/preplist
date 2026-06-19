import { cn } from "../utils/cn";

export default function PageHeader({
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="break-words text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[34px]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl break-words text-sm leading-6 text-[var(--text-muted)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="w-full shrink-0 md:w-auto">{actions}</div> : null}
    </div>
  );
}
