import { describe, expect, it } from "vitest";
import { buildDeadlineTimeline, buildIcs, daysUntil, isEstimatedLabel, splitByToday, toLocalIsoDate } from "./deadlines";
import { testProgram, testUniversity } from "./test-fixtures";
import type { Recommendation } from "./types";

const rec = (id: string, uniName: string, deadlines: { label: string; date: string }[]): Recommendation => ({
  program: { ...testProgram, id, deadlines },
  university: { ...testUniversity, name: uniName },
  fitScore: 80,
  factors: [],
  whyItFits: [],
  watchOut: [],
});

describe("isEstimatedLabel", () => {
  it("flags labels the dataset itself calls typical or unconfirmed", () => {
    expect(isEstimatedLabel("Application window (typical, unconfirmed)")).toBe(true);
    expect(isEstimatedLabel("Expected decision date")).toBe(true);
  });

  it("does not flag firm-looking labels", () => {
    expect(isEstimatedLabel("Regular Decision")).toBe(false);
  });
});

describe("buildDeadlineTimeline", () => {
  it("merges deadlines across programs and sorts soonest first", () => {
    const timeline = buildDeadlineTimeline([
      rec("a", "Alpha U", [{ label: "Regular", date: "2027-03-01" }]),
      rec("b", "Beta U", [
        { label: "Early", date: "2026-11-01" },
        { label: "Regular", date: "2027-01-15" },
      ]),
    ]);
    expect(timeline.map((e) => e.date)).toEqual(["2026-11-01", "2027-01-15", "2027-03-01"]);
  });

  it("breaks date ties by university name for a stable order", () => {
    const timeline = buildDeadlineTimeline([
      rec("b", "Beta U", [{ label: "Regular", date: "2027-01-01" }]),
      rec("a", "Alpha U", [{ label: "Regular", date: "2027-01-01" }]),
    ]);
    expect(timeline.map((e) => e.universityName)).toEqual(["Alpha U", "Beta U"]);
  });

  it("marks estimated dates and carries university/program context", () => {
    const [entry] = buildDeadlineTimeline([rec("a", "Alpha U", [{ label: "Window (typical, unconfirmed)", date: "2027-03-15" }])]);
    expect(entry.estimated).toBe(true);
    expect(entry.universityName).toBe("Alpha U");
    expect(entry.programId).toBe("a");
  });

  it("returns nothing for programs without deadlines", () => {
    expect(buildDeadlineTimeline([rec("a", "Alpha U", [])])).toEqual([]);
  });
});

describe("daysUntil / splitByToday", () => {
  it("counts whole calendar days, negative when passed", () => {
    expect(daysUntil("2026-10-01", "2026-09-19")).toBe(12);
    expect(daysUntil("2026-09-19", "2026-09-19")).toBe(0);
    expect(daysUntil("2026-08-01", "2026-09-19")).toBe(-49);
  });

  it("is not thrown off by a DST-change month", () => {
    expect(daysUntil("2027-03-29", "2027-03-01")).toBe(28);
  });

  it("treats a deadline today as upcoming, and earlier ones as passed", () => {
    const timeline = buildDeadlineTimeline([
      rec("a", "Alpha U", [
        { label: "Old", date: "2026-08-01" },
        { label: "Today", date: "2026-09-19" },
        { label: "Later", date: "2027-01-01" },
      ]),
    ]);
    const { upcoming, passed } = splitByToday(timeline, "2026-09-19");
    expect(passed.map((e) => e.label)).toEqual(["Old"]);
    expect(upcoming.map((e) => e.label)).toEqual(["Today", "Later"]);
  });
});

describe("toLocalIsoDate", () => {
  it("formats using the local calendar date with zero padding", () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("buildIcs", () => {
  const now = new Date("2026-09-19T10:30:00.000Z");
  const [entry] = buildDeadlineTimeline([rec("prog-1", "Alpha U", [{ label: "Regular Decision", date: "2027-01-15" }])]);

  it("produces a well-formed calendar with CRLF line endings", () => {
    const ics = buildIcs([entry], now);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("writes an all-day event ending the next day", () => {
    const ics = buildIcs([entry], now);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270115");
    expect(ics).toContain("DTEND;VALUE=DATE:20270116");
    expect(ics).toContain("DTSTAMP:20260919T103000Z");
  });

  it("rolls DTEND over month and year boundaries", () => {
    const [dec31] = buildDeadlineTimeline([rec("p", "Alpha U", [{ label: "Regular", date: "2026-12-31" }])]);
    expect(buildIcs([dec31], now)).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("labels estimated dates in the title so they're never mistaken for confirmed", () => {
    const [est] = buildDeadlineTimeline([rec("p", "Alpha U", [{ label: "Window (typical)", date: "2027-03-01" }])]);
    expect(buildIcs([est], now)).toContain("(estimated date)");
  });

  it("escapes commas, semicolons, and backslashes in text fields", () => {
    const [tricky] = buildDeadlineTimeline([rec("p", "Tech, State; U", [{ label: "Early", date: "2027-03-01" }])]);
    expect(buildIcs([tricky], now)).toContain("SUMMARY:Tech\\, State\\; U — Early");
  });

  it("folds lines longer than 75 octets and never splits them without a leading space", () => {
    const [long] = buildDeadlineTimeline([rec("p", "A".repeat(120), [{ label: "Regular", date: "2027-03-01" }])]);
    const lines = buildIcs([long], now).split("\r\n");
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
  });

  it("gives every event a unique UID", () => {
    const timeline = buildDeadlineTimeline([
      rec("a", "Alpha U", [
        { label: "Early", date: "2026-11-01" },
        { label: "Regular", date: "2027-01-01" },
      ]),
    ]);
    const uids = buildIcs(timeline, now).match(/^UID:.*$/gm) ?? [];
    expect(new Set(uids).size).toBe(2);
  });
});
