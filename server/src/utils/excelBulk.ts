import ExcelJS from "exceljs";

export type ExcelColumn = { key: string; header: string };

export async function buildTemplateBuffer(columns: ExcelColumn[], exampleRow: Record<string, string | number>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Plantilla");
  sheet.columns = columns.map((c) => ({ key: c.key, header: c.header, width: 22 }));
  sheet.addRow(exampleRow);
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

/** Reads the first worksheet, mapping columns by header text (case-insensitive). Returns raw string rows. */
export async function parseWorkbookRows(buffer: Buffer, columns: ExcelColumn[]): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const colIndexByKey = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.value ?? "").trim().toLowerCase();
    const match = columns.find((c) => c.header.toLowerCase() === text);
    if (match) colIndexByKey.set(match.key, colNumber);
  });

  const rows: Record<string, string>[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const values: Record<string, string> = {};
    let hasContent = false;
    for (const col of columns) {
      const colIndex = colIndexByKey.get(col.key);
      const raw = colIndex ? row.getCell(colIndex).value : null;
      const str = raw === null || raw === undefined ? "" : String(raw).trim();
      if (str) hasContent = true;
      values[col.key] = str;
    }
    if (hasContent) rows.push(values);
  }

  return rows;
}
