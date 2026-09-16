import { env } from "cloudflare:workers";
import { slots } from "@/lib/scheduling";

const DEFAULT_SHEET_ID = "1e_Tjv5bM2gGHfCAbDHMtO3jcMOQ-hSRJYW4bYL97xAo";
const DEFAULT_SHEET_GID = 1251673368;

const SCHEDULE_HEADERS = [
  "100.70.175.80", "IP", "AGING", "PLAN AKTIVASI DATE", "REVISI PAD",
  "Sales", "DATEK", "Reason Time Slot", "UPDATE REMARK", "PIC PROVIS",
  "Timestamp", "Email Address", "HARI", "TANGGAL AKTIVASI", "TIME SLOT AKTIVASI",
  "AREA / REGIONAL", "VENDOR", "AKSES", "BUKTI KORDINASI DENGAN CUSTOMER",
  "NAMA & NO TELP PIC CUSTOMER DI LOKASI", "PIC AKTIVASI MITRA (VENDOR)", "PIC PROJECT IFORTE",
  "OPPORTUNITY NUMBER", "NAMA CUSTOMER / ACCOUNT NAME", "SITE ID", "SUBSCRIPTION ID",
  "SITE NAME / LOCATION NAME", "WORK ORDER", "PRODUK LAYANAN", "WORK TYPE",
  "BANDWIDTH IX", "BANDWIDTH IIX", "BANDWIDTH LOCAL LOOP", "PORT CUSTOMER",
  "PORT POP OTB", "PORT ODP 1:8", "PORT ODP 1:4", "NEW PANJANG KABEL",
  "POP ID", "POP NAME", "PERANGKAT YANG AKAN PASANG", "ALOKASI PORT SWITCH POP",
  "IP CUSTOMER", "BUILD NEW 1: 8", "BUILD NEW 1:4", "EXISTING 1:8",
  "EXISTING 1: 4", "TYPE KABEL", "END TO END", "PORT ODP/FAT",
  "KODE ODP/FAT", "KOORDINAST FAT", "REDAMAN ODP/FAT", "Detail Jam onsite",
  "Merged Doc ID - rfa", "Merged Doc URL - rfa", "Link to merged Doc - rfa",
  "Document Merge Status - rfa", "Merged Doc ID - RFA", "Merged Doc URL - RFA",
  "Link to merged Doc - RFA", "Document Merge Status - RFA",
];

const SLOT_LABELS = ["TIME 1 (09.00)", "TIME 2 (11.00)", "TIME 3 (14.00)", "TIME 4 (16.00)"];

const DAYS_INDO = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface ScheduleSource {
  id: string;
  createdAt: string;
  activationDate: string;
  timeSlot: string;
  area: string;
  vendorName: string;
  accessMedia: string;
  workType: string;
  customerName: string;
  siteId: string;
  subsId: string;
  oppNumber: string;
  woNumber: string;
  devicePlan: string;
  popId: string;
  popName: string;
  cableLength: string;
  cableType: string;
  fatOdpCode: string;
  endToEnd: string;
  attenuation: string;
  customerPort: string;
  popOtbPort: string;
  projectPic: string;
  vendorPic: string;
  provisioningPic: string;
}

function wibDateTime(iso: string): string {
  const date = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  const dmy = [
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    date.getUTCFullYear(),
  ].join("/");
  const hms = [
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
  ].join(":");
  return `${dmy} ${hms}`;
}

