"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/lib/store/profile-context";
import { sampleProfile } from "@/lib/data/sample-profile";

/** Judge mode entry point — loads a realistic filled profile and skips straight to the diagnosis. */
export function ExampleButton({ compact = false }: { compact?: boolean }) {
  const { setProfile } = useProfile();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size={compact ? "sm" : "lg"}
      onClick={() => {
        setProfile(sampleProfile);
        router.push("/diagnosis");
      }}
    >
      See how it works
    </Button>
  );
}
