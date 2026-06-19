import { cn } from "../utils/cn";

export default function Select({
  options = [],
  className,
  ...props
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <select
      className={cn(
        "h-11 w-full rounded-[16px] border border-[var(--stroke-soft)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition-colors",
        "focus:border-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20",
        "sm:h-12 sm:rounded-[18px] sm:px-4",
        className
      )}
      {...props}
    >
      {safeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}