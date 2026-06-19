import { Check } from "lucide-react";
import { cn } from "../utils/cn";

export default function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  className,
  label,
  id,
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex min-w-0 cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span className="relative inline-flex">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-[7px] border transition-colors",
            checked
              ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-white"
              : "border-[var(--stroke-soft)] bg-white text-transparent"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </span>

      {label ? (
        <span className="min-w-0 flex-1 break-words text-sm text-[var(--text-primary)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
