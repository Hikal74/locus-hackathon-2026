"use client";

import { useCallback, useState } from "react";
import type { StudentProfile } from "@/lib/data/types";
import type { FactorKey } from "@/lib/engine/types";
import { STORAGE_KEYS, useLocalStorageValue } from "@/lib/store/local-storage";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  programId: string;
  universityName: string;
  programName: string;
  universityWebsiteUrl: string;
}

type ChatStatus = "idle" | "loading" | "error";

const NO_MESSAGES: ChatMessage[] = [];

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Drives the global advisor drawer's Chat tab. Messages persist to
 * localStorage (closing the known "history lost on reload" gap the
 * structured advisor still has) and survive navigation, since the hook is
 * only ever instantiated once, at the root layout.
 */
export function useChatAdvisor(profile: StudentProfile | null, weights?: Record<FactorKey, number>) {
  const [messages, setMessages] = useLocalStorageValue<ChatMessage[]>(
    STORAGE_KEYS.advisorChat,
    NO_MESSAGES,
    NO_MESSAGES
  );
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatSource[]>([]);

  const postMessages = useCallback(
    async (list: ChatMessage[]) => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            weights,
            messages: list.map(({ role, content }) => ({ role, content })),
          }),
        });

        const data: unknown = await res.json().catch(() => null);

        if (!res.ok || !data || typeof data !== "object") {
          const message =
            data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Something went wrong. Please try again.";
          setStatus("error");
          setErrorMessage(message);
          return;
        }

        const { reply, sources: nextSources } = data as { reply: string; sources: ChatSource[] };
        setMessages([...list, { id: makeId(), role: "assistant", content: reply }]);
        setSources(nextSources ?? []);
        setStatus("idle");
      } catch {
        setStatus("error");
        setErrorMessage("Couldn't reach the AI advisor. Check your connection and try again.");
      }
    },
    [profile, weights, setMessages]
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const next = [...messages, { id: makeId(), role: "user" as const, content: trimmed }];
      setMessages(next);
      void postMessages(next);
    },
    [messages, setMessages, postMessages]
  );

  const retry = useCallback(() => {
    void postMessages(messages);
  }, [messages, postMessages]);

  const clear = useCallback(() => {
    setMessages(NO_MESSAGES);
    setStatus("idle");
    setErrorMessage(null);
    setSources([]);
  }, [setMessages]);

  return { messages, status, errorMessage, sources, send, retry, clear };
}
