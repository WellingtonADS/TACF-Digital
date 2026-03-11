export function downloadCSV(
  filename: string,
  rows: unknown[][],
  headers: string[],
) {
  const esc = (value: unknown) => {
    const normalized =
      value == null
        ? ""
        : typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(esc).join(","),
    ...rows.map((row) => row.map(esc).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
