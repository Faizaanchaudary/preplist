import { cn } from "../utils/cn";

const VARIANTS = {
  neutral: "bg-[var(--surface-soft)] text-[var(--text-primary)]",
  success: "bg-[var(--success-soft)] text-[var(--success-strong)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning-strong)]",
  dark: "bg-[var(--surface-strong)] text-white",
};

export default function Badge({
  children,
  variant = "neutral",
  className,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}