export const formatDate = (d?: string | Date) => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("pt-BR");
};

export default { formatDate };
