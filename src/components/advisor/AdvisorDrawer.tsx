"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WarningIcon, SendIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { useProfile } from "@/lib/store/profile-context";
import { useMatchWeights } from "@/lib/store/match-weights";
import { useChatAdvisor } from "@/lib/ai/use-chat";
import { useAdvisorUi } from "./advisor-context";
import { AdvisorPanel } from "./AdvisorPanel";

const SUGGESTED_PROMPTS = [
  "What is Pathlight and how does matching work?",
  "What do the verification badges mean?",
  "What should I do next in my application timeline?",
];

function ChatTab() {
  const { profile } = useProfile();
  const { result } = useMatchWeights();
  const resolvedProfile = profile ?? null;
  const { messages, status, errorMessage, send, retry, clear } = useChatAdvisor(resolvedProfile, result.weights);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const loading = status === "loading";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, status]);

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || loading) return;
    setDraft("");
    send(trimmed);
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              Ask anything — about a specific university in our database, your own matches, or how Pathlight works.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-left text-sm text-ink hover:bg-surface-raised"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-ink text-on-primary" : "border border-line bg-surface text-ink"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[var(--radius-md)] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-faint">
                Thinking…
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-surface p-3">
              <p className="flex items-start gap-2 text-sm text-ink">
                <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
                {errorMessage ?? "Something went wrong."}
              </p>
              <Button variant="secondary" size="sm" onClick={retry} className="self-start">
                Retry
              </Button>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <button type="button" onClick={clear} className="mt-4 text-xs text-ink-faint underline underline-offset-2">
            Clear conversation
          </button>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-line px-4 py-3 sm:px-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask the advisor…"
          rows={1}
          className="max-h-28 flex-1 resize-none rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:shadow-[var(--ring-focus)] focus-visible:border-ink"
        />
        <Button onClick={submit} disabled={loading || !draft.trim()} aria-label="Send" size="sm" className="shrink-0">
          <SendIcon width={16} height={16} />
        </Button>
      </div>
    </div>
  );
}

function AnalysisTab() {
  const { profile } = useProfile();
  if (!profile) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm text-ink-soft">Full Analysis needs your profile first.</p>
        <Badge tone="neutral" className="self-start">
          Complete /profile to unlock this
        </Badge>
      </div>
    );
  }
  return <AdvisorPanel profile={profile} />;
}

/** Mounted once at the root layout — available on every route, including the profile-less landing page. */
export function AdvisorDrawer() {
  const { open, tab, setTab, closeDrawer } = useAdvisorUi();
  const { profile } = useProfile();

  return (
    <Drawer open={open} onClose={closeDrawer} title="AI Advisor">
      <div className="flex h-full flex-col">
        <div className="px-4 pt-3 sm:px-5">
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as "chat" | "analysis")}
            items={[
              { value: "chat", label: "Chat" },
              { value: "analysis", label: "Full analysis" },
            ]}
          />
        </div>
        <div className="min-h-0 flex-1">
          {tab === "chat" ? (
            <ChatTab />
          ) : (
            <div className="h-full overflow-y-auto">
              <AnalysisTab key={profile ? "loaded" : "empty"} />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
