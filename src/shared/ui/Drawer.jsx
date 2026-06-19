import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../utils/cn";

export default function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close drawer overlay"
            className="absolute inset-0 bg-[#101217]/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 36 }}
            className={cn(
              "absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-[var(--stroke-soft)] bg-white px-6 py-6 shadow-[var(--shadow-card)]",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title ? (
                  <h3 className="break-words text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {title}
                  </h3>
                ) : null}
                {description ? (
                  <p className="mt-1 break-words text-sm leading-6 text-[var(--text-muted)]">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)]"
                aria-label="Close drawer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
