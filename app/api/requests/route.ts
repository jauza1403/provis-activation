import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activationRequests } from "@/db/schema";

import { candidateSlots, SLOT_CAPACITY } from "@/lib/scheduling";
function capacity(date: string, slot: string, excludeId = "") {
  return sql`(SELECT count(*) FROM activation_requests WHERE activation_date = ${date} AND time_slot = ${slot} AND id != ${excludeId}) < ${SLOT_CAPACITY}`;
}
function validSchedule(date: string, slot: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date && candidateSlots(slot).length > 0;
}
const fullResponse = () => NextResponse.json({ error: "Slot yang dipilih dan slot berikutnya penuh. Pilih slot sebelumnya atau tanggal lain." }, { status: 409 });
const required = [
  "activationDate", "timeSlot", "area", "vendorName",
  "accessMedia", "serviceType", "customerName", "siteId", "subsId", "oppNumber", "woNumber",
  "bandwidth", "devicePlan",
  "projectPic", "vendorPic", "provisioningPic",
] as const;

const rfaFields = [
  "popId", "popName", "cableLength", "cableType", "endToEnd",
  "attenuation", "customerPort", "popOtbPort",
] as const;

const editable = [...required, ...rfaFields, "fatOdpCode", "notes"] as const;

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

const allowedStatus = ["Idle", "On Progress", "Completed", "Reschedule", "Pending"];
const SUPERUSER_PIN = "1234";
const CUTOFF_HOUR = 17;

