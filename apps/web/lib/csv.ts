// A spreadsheet treats a cell that starts with = + - @ (or a tab or return) as a
// formula. A provider could register a business name like =HYPERLINK(...) and
// have it run when an admin opens the export. Putting a single quote in front
// makes the spreadsheet treat the cell as plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

export function toCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  if (typeof value === "string" && FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
}
