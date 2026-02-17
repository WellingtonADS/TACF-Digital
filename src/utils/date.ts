export function formatISO(date?: Date) {
  const d = date ?? new Date();
  return d.toISOString();
}

export default { formatISO };
