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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileValue] = useLocalStorageValue<StudentProfile | null | undefined>(
    STORAGE_KEYS.profile,
    null,
    undefined
  );

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
