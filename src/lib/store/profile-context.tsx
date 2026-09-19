"use client";

import { createContext, useContext, ReactNode } from "react";
import type { StudentProfile } from "@/lib/data/types";
import { STORAGE_KEYS, useLocalStorageValue } from "./local-storage";

interface ProfileContextValue {
  /** undefined = hasn't checked localStorage yet; null = checked, confirmed no profile; object = loaded. */
  profile: StudentProfile | null | undefined;
  setProfile: (profile: StudentProfile) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Backfills required array fields a profile saved before they existed won't
 * have — reading `undefined.some(...)`/`.length` on a stale localStorage
 * profile throws at runtime otherwise. Single choke point so every consumer
 * (scoring, diagnosis, advisor prompt, roadmap) can keep treating these as
 * always-present arrays, matching how `interests`/`relevantSubjects` already work.
 */
function withDefaults(profile: StudentProfile): StudentProfile {
  return {
    ...profile,
    fieldWants: profile.fieldWants ?? [],
    standardizedExamsCompleted: profile.standardizedExamsCompleted ?? [],
    languageExamsCompleted: profile.languageExamsCompleted ?? [],
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [rawProfile, setProfileValue] = useLocalStorageValue<StudentProfile | null | undefined>(
    STORAGE_KEYS.profile,
    null,
    undefined
  );
  const profile = rawProfile ? withDefaults(rawProfile) : rawProfile;

  function setProfile(next: StudentProfile) {
    setProfileValue(next);
  }

  function clearProfile() {
    setProfileValue(null);
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
