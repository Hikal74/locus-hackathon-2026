"use client";

import { useAdvisorUi } from "./advisor-context";
import { ChatIcon } from "@/components/ui/icons";

/** Fixed bottom-right button, present on every route, that opens the global advisor drawer. */
export function AdvisorLauncher() {
  const { open, openDrawer } = useAdvisorUi();

  if (open) return null;

  return (
    <button
      type="button"
      onClick={() => openDrawer()}
      aria-label="Open AI advisor"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-ink text-on-primary shadow-[var(--shadow-raised)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-raised-hover)] hover:-translate-x-px hover:-translate-y-px active:shadow-[var(--shadow-pressed)] active:translate-x-[3px] active:translate-y-[3px] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
    >
      <ChatIcon width={24} height={24} />
    </button>
  );
}
