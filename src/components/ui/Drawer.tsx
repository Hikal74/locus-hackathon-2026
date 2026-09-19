import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { CloseIcon } from "./icons";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Right-side slide-in panel, full height, full-width overlay on mobile.
 * No portal/focus-trap library — a plain fixed-position panel is enough
 * for this app's needs and keeps the dependency count at zero.
 */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 transition-[visibility] duration-200",
        open ? "visible" : "invisible pointer-events-none"
      )}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-200",
          open ? "opacity-60" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[420px] bg-paper border-l border-line",
          "flex flex-col transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {footer && <div className="border-t border-line px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}
