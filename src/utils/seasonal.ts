import { isWithinInterval, parseISO } from "date-fns";

// Allowed season windows (inclusive): Feb 1 - May 31; Sep 1 - Nov 30
export const SEASONS: Array<{ start: string; end: string }> = [
  { start: "02-01", end: "05-31" },
  { start: "09-01", end: "11-30" },
];

export function isDateInAllowedWindow(date: Date): boolean {
  const year = date.getFullYear();
  return SEASONS.some((s) => {
    const start = parseISO(`${year}-${s.start}`);
    const end = parseISO(`${year}-${s.end}`);
    return isWithinInterval(date, { start, end });
  });
}
