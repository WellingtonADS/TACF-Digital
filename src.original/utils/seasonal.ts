import { isWithinInterval, parseISO } from "date-fns";

// Allowed season windows (inclusive) with semester tag
export const SEASONS: Array<{
  start: string;
  end: string;
  semester: "1" | "2";
}> = [
  { start: "02-01", end: "05-31", semester: "1" },
  { start: "09-01", end: "11-30", semester: "2" },
];

export function isDateInAllowedWindow(date: Date): boolean {
  const year = date.getFullYear();
  return SEASONS.some((s) => {
    const start = parseISO(`${year}-${s.start}`);
    const end = parseISO(`${year}-${s.end}`);
    return isWithinInterval(date, { start, end });
  });
}

export function getCurrentSemester(): "1" | "2" {
  const now = new Date();
  const year = now.getFullYear();

  const activeSeason = SEASONS.find((s) => {
    const start = parseISO(`${year}-${s.start}`);
    const end = parseISO(`${year}-${s.end}`);
    return isWithinInterval(now, { start, end });
  });

  // Se estivermos fora das janelas, retorna o semestre mais próximo (jan-jun -> 1, jul-dez -> 2)
  if (!activeSeason) {
    return now.getMonth() < 6 ? "1" : "2";
  }

  return activeSeason.semester;
}
