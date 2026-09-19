"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, CloseIcon, HeartIcon, MenuIcon } from "@/components/ui/icons";
import { PRIMARY_LINKS, TOOL_LINKS, isActivePath } from "@/components/layout/nav-links";
import { useProfile } from "@/lib/store/profile-context";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import { cn } from "@/lib/utils/cn";

type MenuName = "tools" | "mobile";

export function NavBar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { savedIds } = useSavedPrograms();
  // Remembering the path the menu was opened on closes it on navigation without an effect.
  const [menu, setMenu] = useState<{ name: MenuName; path: string } | null>(null);
  const openMenu = menu && menu.path === pathname ? menu.name : null;
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const toggle = (name: MenuName) => setMenu(openMenu === name ? null : { name, path: pathname });
  const toolsActive = TOOL_LINKS.some((t) => isActivePath(pathname, t.href));

  return (
    <header ref={headerRef} className="sticky top-[calc(env(safe-area-inset-top,0px)+12px)] z-30 px-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center gap-3 rounded-[var(--radius-pill)] border border-line bg-surface/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs">◆</span>
            Pathlight
          </Link>

          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 text-sm lg:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "rounded-[var(--radius-pill)] px-3.5 py-1.5 transition-colors",
                  isActivePath(pathname, link.href) ? "bg-ink text-on-primary" : "text-ink-soft hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              aria-expanded={openMenu === "tools"}
              aria-haspopup="menu"
              onClick={() => toggle("tools")}
              className={cn(
                "flex items-center gap-1 rounded-[var(--radius-pill)] px-3.5 py-1.5 transition-colors",
                toolsActive || openMenu === "tools" ? "bg-surface-raised text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              Tools
              <ChevronDownIcon width={14} height={14} className={cn("transition-transform", openMenu === "tools" && "rotate-180")} />
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/saved"
              aria-label={`Saved programs (${savedIds.length})`}
              aria-current={isActivePath(pathname, "/saved") ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm transition-colors",
                isActivePath(pathname, "/saved") ? "border-ink bg-ink text-on-primary" : "border-line text-ink-soft hover:border-ink hover:text-ink"
              )}
            >
              <HeartIcon width={15} height={15} filled={savedIds.length > 0} />
              <span className="tabular-nums">{savedIds.length}</span>
            </Link>

            {profile === null && (
              <Link href="/profile" className="hidden sm:block">
                <Button size="sm">Take the test</Button>
              </Link>
            )}
            {profile && (
              <Link href="/profile" className="hidden sm:block">
                <Button size="sm" variant="secondary">
                  Retake test
                </Button>
              </Link>
            )}

            <button
              type="button"
              aria-label={openMenu === "mobile" ? "Close menu" : "Open menu"}
              aria-expanded={openMenu === "mobile"}
              onClick={() => toggle("mobile")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            >
              {openMenu === "mobile" ? <CloseIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />}
            </button>
          </div>
        </div>

        {openMenu === "tools" && (
          <div
            role="menu"
            className="absolute left-4 top-[calc(100%+8px)] hidden w-[22rem] rounded-[var(--radius-lg)] border border-line bg-surface p-2 shadow-[0_16px_40px_rgba(0,0,0,0.6)] lg:block"
          >
            {TOOL_LINKS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                role="menuitem"
                className="block rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-surface-raised"
              >
                <span className="block text-sm font-semibold text-ink">{tool.label}</span>
                <span className="block text-xs text-ink-faint">{tool.body}</span>
              </Link>
            ))}
          </div>
        )}

        {openMenu === "mobile" && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[var(--radius-lg)] border border-line bg-surface p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)] lg:hidden">
            <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Your path</p>
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "block rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium",
                  isActivePath(pathname, link.href) ? "bg-ink text-on-primary" : "text-ink hover:bg-surface-raised"
                )}
              >
                {link.label}
              </Link>
            ))}
            <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">Tools</p>
            {TOOL_LINKS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="block rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-surface-raised">
                <span className="block text-sm font-medium text-ink">{tool.label}</span>
                <span className="block text-xs text-ink-faint">{tool.body}</span>
              </Link>
            ))}
            {profile !== undefined && (
              <Link href="/profile" className="mt-3 block">
                <Button className="w-full" variant={profile ? "secondary" : "primary"}>
                  {profile ? "Retake the test" : "Take the test"}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
