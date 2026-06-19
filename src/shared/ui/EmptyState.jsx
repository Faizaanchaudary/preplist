import { cn } from "../utils/cn";
import Card from "./Card";

export default function EmptyState({
  title,
  description,
  children,
  className,
}) {
  return (
    <Card className={cn("p-6 sm:p-8", className)}>
      <div className="rounded-[24px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-6 text-center">
        {title ? (
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </p>
        ) : null}

        {description ? (
          <p className={cn("text-sm leading-6 text-[var(--text-muted)]", title ? "mt-2" : "")}>
            {description}
          </p>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </Card>
  );
}
