import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import Button from "./Button";
import { cn } from "../utils/cn";

export default function ActionMenu({
  items = [],
  align = "right",
  ariaLabel = "Open row actions",
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const hasItems = safeItems.length > 0;

  function closeMenu() {
    setIsOpen(false);
  }

  if (!hasItems) return null;

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 justify-center px-0"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-[190px] overflow-hidden rounded-[18px] border border-[var(--stroke-soft)] bg-white p-1 shadow-[var(--shadow-card)]",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          {safeItems.map((item, index) => {
            const label = item?.label ?? "";
            const disabled = Boolean(item?.disabled);
            const tone = item?.tone ?? "default";

            return (
              <button
                key={item?.key ?? label ?? index}
                type="button"
                role="menuitem"
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-start rounded-[14px] px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20",
                  disabled
                    ? "cursor-not-allowed text-[var(--text-muted)] opacity-60"
                    : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]",
                  tone === "danger" && !disabled
                    ? "text-red-600 hover:bg-red-50"
                    : ""
                )}
                onClick={() => {
                  if (disabled) return;
                  closeMenu();
                  item?.onClick?.();
                }}
              >
                <span className="min-w-0 truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
