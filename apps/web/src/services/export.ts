export type ExportFormat = "csv" | "excel";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportReport(
  filename: string,
  headers: string[],
  rows: unknown[][],
  format: ExportFormat,
) {
  const content =
    format === "csv"
      ? `\uFEFF${[headers, ...rows]
          .map((row) => row.map(escapeCsv).join(","))
          .join("\r\n")}`
      : `\uFEFF<table><thead><tr>${headers
          .map((header) => `<th>${escapeHtml(header)}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`;
  const blob = new Blob([content], {
    type:
      format === "csv"
        ? "text/csv;charset=utf-8"
        : "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${format === "csv" ? "csv" : "xls"}`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
