type ClassValue = string | number | false | null | undefined;

/** Minimal className joiner — avoids pulling in clsx for one function. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
