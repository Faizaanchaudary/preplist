import { cn } from "../utils/cn";

export default function Tabs({
  items = [],
  value,
  onChange,
  className,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <div className="inline-flex min-w-max gap-2 rounded-[22px] border border-[var(--stroke-soft)] bg-white p-1.5">
        {safeItems.map((item) => {
          const isActive = item.value === value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange?.(item.value)}
              className={cn(
                "shrink-0 rounded-[16px] px-3 py-2 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm",
                isActive
                  ? "bg-[var(--surface-strong)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}