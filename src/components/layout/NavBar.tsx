"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useProfile } from "@/lib/store/profile-context";

const STEPS = [
  { href: "/profile", label: "Profile" },
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/match", label: "Match" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/compare", label: "Compare" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/saved", label: "Saved" },
];

export function NavBar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Pathlight
        </Link>
        {profile && (
          <nav className="flex w-full flex-nowrap items-center gap-1 overflow-x-auto text-sm sm:w-auto sm:ml-auto">
            {STEPS.map((step) => {
              const active = pathname === step.href || (step.href !== "/" && pathname.startsWith(`${step.href}/`));
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  className={cn(
                    "shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 border-2 transition-colors",
                    active ? "border-ink bg-ink text-on-primary" : "border-transparent text-ink-soft hover:border-ink"
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
