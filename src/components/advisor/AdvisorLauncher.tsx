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
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-ink bg-ink text-on-primary shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
    >
      <ChatIcon width={24} height={24} />
    </button>
  );
}
