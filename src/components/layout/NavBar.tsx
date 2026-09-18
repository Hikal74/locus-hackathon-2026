"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { href: "/", label: "Home" },
  { href: "/my-plan", label: "My Plan" },
  { href: "/universities", label: "Universities" },
  { href: "/compare", label: "Compare" },
  { href: "/roadmap", label: "Roadmap" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-[calc(env(safe-area-inset-top,0px)+12px)] z-30 px-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-pill)] border border-line bg-surface/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs">◆</span>
          Pathlight
        </Link>

        <nav className="flex flex-nowrap items-center gap-1 overflow-x-auto text-sm">
          {STEPS.map((step) => {
            const active = pathname === step.href || (step.href !== "/" && pathname.startsWith(`${step.href}/`));
            return (
              <Link
                key={step.href}
                href={step.href}
                className={cn(
                  "shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5 transition-colors",
                  active ? "bg-ink text-on-primary" : "text-ink-soft hover:text-ink"
                )}
              >
                {step.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
