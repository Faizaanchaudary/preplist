import { cn } from "../utils/cn";

export default function Input({
  type = "text",
  className,
  inputClassName,
  rightSlot,
  ...props
}) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <input
        type={type}
        className={cn(
          "h-11 w-full min-w-0 rounded-[16px] border border-[var(--stroke-soft)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)]",
          "focus:border-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20",
          "sm:h-12 sm:rounded-[18px] sm:px-4",
          rightSlot ? "pr-11 sm:pr-12" : "",
          inputClassName
        )}
        {...props}
      />

      {rightSlot ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
          {rightSlot}
        </div>
      ) : null}
    </div>
  );
}