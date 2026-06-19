import { cn } from "../utils/cn";

export default function Card({
  as: Component = "div",
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        "min-w-0 rounded-[28px] border border-[var(--stroke-soft)] bg-white shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
