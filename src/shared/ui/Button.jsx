import { cn } from "../utils/cn";

const VARIANTS = {
  primary:
    "bg-[var(--surface-strong)] text-white hover:opacity-95",
  secondary:
    "border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-soft)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-soft)]",
};

const SIZES = {
  sm: "min-h-[40px] rounded-[14px] px-3 py-2 text-xs sm:text-sm",
  md: "min-h-[44px] rounded-[16px] px-4 py-2.5 text-sm",
  lg: "min-h-[48px] rounded-[18px] px-5 py-3 text-sm sm:text-base",
};

export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20",
        fullWidth && "w-full",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}