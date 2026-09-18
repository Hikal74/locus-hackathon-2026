"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AdvisorTab = "chat" | "analysis";

interface AdvisorUiValue {
  open: boolean;
  tab: AdvisorTab;
  openDrawer: (tab?: AdvisorTab) => void;
  closeDrawer: () => void;
  setTab: (tab: AdvisorTab) => void;
}

const AdvisorUiContext = createContext<AdvisorUiValue | null>(null);

/** Ephemeral (non-persisted) open/tab state for the global advisor drawer — any page can call openDrawer(). */
export function AdvisorUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AdvisorTab>("chat");

  const openDrawer = useCallback((nextTab?: AdvisorTab) => {
    if (nextTab) setTab(nextTab);
    setOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, tab, openDrawer, closeDrawer, setTab }), [open, tab, openDrawer, closeDrawer]);

  return <AdvisorUiContext.Provider value={value}>{children}</AdvisorUiContext.Provider>;
}

export function useAdvisorUi(): AdvisorUiValue {
  const ctx = useContext(AdvisorUiContext);
  if (!ctx) throw new Error("useAdvisorUi must be used within an AdvisorUiProvider");
  return ctx;
}
