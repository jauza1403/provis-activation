import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export type ScheduleRequest = {
  createdAt: string;
  activationDate: string;
  timeSlot: string;
  area: string;
  vendorName: string;
  accessMedia: string;
  customerContact: string;
  activationPic: string;
  vendorPic: string;
  projectPic: string;
  provisioningPic: string;
  oppNumber: string;
  customerName: string;
  siteId: string;
  subsId: string;
  siteName: string;
  woNumber: string;
  serviceType: string;
  workType: string;
  bandwidth: string;
  bandwidthIx: string;
  bandwidthIix: string;
  localLoop: string;
  customerPort: string;
  popOtbPort: string;
  odpFatPort: string;
  cableLength: string;
  popId: string;
  popName: string;
  devicePlan: string;
  switchPopPortAllocation: string;
  customerIp: string;
  buildType: string;
  cableType: string;
  endToEnd: string;
  fatOdpCode: string;
  fatCoordinates: string;
  attenuation: string;
  notes: string;
  pendingReason: string;
  rescheduleReason: string;
  status: string;
};

const SLOT_LABELS = ["TIME 1 (09.00)", "TIME 2 (11.00)", "TIME 3 (14.00)", "TIME 4 (16.00)"];
const DAYS = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

function dateText(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function dayText(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : DAYS[date.getUTCDay()] ?? "";
}

function timestampText(value: string) {
  const date = new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return value || "";
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")}`;
}

function rowFor(request: ScheduleRequest): string[] {
  const row = new Array<string>(67).fill("");
  row[1] = request.customerIp;
  row[8] = request.notes || request.rescheduleReason || request.pendingReason;
  row[9] = request.provisioningPic;
  row[10] = timestampText(request.createdAt);
  row[12] = dayText(request.activationDate);
  row[13] = dateText(request.activationDate);
  row[14] = SLOT_LABELS.indexOf(request.timeSlot) >= 0 ? SLOT_LABELS[SLOT_LABELS.indexOf(request.timeSlot)] : request.timeSlot;
  row[15] = request.area;
  row[16] = request.vendorName;
  row[17] = request.accessMedia;
  row[19] = request.customerContact;
  row[20] = request.vendorPic;
  row[21] = request.projectPic;
  row[22] = request.oppNumber;
  row[23] = request.customerName;
  row[24] = request.siteId;
  row[25] = request.subsId;
  row[26] = request.siteName;
  row[27] = request.woNumber;
  row[28] = request.serviceType;
  row[29] = request.workType;
  row[30] = request.bandwidthIx || request.bandwidth;
  row[31] = request.bandwidthIix;
  row[32] = request.localLoop;
  row[33] = request.customerPort;
  row[34] = request.popOtbPort;
  row[35] = request.odpFatPort;
  row[37] = request.cableLength;
  row[38] = request.popId;
  row[39] = request.popName;
  row[40] = request.devicePlan;
  row[41] = request.switchPopPortAllocation;
  row[42] = request.customerIp;
  row[43] = request.buildType;
  row[47] = request.cableType;
  row[48] = request.endToEnd;
  row[49] = request.odpFatPort;
  row[50] = request.fatOdpCode;
  row[51] = request.fatCoordinates;
  row[52] = request.attenuation;
  return row;
}

function xmlText(value: string) {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function cellXml(ref: string, style: string, value: string) {
  if (!value) return `<c r="${ref}" s="${style}"/>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
}

function columnName(index: number) {
  let n = index + 1;
  let out = "";
  while (n) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function templateRowStyles(sheetXml: string): string[] {
  const row = sheetXml.match(/<row[^>]*r="3"[^>]*>([\s\S]*?)<\/row>/)?.[1] ?? "";
  return Array.from({ length: 67 }, (_, index) => {
    const ref = `${columnName(index)}3`;
    return row.match(new RegExp(`<c[^>]*r="${ref}"[^>]*s="(\\d+)"`))?.[1] ?? "0";
  });
}

export async function exportWithScheduleTemplate(filename: string, requests: ScheduleRequest[]) {
  const response = await fetch("/SCHEDULE AKTIVATION.xlsx");
  if (!response.ok) throw new Error("Template SCHEDULE AKTIVATION.xlsx tidak dapat dimuat.");
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const sheetPath = "xl/worksheets/sheet1.xml";
  const sourceXml = strFromU8(archive[sheetPath]);
  const styles = templateRowStyles(sourceXml);
  const existingRows = Array.from(sourceXml.matchAll(/<row[^>]*\br="(\d+)"[^>]*>/g), (match) => Number(match[1]));
  const firstRow = Math.max(3, ...existingRows, 2) + 1;
  const rows = requests
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((request, index) => {
      const rowNumber = firstRow + index;
      const values = rowFor(request);
      const cells = values.map((value, column) => cellXml(`${columnName(column)}${rowNumber}`, styles[column], value)).join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");
  const sheetData = sourceXml.match(/<sheetData[\s\S]*?<\/sheetData>/)?.[0] ?? "<sheetData/>";
  const opening = sheetData.match(/^<sheetData[^>]*>/)?.[0] ?? "<sheetData>";
  const updatedSheetData = `${opening}${sheetData.slice(opening.length, -"</sheetData>".length)}${requests.length ? rows : ""}</sheetData>`;
  const lastRow = firstRow + requests.length - 1;
  let updatedXml = sourceXml.replace(sheetData, updatedSheetData);
  if (requests.length) updatedXml = updatedXml.replace(/<dimension ref="[^"]+"\/>/, `<dimension ref="A1:BO${lastRow}"/>`);
  archive[sheetPath] = strToU8(updatedXml);
  const bytes = zipSync(archive, { level: 6 });
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
