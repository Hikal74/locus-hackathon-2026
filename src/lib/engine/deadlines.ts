import type { Recommendation } from "./types";

export interface DeadlineEntry {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  label: string;
  programId: string;
  programName: string;
  universityName: string;
  country: string;
  websiteUrl: string;
  /** The dataset labels some dates "typical" / "unconfirmed" — those are estimates, and the UI must say so. */
  estimated: boolean;
}

const ESTIMATE_PATTERN = /unconfirmed|typical|estimated|approx|tentative|expected/i;

export function isEstimatedLabel(label: string): boolean {
  return ESTIMATE_PATTERN.test(label);
}

/** Every known deadline for the given matches, soonest first. Ties broken by university then label for a stable order. */
export function buildDeadlineTimeline(recommendations: Recommendation[]): DeadlineEntry[] {
  const entries: DeadlineEntry[] = recommendations.flatMap((rec) =>
    rec.program.deadlines.map((d, i) => ({
      id: `${rec.program.id}::${i}`,
      date: d.date,
      label: d.label,
      programId: rec.program.id,
      programName: rec.program.name,
      universityName: rec.university.name,
      country: rec.university.country,
      websiteUrl: rec.university.websiteUrl,
      estimated: isEstimatedLabel(d.label),
    }))
  );
  return entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.universityName.localeCompare(b.universityName) || a.label.localeCompare(b.label)
  );
}

function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

const MS_PER_DAY = 86_400_000;

/** Whole days from `todayIso` to `dateIso` (negative = already passed). Works on calendar dates, so timezones can't shift it. */
export function daysUntil(dateIso: string, todayIso: string): number {
  return Math.round((isoToUtcMs(dateIso) - isoToUtcMs(todayIso)) / MS_PER_DAY);
}

export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function splitByToday(entries: DeadlineEntry[], todayIso: string): { upcoming: DeadlineEntry[]; passed: DeadlineEntry[] } {
  return {
    upcoming: entries.filter((e) => e.date >= todayIso),
    passed: entries.filter((e) => e.date < todayIso),
  };
}

// ---- iCalendar (.ics) export ----------------------------------------------------------------

function compactDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function nextDayIso(iso: string): string {
  return new Date(isoToUtcMs(iso) + MS_PER_DAY).toISOString().slice(0, 10);
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines are folded at 75 octets; continuation lines start with a single space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74; // continuation lines lose one octet to the leading space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function dtstamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** All-day events on each deadline. Estimated dates say so in the title so they're never mistaken for confirmed ones. */
export function buildIcs(entries: DeadlineEntry[], now: Date): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pathlight//Deadlines//EN", "CALSCALE:GREGORIAN"];
  for (const e of entries) {
    const summary = `${e.universityName} — ${e.label}${e.estimated ? " (estimated date)" : ""}`;
    const description = `${e.programName}. ${
      e.estimated ? "This date is an estimate — confirm it with the university. " : "Confirm on the university website before relying on it. "
    }${e.websiteUrl}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id.replace(/[^A-Za-z0-9:_-]/g, "-")}@pathlight`,
      `DTSTAMP:${dtstamp(now)}`,
      `DTSTART;VALUE=DATE:${compactDate(e.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDayIso(e.date))}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
