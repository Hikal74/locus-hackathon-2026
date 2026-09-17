"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/store/profile-context";
import type { StudentProfile } from "@/lib/data/types";

/**
 * Redirects to /profile once we've CONFIRMED there's no profile (profile === null) —
 * not while still loading (profile === undefined), since that transitional value is
 * what server-render and the first client paint both see before localStorage has been
 * checked. Acting on it directly would fire the redirect a beat too early. See
 * docs/BUILDER_JOURNAL.md for how this was found (a real hydration race, not flakiness).
 */
export function RequireProfile({ children }: { children: (profile: StudentProfile) => React.ReactNode }) {
  const { profile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (profile === null) router.replace("/profile");
  }, [profile, router]);

  if (!profile) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-faint">Loading your profile…</div>;
  }

  return <>{children(profile)}</>;
}
