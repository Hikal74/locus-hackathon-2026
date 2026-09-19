import Link from "next/link";
import { PRIMARY_LINKS, TOOL_LINKS } from "@/components/layout/nav-links";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs">◆</span>
            Pathlight
          </Link>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            A personalized route to university: which programs fit you, why, and what to do next.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Explore</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-soft transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/saved" className="text-ink-soft transition-colors hover:text-ink">
                Saved programs
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Tools">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Tools</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {TOOL_LINKS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="text-ink-soft transition-colors hover:text-ink">
                  {tool.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line-soft">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-faint sm:px-6">
          Fit scores are preference matches, never admission probabilities. Program facts carry a verification status —
          always confirm details with each university before you apply.
        </p>
      </div>
    </footer>
  );
}
