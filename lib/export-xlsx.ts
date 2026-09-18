/**
 * Minimal client-side .xlsx writer.
 *
 * Produces a real Office Open XML workbook (XLSX) without any dependency:
 * the package is a ZIP archive whose members we write "stored" (uncompressed),
 * which Excel, LibreOffice, and Google Sheets all open natively.
 */

export type ExportCell = string | number | boolean | null | undefined;

export type ExportSheet = {
  name: string;
  headers: string[];
  rows: ExportCell[][];
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
}

function cleanSheetName(name: string): string {
  return name.replace(/[\[\]:*?/\\]/g, "_").slice(0, 31);
}

function columnName(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cellXml(ref: string, value: ExportCell): string {
  if (value === null || value === undefined) return `<c r="${ref}"/>`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (typeof value === "number") return Number.isFinite(value) ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}"/>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function rowXml(index: number, cells: ExportCell[]): string {
  const inner = cells.map((cell, i) => cellXml(`${columnName(i)}${index + 1}`, cell)).join("");
  return `<row r="${index + 1}">${inner}</row>`;
}

function sheetXml(headers: string[], rows: ExportCell[][]): string {
  const width = Math.max(headers.length, ...rows.map((row) => row.length));
  const cols: string[] = [];
  for (let i = 0; i < width; i++) {
    let longest = (headers[i] ?? "").length;
    for (const row of rows) longest = Math.max(longest, String(row[i] ?? "").length);
    const wch = Math.min(60, Math.max(10, Math.ceil(longest * 1.15) + 2));
    cols.push(`<col min="${i + 1}" max="${i + 1}" width="${wch}" customWidth="1"/>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${cols.join("")}</cols>
  <sheetData>${rowXml(0, headers)}${rows.map((row, i) => rowXml(i + 1, row)).join("")}</sheetData>
</worksheet>`;
}

function workbookXml(sheetNames: string[]): string {
  const sheets = sheetNames
    .map((name, i) => `<sheet name="${escapeXml(cleanSheetName(name))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function workbookRels(sheetCount: number): string {
  const rels = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function contentTypesXml(sheetCount: number): string {
  const overrides = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides}
</Types>`;
}

function rootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;
}

// ---------------------------------------------------------------- CRC32 + ZIP

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(entries: { path: string; data: Uint8Array }[]): Uint8Array {
  const info = entries.map((entry) => ({
    name: new TextEncoder().encode(entry.path),
    crc: crc32(entry.data),
    len: entry.data.length,
    offset: 0,
  }));

  let size = 0;
  for (let i = 0; i < entries.length; i++) {
    info[i].offset = size;
    size += 30 + info[i].name.length + entries[i].data.length;
  }
  const cdStart = size;
  for (const item of info) size += 46 + item.name.length;
  const total = size + 22;
  const buf = new Uint8Array(total);
  const dv = new DataView(buf.buffer);
  let pos = 0;

  for (let i = 0; i < entries.length; i++) {
    const item = info[i];
    dv.setUint32(pos, 0x04034b50, true); pos += 4; // signature
    dv.setUint16(pos, 20, true); pos += 2; // version needed
    dv.setUint16(pos, 0, true); pos += 2; // flags
    dv.setUint16(pos, 0, true); pos += 2; // method: stored
    dv.setUint16(pos, 0, true); pos += 2; // mod time
    dv.setUint16(pos, 0x0021, true); pos += 2; // mod date
    dv.setUint32(pos, item.crc, true); pos += 4;
    dv.setUint32(pos, item.len, true); pos += 4; // compressed size
    dv.setUint32(pos, item.len, true); pos += 4; // uncompressed size
    dv.setUint16(pos, item.name.length, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // extra length
    buf.set(item.name, pos); pos += item.name.length;
    buf.set(entries[i].data, pos); pos += entries[i].data.length;
  }

  for (let i = 0; i < info.length; i++) {
    const item = info[i];
    dv.setUint32(pos, 0x02014b50, true); pos += 4; // central dir signature
    dv.setUint16(pos, 20, true); pos += 2; // version made by
    dv.setUint16(pos, 20, true); pos += 2; // version needed
    dv.setUint16(pos, 0, true); pos += 2; // flags
    dv.setUint16(pos, 0, true); pos += 2; // method
    dv.setUint16(pos, 0, true); pos += 2; // mod time
    dv.setUint16(pos, 0x0021, true); pos += 2; // mod date
    dv.setUint32(pos, item.crc, true); pos += 4;
    dv.setUint32(pos, item.len, true); pos += 4;
    dv.setUint32(pos, item.len, true); pos += 4;
    dv.setUint16(pos, item.name.length, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // extra
    dv.setUint16(pos, 0, true); pos += 2; // comment
    dv.setUint16(pos, 0, true); pos += 2; // disk start
    dv.setUint16(pos, 0, true); pos += 2; // internal attributes
    dv.setUint32(pos, 0, true); pos += 4; // external attributes
    dv.setUint32(pos, item.offset, true); pos += 4; // local header offset
    buf.set(item.name, pos); pos += item.name.length;
  }

  const cdSize = pos - cdStart;
  dv.setUint32(pos, 0x06054b50, true); pos += 4; // end of central dir
  dv.setUint16(pos, 0, true); pos += 2; // disk number
  dv.setUint16(pos, 0, true); pos += 2; // disk with cd
  dv.setUint16(pos, info.length, true); pos += 2; // entries on this disk
  dv.setUint16(pos, info.length, true); pos += 2; // total entries
  dv.setUint32(pos, cdSize, true); pos += 4; // cd size
  dv.setUint32(pos, cdStart, true); pos += 4; // cd offset
  dv.setUint16(pos, 0, true); pos += 2; // comment length

  return buf;
}

// ---------------------------------------------------------------- Public API

export function buildWorkbookBytes(sheets: ExportSheet[]): Uint8Array {
  const enc = new TextEncoder();
  const entries: { path: string; data: Uint8Array }[] = [
    { path: "[Content_Types].xml", data: enc.encode(contentTypesXml(sheets.length)) },
    { path: "_rels/.rels", data: enc.encode(rootRels()) },
    { path: "xl/workbook.xml", data: enc.encode(workbookXml(sheets.map((sheet) => sheet.name))) },
    { path: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels(sheets.length)) },
    { path: "xl/styles.xml", data: enc.encode(stylesXml()) },
  ];
  sheets.forEach((sheet, i) => {
    entries.push({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(sheet.headers, sheet.rows)),
    });
  });
  return buildZip(entries);
}

export function exportSheetToXlsx(filename: string, sheets: ExportSheet[]): void {
  const zip = buildWorkbookBytes(sheets);
  const blob = new Blob([zip.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}