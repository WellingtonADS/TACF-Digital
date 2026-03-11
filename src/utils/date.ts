export const formatDatePtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const getSemesterFromDate = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const month = d.getMonth() + 1;
    return month <= 6 ? "1" : "2";
  } catch {
    return null;
  }
};
