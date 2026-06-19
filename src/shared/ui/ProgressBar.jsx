import { cn } from "../utils/cn";

export default function ProgressBar({
  value = 0,
  max = 100,
  className,
  trackClassName,
  barClassName,
}) {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]",
          trackClassName
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-[var(--surface-strong)] transition-[width] duration-300 ease-out",
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}