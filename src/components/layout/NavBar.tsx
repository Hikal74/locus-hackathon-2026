"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useProfile } from "@/lib/store/profile-context";

const STEPS = [
  { href: "/profile", label: "Profile" },
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/compare", label: "Compare" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/saved", label: "Saved" },
];

export function NavBar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-[var(--color-border)] bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Pathlight
        </Link>
        {profile && (
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {STEPS.map((step) => {
              const active = pathname === step.href;
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  className={cn(
                    "rounded-[var(--radius-pill)] px-3 py-1.5 transition-colors",
                    active ? "bg-primary text-on-primary" : "text-ink-soft hover:bg-surface"
                  )}
                >
                  {step.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