function isoToDmy(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function indonesianDay(date: string): string {
  return DAYS_INDO[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "";
}

function sheetSlot(slot: string): string {
  const index = slots.indexOf(slot);
  return index >= 0 ? SLOT_LABELS[index] : slot;
}

export function buildScheduleSheetRow(source: ScheduleSource): string[] {
  const row = new Array<string>(SCHEDULE_HEADERS.length).fill("");
  row[9] = source.provisioningPic; // J: PIC PROVIS
  row[10] = wibDateTime(source.createdAt); // K: Timestamp
  row[12] = indonesianDay(source.activationDate); // M: HARI
  row[13] = isoToDmy(source.activationDate); // N: TANGGAL AKTIVASI
  row[14] = sheetSlot(source.timeSlot); // O: TIME SLOT AKTIVASI
  row[15] = source.area; // P: AREA / REGIONAL
  row[16] = source.vendorName; // Q: VENDOR
  row[17] = source.accessMedia; // R: AKSES
  row[20] = source.vendorPic; // U: PIC AKTIVASI MITRA (VENDOR)
  row[21] = source.projectPic; // V: PIC PROJECT IFORTE
  row[22] = source.oppNumber; // W: OPPORTUNITY NUMBER
  row[23] = source.customerName; // X: NAMA CUSTOMER / ACCOUNT NAME
  row[24] = source.siteId; // Y: SITE ID
  row[25] = source.subsId; // Z: SUBSCRIPTION ID
  row[27] = source.woNumber; // AB: WORK ORDER
  row[29] = source.workType; // AD: WORK TYPE
  row[33] = source.customerPort; // AH: PORT CUSTOMER
  row[34] = source.popOtbPort; // AI: PORT POP OTB
  row[37] = source.cableLength; // AL: NEW PANJANG KABEL
  row[38] = source.popId; // AM: POP ID
  row[39] = source.popName; // AN: POP NAME
  row[40] = source.devicePlan; // AO: PERANGKAT YANG AKAN PASANG
  row[47] = source.cableType; // AV: TYPE KABEL
  row[48] = source.endToEnd; // AW: END TO END
  row[50] = source.fatOdpCode; // AY: KODE ODP/FAT
  row[52] = source.attenuation; // BA: REDAMAN ODP/FAT
  return row;
}

function base64url(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlJson(value: unknown): string {
  return base64url(JSON.stringify(value));
}

async function importPrivateKey(pem: string) {
  const body = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlJson({ alg: "RS256", typ: "JWT" });
  const claims = base64urlJson({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: account.token_uri ?? "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  });
  const unsigned = `${header}.${claims}`;
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google returned no access token.");
  return data.access_token;
}

interface SheetInfo {
  title: string;
  rowCount: number;
}

async function resolveSheetInfo(token: string, sheetId: string, gid: number): Promise<SheetInfo> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties(sheetId,title,gridProperties(rowCount))`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`Sheet metadata request failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as
    | { sheets?: { properties?: { sheetId?: number; title?: string; gridProperties?: { rowCount?: number } } }[] }
    | undefined;
  const target = data?.sheets?.find((sheet) => sheet.properties?.sheetId === gid);
  const sheet = target ?? data?.sheets?.[0];
  return {
    title: sheet?.properties?.title ?? "Sheet1",
    rowCount: sheet?.properties?.gridProperties?.rowCount ?? 1000,
  };
}

interface WriteTarget {
  row: number;
  needsInsert: boolean;
}

function parseTimestamp(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    const ms = (value - 25569) * 86400000;
    return Number.isFinite(ms) ? ms : null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2}):(\d{2})$/);
  if (match) {
    const date = new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    );
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  const generic = Date.parse(text);
  return Number.isNaN(generic) ? null : generic;
}

async function readColumn(token: string, sheetId: string, title: string, range: string): Promise<(string | number | null)[][]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(`'${title.replace(/'/g, "''")}'!${range}`)}?majorDimension=ROWS`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`Sheet read failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { values?: (string | number | null)[][] } | undefined;
  return data?.values ?? [];
}

async function findWriteTarget(token: string, sheetId: string, title: string, rowCount: number): Promise<WriteTarget> {
  const stamps = await readColumn(token, sheetId, title, `K1:K${rowCount}`);
  let bestRow = -1;
  let bestTime = -1;
  for (let index = 1; index < stamps.length; index++) {
    const time = parseTimestamp(stamps[index]?.[0]);
    if (time != null && time >= bestTime) {
      bestTime = time;
      bestRow = index + 1;
    }
  }
  if (bestRow > 0 && bestRow + 1 <= rowCount) {
    return { row: bestRow + 1, needsInsert: true };
  }

  const colA = await readColumn(token, sheetId, title, `A1:A${rowCount}`);
  let last = colA.length;
  for (let index = colA.length - 1; index >= 0; index--) {
    const cell = colA[index]?.[0];
    if (cell != null && String(cell).trim() !== "") {
      last = index + 1;
      break;
    }
  }
  return { row: Math.max(last + 1, 2), needsInsert: false };
}

async function insertRow(token: string, sheetId: string, gid: number, startIndex: number) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            insertDimension: {
              range: { sheetId: gid, dimension: "ROWS", startIndex, endIndex: startIndex + 1 },
              inheritFromBefore: false,
            },
          },
        ],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Sheet insert failed: ${response.status} ${await response.text()}`);
  }
}

export async function appendNewRequestToScheduleSheet(source: ScheduleSource): Promise<void> {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return;
  let account: ServiceAccount;
  try {
    account = JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    return;
  }
  if (!account.client_email || !account.private_key) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.");
    return;
  }
  const token = await getAccessToken(account);
  const sheetId = env.GOOGLE_SCHEDULE_SHEET_ID ?? DEFAULT_SHEET_ID;
  const gid = Number(env.GOOGLE_SCHEDULE_SHEET_GID ?? DEFAULT_SHEET_GID);
  const { title, rowCount } = await resolveSheetInfo(token, sheetId, gid);
  const target = await findWriteTarget(token, sheetId, title, rowCount);
  if (target.needsInsert) await insertRow(token, sheetId, gid, target.row - 1);
  const range = `'${title.replace(/'/g, "''")}'!A${target.row}`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [buildScheduleSheetRow(source)] }),
    },
  );
  if (!response.ok) {
    throw new Error(`Sheets write failed: ${response.status} ${await response.text()}`);
  }
}