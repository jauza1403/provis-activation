import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activationRequests } from "@/db/schema";
import { ensureActivationRequestsTable, getSessionUser } from "@/lib/auth";

import { candidateSlots, SLOT_CAPACITY } from "@/lib/scheduling";
const VALID_REGION_SCOPES = new Set(["jabo", "jabojabar", "regional"]);
const NO_RFA_ACCESS_MEDIA = new Set(["Interkoneksi", "Existing Link"]);
const NO_IP_SERVICE_TYPES = new Set([
  "MWIFO - FO - Internet Service - Broadband Up To",
  "MWIFO - GSM - Internet Service - Dedicated - M2M",
  "VSAT - VSAT - Internet Service - Dedicated",
  "MWIFO - Wireless - BOD Internet Skyfiber",
]);
function normalizeRegionScope(area: string) {
  const value = area.trim().toLowerCase();
  if (value.includes("jabo") && value.includes("jabar")) return "jabojabar";
  if (value.includes("jawa barat") || value.includes("jabojabar")) return "jabojabar";
  if (value.includes("jakarta") || value === "jabo" || value.includes("jabodetabek")) return "jabo";
  return "regional";
}
function requestRegion(row: { regionScope?: string; area: string }) {
  return String(row.regionScope || normalizeRegionScope(row.area)).trim().toLowerCase();
}
function capacity(date: string, slot: string, excludeId = "") {
  return sql`(SELECT count(*) FROM activation_requests WHERE activation_date = ${date} AND time_slot = ${slot} AND status != 'Completed' AND id != ${excludeId}) < ${SLOT_CAPACITY}`;
}
function picCapacity(pic: string, excludeId = "") {
  return sql`(SELECT count(*) FROM activation_requests WHERE provisioning_pic = ${pic} AND status != 'Completed' AND id != ${excludeId}) < 7`;
}
function validSchedule(date: string, slot: string, now = getWibClock()) {
  const nowMinutes = now.hour * 60 + now.minute;
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    && !Number.isNaN(Date.parse(date))
    && new Date(date).toISOString().slice(0, 10) === date
    && candidateSlots(slot).length > 0
    && (date > now.date || (date === now.date && nowMinutes >= slotStartMinutes(slot)));
}
function activationDay(date: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long" })
    .format(new Date(`${date}T00:00:00+07:00`));
}
const fullResponse = () => NextResponse.json({ error: "Slot yang dipilih dan slot berikutnya penuh. Pilih slot sebelumnya atau tanggal lain." }, { status: 409 });
const required = [
  "email", "activationDate", "timeSlot", "area", "vendorName",
  "accessMedia", "serviceType", "customerName", "siteId", "subsId", "oppNumber", "woNumber",
  "workType", "customerContact", "activationPic", "siteName",
  "bandwidthIx", "bandwidthIix", "localLoop", "coordinationProof",
  "devicePlan", "projectPic", "vendorPic", "provisioningPic",
] as const;

const rfaFields = [
  "popId", "popName", "cableLength", "cableType", "endToEnd",
  "attenuation", "customerPort", "popOtbPort", "switchPopPortAllocation",
  "odpFatPort", "fatCoordinates",
] as const;

const editable = [...required, ...rfaFields, "buildType", "fatOdpCode", "notes", "rescheduleReason", "picRescheduleReason"] as const;