function slotStartMinutes(timeSlot: string) {
  const match = timeSlot.match(/^(\d{2})\.(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(activationRequests)
      .orderBy(desc(activationRequests.createdAt));
    const now = getWibClock();
    const nowMinutes = now.hour * 60 + now.minute;
    const normalized = rows.map((row) => {
      let status = allowedStatus.includes(row.status) ? row.status : "Idle";
      const reachedStart =
        row.activationDate < now.date ||
        (row.activationDate === now.date && nowMinutes >= slotStartMinutes(row.timeSlot));
      if (row.approvalStatus !== "Waiting Approval" && ["Idle", "Reschedule"].includes(status) && reachedStart) status = "On Progress";
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
    return NextResponse.json({ requests: normalized });
  } catch (error) {
    console.error("request-list-failed", error);
    return NextResponse.json(
      { error: "Data request belum dapat dimuat." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const wibNow = getWibClock();
    const body = (await request.json()) as any;
    const missing = required.find((key) => !String(body[key] ?? "").trim());
    const needsRfa = !["Interkoneksi", "Existing Link"].includes(body.accessMedia);
    const missingRfa = needsRfa && rfaFields.find((key) => !String(body[key] ?? "").trim());
    const missingSwitchData = Boolean(body.installSwitch) && (
      !String(body.switchBrand ?? "").trim() || !String(body.vlanSwitch ?? "").trim()
    );
    if (
      missing ||
      missingRfa ||
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
      timeSlot: body.timeSlot,
      area: body.area.trim(),
      vendorName: body.vendorName.trim(),
      accessMedia: body.accessMedia,
      serviceType: body.serviceType,
      isRelocation: Boolean(body.isRelocation),
      isRelayout: Boolean(body.isRelayout),
      customerName: body.customerName.trim(),
      siteId: body.siteId.trim().toUpperCase(),
      subsId: body.subsId.trim().toUpperCase(),
      oppNumber: body.oppNumber.trim(),
      woNumber: body.woNumber.trim(),
      devicePlan: body.devicePlan.trim(),
      installSwitch: Boolean(body.installSwitch),
      switchBrand: body.installSwitch ? String(body.switchBrand ?? "").trim() : "",
      vlanSwitch: body.installSwitch ? String(body.vlanSwitch ?? "").trim() : "",
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
      bandwidth: String(body.bandwidth ?? "").trim(),
      projectPic: body.projectPic.trim(),
      vendorPic: body.vendorPic.trim(),
      provisioningPic: body.provisioningPic,
      status: "Idle",
      completedAt: "",
      pendingReason: "",
      requestType: isUrgent ? "Urgent" : "Regular",
      approvalStatus: isUrgent ? "Waiting Approval" : "Not Required",
      approvalCode: isUrgent ? createApprovalCode() : "",
      approvedAt: "",
      whatsappMessageId: "",
      notes: String(body.notes ?? "").trim(),
    };
    const columns = getTableColumns(activationRequests);
    for (const slot of candidateSlots(row.timeSlot)) {
      row.timeSlot = slot;
      const entries = Object.entries(row) as [keyof typeof row, string | number | boolean][];
      const names = sql.join(entries.map(([key]) => sql.identifier(columns[key].name)), sql`, `);
      const values = sql.join(entries.map(([, value]) => sql`${typeof value === "boolean" ? Number(value) : value}`), sql`, `);
      // One statement makes capacity enforcement atomic across concurrent submissions.
      const inserted = await getDb().all(sql`INSERT INTO activation_requests (${names}) SELECT ${values} WHERE ${capacity(row.activationDate, slot)} RETURNING id`);
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
    const body = (await request.json()) as any;
    if (!body.id) {
      return NextResponse.json(
        { error: "ID request tidak ditemukan." },
        { status: 400 },
      );
    }
    if (body.status && !allowedStatus.includes(body.status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }
    if (body.approvalStatus && !["Waiting Approval", "Approved", "Not Required"].includes(body.approvalStatus)) {
      return NextResponse.json({ error: "Status approval tidak valid." }, { status: 400 });
    }
    if (body.approvalStatus === "Approved" && body.pin !== SUPERUSER_PIN) {
      return NextResponse.json({ error: "PIN salah. Hanya super user yang dapat menyetujui request urgent." }, { status: 403 });
    }
    const update: Record<string, string | number | boolean> = {};
    if (body.status) {
      update.status = body.status;
      update.completedAt = body.status === "Completed" ? new Date().toISOString() : "";
    }
    if (body.approvalStatus) update.approvalStatus = body.approvalStatus;
    if (body.approvalStatus === "Approved") update.approvedAt = new Date().toISOString();
    if (typeof body.pendingReason === "string") update.pendingReason = body.pendingReason.trim();
    if (body.provisioningPic) update.provisioningPic = body.provisioningPic;
    if (typeof body.notes === "string") update.notes = body.notes.trim();
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
    const skipsRfa = ["Interkoneksi", "Existing Link"].includes(body.accessMedia);
    for (const key of editable) {
      if (body[key] === undefined) continue;
      const value = String(body[key] ?? "").trim();
      if (!["notes", "fatOdpCode"].includes(key) && !rfaFields.includes(key as typeof rfaFields[number]) && !value) {
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
    if (skipsRfa) {
      for (const key of rfaFields) update[key] = "";
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "Tidak ada perubahan untuk disimpan." }, { status: 400 });
    }
    const db = getDb();
    const [current] = await db.select().from(activationRequests).where(eq(activationRequests.id, body.id));
    if (!current) return NextResponse.json({ error: "Request tidak ditemukan." }, { status: 404 });
    const date = String(update.activationDate ?? current.activationDate);
    const requestedSlot = String(update.timeSlot ?? current.timeSlot);
    if (!validSchedule(date, requestedSlot)) return NextResponse.json({ error: "Tanggal atau slot tidak valid." }, { status: 400 });
    const changed = date !== current.activationDate || requestedSlot !== current.timeSlot;
    for (const slot of changed ? candidateSlots(requestedSlot) : [current.timeSlot]) {
      const [updated] = await db.update(activationRequests)
        .set(changed ? { ...update, timeSlot: slot } : update)
        .where(and(eq(activationRequests.id, body.id), changed ? capacity(date, slot, body.id) : undefined)).returning();
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
