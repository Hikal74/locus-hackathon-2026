export interface NavLink {
  href: string;
  label: string;
}

export interface ToolLink extends NavLink {
  body: string;
}

/** The student's journey, in the order they'd use it. Home is the logo. */
export const PRIMARY_LINKS: NavLink[] = [
  { href: "/universities", label: "Universities" },
  { href: "/compare", label: "Compare" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/deadlines", label: "Deadlines" },
];

/** Standalone helpers that don't need a profile — grouped so the top bar stays short. */
export const TOOL_LINKS: ToolLink[] = [
  { href: "/vibe-check", label: "Professor Vibe Check", body: "Teaching style, from reviews you paste" },
  { href: "/essay-coach", label: "Essay Coach", body: "Feedback on your draft — never a rewrite" },
  { href: "/interview", label: "Interview practice", body: "Answer real questions, get feedback" },
  { href: "/translate", label: "De-Bureaucratizer", body: "Dense admissions text in plain English" },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