function createApprovalCode() {
  return `URG-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function getWibClock(date = new Date()) {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    date: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

const allowedStatus = ["Idle", "Request Approval", "On Progress", "Completed", "Reschedule", "Pending"];
const CUTOFF_HOUR = 17;

function slotStartMinutes(timeSlot: string) {
  const match = timeSlot.match(/^(\d{2})\.(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export async function GET(request: Request) {
  try {
    await ensureActivationRequestsTable();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }
    const db = getDb();
    const allRows = await db
      .select()
      .from(activationRequests)
      .orderBy(desc(activationRequests.createdAt));
    let rows = allRows;
    if (user.role === "vendor_user") {
      const vendor = user.vendorName.trim().toLowerCase();
      const region = String(user.regionScope ?? "").trim().toLowerCase();
      rows = vendor && VALID_REGION_SCOPES.has(region)
        ? rows.filter((row) => row.vendorName.trim().toLowerCase() === vendor && requestRegion(row) === region)
        : [];
    }
    const now = getWibClock();
    const nowMinutes = now.hour * 60 + now.minute;
    const normalized = rows.map((row) => {
      let status = allowedStatus.includes(row.status) ? row.status : "Idle";
      const reachedStart =
        row.activationDate < now.date ||
        (row.activationDate === now.date && nowMinutes >= slotStartMinutes(row.timeSlot));
      if (row.approvalStatus === "Waiting Approval" && status !== "Completed") status = "Request Approval";
      if (row.approvalStatus !== "Waiting Approval" && !String(row.rescheduleApprovalStatus || "").startsWith("Pending") && ["Idle", "Reschedule"].includes(status) && reachedStart) status = "On Progress";
      return status === row.status ? row : { ...row, status };
    });
    const changed = normalized.filter((row, index) => row.status !== rows[index].status);
    if (changed.length) {
      await Promise.all(
        changed.map((row) =>
          db.update(activationRequests)
            .set({ status: row.status })
            .where(eq(activationRequests.id, row.id)),
        ),
      );
    }
    const picCounts = allRows.reduce((counts, row) => {
      if (row.status !== "Completed") counts[row.provisioningPic] = (counts[row.provisioningPic] ?? 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    const slotCounts = allRows.reduce((counts, row) => {
      if (row.status !== "Completed") {
        const key = `${row.activationDate}|${row.timeSlot}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);
    return NextResponse.json({ requests: normalized, picCounts, slotCounts, serverNow: now });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Cloudflare D1 binding") || message.includes("DB is unavailable")) {
      return NextResponse.json({ requests: [] }, { status: 200 });
    }
    console.error("request-list-failed", error);
    return NextResponse.json(
      { error: "Data request belum dapat dimuat." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureActivationRequestsTable();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }
    const wibNow = getWibClock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as any;
    const vendorName = user.role === "vendor_user" ? user.vendorName.trim() : String(body.vendorName ?? "").trim();
    const regionScope = user.role === "vendor_user"
      ? String(user.regionScope ?? "").trim().toLowerCase()
      : normalizeRegionScope(String(body.area ?? ""));
    if (user.role === "vendor_user" && (!vendorName || !VALID_REGION_SCOPES.has(regionScope))) {
      return NextResponse.json({ error: "Identitas vendor atau region akun tidak valid." }, { status: 403 });
    }
    const missing = required.find((key) => !String(body[key] ?? "").trim());
    const needsRfa = !NO_RFA_ACCESS_MEDIA.has(String(body.accessMedia));
    const missingRfa = needsRfa && rfaFields.find((key) => !String(body[key] ?? "").trim());
    const needsIp = needsRfa && !NO_IP_SERVICE_TYPES.has(String(body.serviceType ?? "").trim());
    const missingIp = needsIp && !String(body.customerIp ?? "").trim();
    const needsBuildType = ["METRO", "GPON"].includes(String(body.accessMedia ?? "").trim().toUpperCase());
    const missingBuildType = needsRfa && needsBuildType && !String(body.buildType ?? "").trim();
    const missingSwitchData = Boolean(body.installSwitch) && (
      !String(body.switchBrand ?? "").trim() || !String(body.vlanSwitch ?? "").trim()
    );
    if (
      missing ||
      missingRfa ||
      missingIp ||
      missingBuildType ||
      missingSwitchData ||
      (needsRfa && (!Number.isInteger(Number(body.rfaCores)) || Number(body.rfaCores) < 1))
    ) {
      return NextResponse.json(
        { error: "Mohon lengkapi seluruh data wajib." },
        { status: 400 },
      );
    }
    if (!validSchedule(body.activationDate, body.timeSlot)) return NextResponse.json({ error: "Tanggal atau slot tidak valid." }, { status: 400 });
    const isUrgent = body.requestType === "Urgent";
    const screenshotUrl = String(body.screenshotUrl ?? "").trim();
    if (isUrgent && !screenshotUrl) return NextResponse.json({ error: "Mohon lampirkan screenshot untuk request urgent." }, { status: 400 });
    if (!isUrgent && wibNow.hour >= CUTOFF_HOUR) {
      return NextResponse.json(
        { error: "Pengajuan request reguler sudah tutup (setelah pukul 17:00 WIB). Gunakan Request Urgent." },
        { status: 403 },
      );
    }
    const row = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      deadline: `${wibNow.date}T23:59`,
      activationDate: body.activationDate,
      activationDay: activationDay(body.activationDate),
      timeSlot: body.timeSlot,
      email: String(body.email ?? "").trim().toLowerCase(),
      area: body.area.trim(),
      vendorName,
      regionScope,
      accessMedia: body.accessMedia,
      serviceType: body.serviceType,
      workType: String(body.workType ?? "").trim(),
      isRelocation: Boolean(body.isRelocation),
      isRelayout: Boolean(body.isRelayout),
      customerName: body.customerName.trim(),
      customerContact: String(body.customerContact ?? "").trim(),
      activationPic: String(body.activationPic ?? "").trim(),
      siteId: body.siteId.trim().toUpperCase(),
      subsId: body.subsId.trim().toUpperCase(),
      siteName: String(body.siteName ?? "").trim(),
      oppNumber: body.oppNumber.trim(),
      woNumber: body.woNumber.trim(),
      devicePlan: body.devicePlan.trim(),
      installSwitch: Boolean(body.installSwitch),
      switchBrand: body.installSwitch ? String(body.switchBrand ?? "").trim() : "",
      vlanSwitch: body.installSwitch ? String(body.vlanSwitch ?? "").trim() : "",
      switchPopPortAllocation: needsRfa ? String(body.switchPopPortAllocation ?? "").trim() : "",
      customerIp: needsRfa ? String(body.customerIp ?? "").trim() : "",
      buildType: needsRfa ? String(body.buildType ?? "").trim() : "",
      rfaCores: needsRfa ? Number(body.rfaCores) : 0,
      popAllocation: "",
      popId: needsRfa ? String(body.popId ?? "").trim().toUpperCase() : "",
      popName: needsRfa ? String(body.popName ?? "").trim() : "",
      cableLength: needsRfa ? String(body.cableLength ?? "").trim() : "",
      cableType: needsRfa ? String(body.cableType ?? "").trim() : "",
      fatOdpCode: String(body.fatOdpCode ?? "").trim().toUpperCase(),
      endToEnd: needsRfa ? String(body.endToEnd ?? "").trim() : "",
      attenuation: needsRfa ? String(body.attenuation ?? "").trim() : "",
      customerPort: needsRfa ? String(body.customerPort ?? "").trim() : "",
      popOtbPort: needsRfa ? String(body.popOtbPort ?? "").trim() : "",
      odpFatPort: needsRfa ? String(body.odpFatPort ?? "").trim() : "",
      fatCoordinates: needsRfa ? String(body.fatCoordinates ?? "").trim() : "",
      bandwidth: [body.bandwidthIx, body.bandwidthIix].map((value) => String(value ?? "").trim()).filter(Boolean).join(" / "),
      bandwidthIx: String(body.bandwidthIx ?? "").trim(),
      bandwidthIix: String(body.bandwidthIix ?? "").trim(),
      localLoop: String(body.localLoop ?? "").trim(),
      coordinationProof: String(body.coordinationProof ?? "").trim(),
      projectPic: body.projectPic.trim(),
      vendorPic: body.vendorPic.trim(),
      provisioningPic: body.provisioningPic,
      status: isUrgent ? "Request Approval" : "Idle",
      completedAt: "",
      pendingReason: "",
      requestType: isUrgent ? "Urgent" : "Regular",
      approvalStatus: isUrgent ? "Waiting Approval" : "Not Required",
      approvalCode: isUrgent ? createApprovalCode() : "",
      approvedAt: "",
      whatsappMessageId: "",
      notes: String(body.notes ?? "").trim(),
      screenshotUrl,
    };
    const picAvailable = await getDb().all(sql`SELECT 1 WHERE ${picCapacity(row.provisioningPic)}`);
    if (!picAvailable.length) return NextResponse.json({ error: "PIC Provisioning sudah mencapai batas 7 request aktif." }, { status: 409 });
    const columns = getTableColumns(activationRequests);
    for (const slot of candidateSlots(row.timeSlot)) {
      row.timeSlot = slot;
      const entries = Object.entries(row) as [keyof typeof row, string | number | boolean][];
      const names = sql.join(entries.map(([key]) => sql.identifier(columns[key].name)), sql`, `);
      const values = sql.join(entries.map(([, value]) => sql`${typeof value === "boolean" ? Number(value) : value}`), sql`, `);
      // One statement makes capacity enforcement atomic across concurrent submissions.
      const inserted = await getDb().all(sql`INSERT INTO activation_requests (${names}) SELECT ${values} WHERE ${capacity(row.activationDate, slot)} AND ${picCapacity(row.provisioningPic)} RETURNING id`);
      if (inserted.length) return NextResponse.json({ request: row }, { status: 201 });
    }
    return fullResponse();
  } catch (error) {
    console.error("request-create-failed", error);
    return NextResponse.json(
      { error: "Request gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureActivationRequestsTable();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as any;
    if (!body.id) {
      return NextResponse.json(
        { error: "ID request tidak ditemukan." },
        { status: 400 },
      );
    }
    const db = getDb();
    const [current] = await db.select().from(activationRequests).where(eq(activationRequests.id, body.id));
    if (!current) return NextResponse.json({ error: "Request tidak ditemukan." }, { status: 404 });
    if (body.rescheduleDecision) {
      if (!['Approved', 'Rejected'].includes(body.rescheduleDecision) || !String(body.rescheduleApprovalReason ?? '').trim()) {
        return NextResponse.json({ error: "Keputusan dan alasan reschedule wajib diisi." }, { status: 400 });
      }
      const approvalStatus = String(current.rescheduleApprovalStatus || '');
      const vendorApproval = approvalStatus === 'Pending PIC Approval';
      const receiverAllowed = vendorApproval
        ? user.role === 'superuser' || user.role === 'project_user'
        : false;
      if (!receiverAllowed) return NextResponse.json({ error: "Anda tidak memiliki izin untuk memproses reschedule ini." }, { status: 403 });
      const proposedDate = String(body.activationDate ?? (vendorApproval ? current.vendorRescheduleDate : current.picRescheduleDate));
      const proposedSlot = String(body.timeSlot ?? (vendorApproval ? current.vendorRescheduleTimeSlot : current.picRescheduleTimeSlot));
      const decisionUpdate: Record<string, string> = {
        rescheduleApprovalStatus: body.rescheduleDecision,
        rescheduleApprovalReason: String(body.rescheduleApprovalReason).trim(),
        rescheduleApprovedBy: user.username,
        rescheduleApprovedAt: new Date().toISOString(),
        status: body.rescheduleDecision === 'Approved' ? 'Idle' : (current.rescheduleOriginalStatus || current.status),
      };
      if (body.rescheduleDecision === 'Approved') {
        if (!validSchedule(proposedDate, proposedSlot)) return NextResponse.json({ error: "Tanggal atau slot reschedule tidak valid." }, { status: 400 });
        const [updated] = await db.update(activationRequests)
          .set({ ...decisionUpdate, activationDate: proposedDate, timeSlot: proposedSlot })
          .where(and(eq(activationRequests.id, body.id), capacity(proposedDate, proposedSlot, body.id)))
          .returning();
        if (!updated) return fullResponse();
        return NextResponse.json({ request: updated });
      }
      const [updated] = await db.update(activationRequests).set(decisionUpdate).where(eq(activationRequests.id, body.id)).returning();
      return NextResponse.json({ request: updated });
    }
    if (["Pending PIC Approval", "Pending Vendor Approval"].includes(String(current.rescheduleApprovalStatus || ""))) {
      return NextResponse.json({ error: "Request sedang menunggu approval reschedule." }, { status: 409 });
    }
    if (body.rescheduleUrgent) {
      if (current.approvalStatus !== "Waiting Approval") {
        return NextResponse.json({ error: "Request ini tidak berada dalam antrean approval urgent." }, { status: 400 });
      }
      if (user.role === "vendor_user") {
        return NextResponse.json({ error: "Vendor tidak memiliki izin untuk mengubah jadwal request urgent." }, { status: 403 });
      }
      const date = String(body.activationDate ?? "").trim();
      const requestedSlot = String(body.timeSlot ?? "").trim();
      if (!validSchedule(date, requestedSlot)) {
        return NextResponse.json({ error: "Tanggal atau slot belum dibuka atau tidak valid." }, { status: 400 });
      }
      for (const slot of candidateSlots(requestedSlot)) {
        const [updated] = await db.update(activationRequests)
          .set({ activationDate: date, timeSlot: slot, activationDay: activationDay(date) })
          .where(and(eq(activationRequests.id, body.id), capacity(date, slot, body.id)))
          .returning();
        if (updated) return NextResponse.json({ request: updated });
      }
      return fullResponse();
    }
    if (body.status && !allowedStatus.includes(body.status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }
    if (body.approvalStatus && !["Waiting Approval", "Approved", "Not Required"].includes(body.approvalStatus)) {
      return NextResponse.json({ error: "Status approval tidak valid." }, { status: 400 });
    }
    if (body.approvalStatus === "Approved") {
      if (user.role !== "superuser") {
        return NextResponse.json(
          { error: "Akses ditolak. Hanya Superuser yang dapat menyetujui request urgent." },
          { status: 403 },
        );
      }
      console.info(
        `[AUDIT] Urgent request ${body.id} approved by Superuser: ${user.username} (${user.name}) at ${new Date().toISOString()}`,
      );
    }
    const update: Record<string, string | number | boolean> = {};
    if (body.status) {
      update.status = body.status;
      update.completedAt = body.status === "Completed" ? new Date().toISOString() : "";
    }
    if (body.approvalStatus === "Approved") {
      update.approvalStatus = "Approved";
      update.approvedAt = new Date().toISOString();
      update.status = "On Progress";
    } else if (body.approvalStatus) {
      update.approvalStatus = body.approvalStatus;
    }
    if (typeof body.pendingReason === "string") update.pendingReason = body.pendingReason.trim();
    if (body.provisioningPic) update.provisioningPic = body.provisioningPic;
    if (typeof body.notes === "string") update.notes = body.notes.trim();
    if (typeof body.screenshotUrl === "string") update.screenshotUrl = body.screenshotUrl.trim();
    if (typeof body.isRelocation === "boolean") update.isRelocation = body.isRelocation;
    if (typeof body.isRelayout === "boolean") update.isRelayout = body.isRelayout;
    if (typeof body.installSwitch === "boolean") {
      if (body.installSwitch && (
        !String(body.switchBrand ?? "").trim() || !String(body.vlanSwitch ?? "").trim()
      )) {
        return NextResponse.json({ error: "Silakan pilih merek dan isi VLAN switch yang akan dipasang." }, { status: 400 });
      }
      update.installSwitch = body.installSwitch;
      update.switchBrand = body.installSwitch ? String(body.switchBrand).trim() : "";
      update.vlanSwitch = body.installSwitch ? String(body.vlanSwitch).trim() : "";
    }
    const skipsRfa = NO_RFA_ACCESS_MEDIA.has(String(body.accessMedia));
    const nextAccessMedia = String(body.accessMedia ?? current.accessMedia).trim().toUpperCase();
    if (!skipsRfa && ["METRO", "GPON"].includes(nextAccessMedia) && !String(body.buildType ?? current.buildType ?? "").trim()) {
      return NextResponse.json({ error: "Pilih jenis build atau existing untuk Metro/GPON." }, { status: 400 });
    }
    for (const key of editable) {
      if (body[key] === undefined) continue;
      const value = String(body[key] ?? "").trim();
      if (!["notes", "fatOdpCode", "workType"].includes(key) && !rfaFields.includes(key as typeof rfaFields[number]) && !value) {
        return NextResponse.json({ error: "Mohon lengkapi seluruh data wajib." }, { status: 400 });
      }
      if (rfaFields.includes(key as typeof rfaFields[number]) && !skipsRfa && !value) {
        return NextResponse.json({ error: "Mohon lengkapi seluruh data RFA." }, { status: 400 });
      }
      update[key] = ["siteId", "subsId", "popId", "fatOdpCode"].includes(key) ? value.toUpperCase() : value;
    }
    if (body.rfaCores !== undefined) {
      const cores = Number(body.rfaCores);
      if (!skipsRfa && (!Number.isInteger(cores) || cores < 1)) {
        return NextResponse.json({ error: "Jumlah core RFA tidak valid." }, { status: 400 });
      }
      update.rfaCores = skipsRfa ? 0 : cores;
    }
    if (body.activationDate !== undefined) update.activationDay = activationDay(String(update.activationDate ?? current.activationDate));
    if (body.bandwidthIx !== undefined || body.bandwidthIix !== undefined) {
      const nextIx = String(update.bandwidthIx ?? current.bandwidthIx ?? "").trim();
      const nextIix = String(update.bandwidthIix ?? current.bandwidthIix ?? "").trim();
      update.bandwidth = [nextIx, nextIix].filter(Boolean).join(" / ");
    }
    if (skipsRfa) {
      for (const key of rfaFields) update[key] = "";
      update.buildType = "";
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "Tidak ada perubahan untuk disimpan." }, { status: 400 });
    }
    if (user.role === "vendor_user") {
      const vendor = user.vendorName.trim().toLowerCase();
      const region = String(user.regionScope ?? "").trim().toLowerCase();
      const allowed = ["id", "status", "activationDate", "timeSlot", "rescheduleReason"];
      if (!vendor || !VALID_REGION_SCOPES.has(region) || current.vendorName.trim().toLowerCase() !== vendor || requestRegion(current) !== region || ["Pending", "Request Approval"].includes(current.status) || current.rescheduleApprovalStatus === "Pending PIC Approval" || current.rescheduleApprovalStatus === "Pending Vendor Approval" || body.status !== "Reschedule" || Object.keys(body).some((key) => !allowed.includes(key)) || !String(body.rescheduleReason ?? "").trim()) {
        return NextResponse.json({ error: "Vendor hanya dapat mengajukan reschedule untuk request miliknya." }, { status: 403 });
      }
    }
    const isVendorReschedule = user.role === "vendor_user";
    const isPicReschedule = !isVendorReschedule && body.status === "Pending" && typeof body.picRescheduleReason === "string";
    const date = String(update.activationDate ?? current.activationDate);
    const requestedSlot = String(update.timeSlot ?? current.timeSlot);
    if (!validSchedule(date, requestedSlot)) return NextResponse.json({ error: "Tanggal atau slot belum dibuka atau tidak valid." }, { status: 400 });
    if (isPicReschedule) {
      update.picRescheduleDate = date;
      update.picRescheduleTimeSlot = requestedSlot;
      update.activationDate = date;
      update.timeSlot = requestedSlot;
      update.status = "Pending";
    }
    if (isVendorReschedule) {
      update.vendorRescheduleDate = date;
      update.vendorRescheduleTimeSlot = requestedSlot;
    }
    if (isPicReschedule || isVendorReschedule) {
      if (current.rescheduleApprovalStatus === "Pending PIC Approval" || current.rescheduleApprovalStatus === "Pending Vendor Approval") {
        return NextResponse.json({ error: "Masih ada reschedule yang menunggu approval." }, { status: 409 });
      }
      if (isVendorReschedule) {
        delete update.activationDate;
        delete update.timeSlot;
      }
      update.rescheduleApprovalStatus = isVendorReschedule ? "Pending PIC Approval" : "";
      update.rescheduleRequestedBy = isVendorReschedule ? "vendor" : "pic";
      update.rescheduleOriginalStatus = current.status;
      update.rescheduleApprovalReason = "";
      update.rescheduleApprovedBy = "";
      update.rescheduleApprovedAt = "";
    }
    const changed = isPicReschedule || (!isPicReschedule && !isVendorReschedule && (date !== current.activationDate || requestedSlot !== current.timeSlot));
    const nextPic = String(update.provisioningPic ?? current.provisioningPic);
    const changingPic = nextPic !== current.provisioningPic;
    if (changingPic) {
      const picAvailable = await db.all(sql`SELECT 1 WHERE ${picCapacity(nextPic, body.id)}`);
      if (!picAvailable.length) return NextResponse.json({ error: "PIC Provisioning sudah mencapai batas 7 request aktif." }, { status: 409 });
    }
    for (const slot of changed ? candidateSlots(requestedSlot) : [current.timeSlot]) {
      const [updated] = await db.update(activationRequests)
        .set(changed ? { ...update, timeSlot: slot } : update)
        .where(and(eq(activationRequests.id, body.id), changed ? capacity(date, slot, body.id) : undefined, changingPic ? picCapacity(nextPic, body.id) : undefined)).returning();
      if (updated) return NextResponse.json({ request: updated });
    }
    return fullResponse();
  } catch (error) {
    console.error("request-update-failed", error);
    return NextResponse.json(
      { error: "Perubahan gagal disimpan." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureActivationRequestsTable();
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }
    if (user.role === "vendor_user") {
      return NextResponse.json(
        { error: "Vendor tidak memiliki izin untuk menghapus data request." },
        { status: 403 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as any;
    if (!body.id) {
      return NextResponse.json({ error: "ID request tidak ditemukan." }, { status: 400 });
    }
    await getDb().delete(activationRequests).where(eq(activationRequests.id, body.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("request-delete-failed", error);
    return NextResponse.json({ error: "Request gagal dihapus." }, { status: 500 });
  }
}
