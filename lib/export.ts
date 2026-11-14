/**
 * Export helpers: CSV (RFC 4180-ish) and XLSX.
 *
 * Every cell is passed through `escapeFormulaValue` before it is written, so
 * a value starting with =, +, - or @ can never be interpreted as a formula
 * by Excel / LibreOffice / Google Sheets.
 */

import { ReportColumn, ReportRow } from "./reports";

/**
 * UTF-8 byte order mark.
 *
 * Excel assumes the system ANSI code page for a .csv file unless it sees a
 * BOM, which mangles non-ASCII characters (e.g. "₹", "é", "—"). Prefixing
 * the file with U+FEFF forces Excel to read it as UTF-8.
 */
export const UTF8_BOM = "\uFEFF";

/**
 * Neutralise spreadsheet formula injection.
 *
 * A leading apostrophe forces the cell to be treated as text. Characters
 * that can start a formula are =, +, -, @ (and the control chars \t, \r).
 * We also guard against leading whitespace before the trigger character,
 * which some parsers strip before evaluating.
 */
export function escapeFormulaValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  const str = String(value);
  if (str.length === 0) return str;

  // Leading whitespace/control characters can be trimmed by spreadsheet apps
  // before the formula check, so normalise them for the check.
  const probe = str.replace(/^[\s\u0000-\u001f]+/, "");
  if (/^[=+\-@]/.test(probe)) {
    return `'${str}`;
  }
  // Leading tab / CR can also be used to smuggle a formula.
  if (/^[\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/** Escape a single CSV field (quoting + formula protection). */
export function escapeCsvField(value: string | number | null | undefined): string {
  const safe = escapeFormulaValue(value);
  if (safe === "") return "";
  // Quote when the value contains a delimiter, quote or newline.
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Build a CSV document from a report.
 *
 * The result starts with a UTF-8 BOM so Excel detects the encoding.
 *
 * @param columns Column definitions (order and labels).
 * @param rows Report rows.
 * @param title Optional title line prepended above the header.
 * @param totalRow Optional summary row appended at the very bottom.
 */
export function buildCsv(
  columns: ReportColumn[],
  rows: ReportRow[],
  title?: string,
  totalRow?: ReportRow
): string {
  const lines: string[] = [];

  if (title) {
    lines.push(escapeCsvField(title));
    lines.push("");
  }

  lines.push(columns.map((c) => escapeCsvField(c.label)).join(","));

  for (const row of rows) {
    lines.push(
      columns.map((c) => escapeCsvField(row[c.key] ?? "")).join(",")
    );
  }

  // The TOTAL row always sits at the bottom of the report.
  if (totalRow) {
    lines.push(
      columns.map((c) => escapeCsvField(totalRow[c.key] ?? "")).join(",")
    );
  }

  // Excel prefers CRLF line endings.
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}

/**
 * Apply text wrapping to the cells of a row whose column is marked
 * `wrap: true` (Notes, Remarks, Customer Response, ...).
 */
function applyWrap(row: any, columns: ReportColumn[]) {
  columns.forEach((col, index) => {
    if (!col.wrap) return;
    const cell = row.getCell(index + 1);
    cell.alignment = { ...(cell.alignment || {}), wrapText: true, vertical: "top" };
  });
}

/**
 * Build an XLSX workbook buffer from a report using exceljs.
 * Returns a Node Buffer suitable for a Response body.
 */
export async function buildXlsx(
  columns: ReportColumn[],
  rows: ReportRow[],
  title?: string,
  totalRow?: ReportRow
): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lead CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Report");

  // Compute the width of every column up front so each one can be declared
  // explicitly. Declaring the columns (instead of setting the width on the
  // implicit columns created by addRow) guarantees that EVERY column gets a
  // width — including columns whose cells are all empty.
  const widths = columns.map((col) => {
    const headerLength = col.label.length;
    const maxCell = rows.reduce((max, row) => {
      const value = row[col.key];
      return Math.max(max, value === null || value === undefined ? 0 : String(value).length);
    }, 0);
    // Minimum 10, maximum 40 characters.
    return Math.min(Math.max(headerLength + 2, maxCell + 2, 10), 40);
  });

  // Declare the columns (key + width) so every column exists up front.
  sheet.columns = columns.map((col, index) => ({
    key: col.key,
    width: widths[index],
  }));

  if (title) {
    const titleRow = sheet.addRow([escapeFormulaValue(title)]);
    titleRow.font = { bold: true, size: 13 };
    sheet.mergeCells(titleRow.number, 1, titleRow.number, Math.max(columns.length, 1));
  }

  const headerRow = sheet.addRow(columns.map((c) => escapeFormulaValue(c.label)));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.alignment = { vertical: "middle" };

  // The actual row index of the header (2 when a title row is present).
  const headerRowIndex = headerRow.number;

  for (const row of rows) {
    const added = sheet.addRow(
      columns.map((c) => {
        const raw = row[c.key];
        if (typeof raw === "number") return raw;
        return escapeFormulaValue(raw ?? "");
      })
    );
    applyWrap(added, columns);
  }

  // The TOTAL row always sits at the bottom of the report.
  if (totalRow) {
    const totalExcelRow = sheet.addRow(
      columns.map((c) => {
        const raw = totalRow[c.key];
        if (typeof raw === "number") return raw;
        return escapeFormulaValue(raw ?? "");
      })
    );
    totalExcelRow.font = { bold: true };
    totalExcelRow.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
    };
    applyWrap(totalExcelRow, columns);
  }

  // Re-apply the widths: addRow() can create implicit columns that are not
  // part of the declared set, so make sure every column has one.
  columns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = widths[index];
  });

  sheet.views = [{ state: "frozen", ySplit: headerRowIndex }];
  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Build a filesystem-safe file name from a report label + range label. */
export function buildFileName(base: string, rangeLabel: string, extension: string): string {
  const safe = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `${safe(base)}-${safe(rangeLabel)}.${extension}`;
}
