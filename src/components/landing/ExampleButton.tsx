"use client";

import { useRouter } from "next/navigation";
import { ClayButton } from "@/components/clay/ClayButton";
import { useProfile } from "@/lib/store/profile-context";
import { sampleProfile } from "@/lib/data/sample-profile";

/** Judge mode entry point — loads a realistic filled profile and skips straight to the diagnosis. */
export function ExampleButton() {
  const { setProfile } = useProfile();
  const router = useRouter();

  return (
    <ClayButton
      variant="secondary"
      size="lg"
      onClick={() => {
        setProfile(sampleProfile);
        router.push("/diagnosis");
      }}
    >
      See an example
    </ClayButton>
  );
}
