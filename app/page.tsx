"use client";

import { slots, SLOT_CAPACITY, candidateSlots } from "@/lib/scheduling";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Plus,
  CirclePause,
  Flame,
  MessageCircle,
  RadioTower,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ActivationRequest = {
  id: string;
  createdAt: string;
  deadline: string;
  activationDate: string;
  timeSlot: string;
  area: string;
  vendorName: string;
  accessMedia: string;
  serviceType: string;
  workType: string;
  isRelocation: boolean;
  isRelayout: boolean;
  customerName: string;
  siteId: string;
  subsId: string;
  oppNumber: string;
  woNumber: string;
  devicePlan: string;
  ipAddress: string;
  installSwitch: boolean;
  switchBrand: string;
  vlanSwitch: string;
  rfaCores: number;
  popAllocation: string;
  popId: string;
  popName: string;
  cableLength: string;
  cableType: string;
  fatOdpCode: string;
  endToEnd: string;
  attenuation: string;
  customerPort: string;
  popOtbPort: string;
  bandwidth: string;
  projectPic: string;
  vendorPic: string;
  provisioningPic: string;
  status: string;
  completedAt: string;
  pendingReason: string;
  rescheduleReason: string;
  requestType: string;
  approvalStatus: string;
  approvalCode: string;
  approvedAt: string;
  whatsappMessageId: string;
  notes: string;
  screenshotUrl: string;
};

type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: "superuser" | "project_user" | "vendor_user";
  vendorName: string;
};

const pics = [
  "Agus Wibowo",
  "Fahmi Anshori",
  "Nur Achmad Fatoni",
  "Septian Pratama",
  "Abi Wardana",
  "Luthfi",
  "Octaviandy Andries",
  "Chandra Nugraha Pratama",
  "Firmansyah",
  "Devri Damara",
  "Andika Sukmawan",
];

const serviceTypes = [
  "IP_LC - FO - Internet Service - IP Transit (NAP)",
  "IP_LC - FO - Leased Line Service - IPLC",
  "MWIFO - FO - Iforte Internet Connect - Fast Track",
  "MWIFO - FO - Internet Service - Broadband Up To",
  "MWIFO - FO - Internet Service - Dedicated",
  "MWIFO - FO - Internet Service - Dedicated - SD-WAN",
  "MWIFO - FO - Internet Service - IP Transit Non ISP",
  "MWIFO - FO - Internet Service + WIFI",
  "MWIFO - FO - Leased Line Service",
  "MWIFO - FO - Leased Line Service - Clear Channel",
  "MWIFO - FO - Leased Line Service - Dark Fiber",
  "MWIFO - FO - Managed Service - Internet + Wifi Access Point",
  "MWIFO - FO - Managed Service - L3VPN MPLS Solution",
  "MWIFO - GSM - Internet Service - Dedicated - M2M",
  "MWIFO - GSM - Leased Line Service - M2M",
  "MWIFO - M2M - Managed Service - M2M",
  "MWIFO - Wireless - BOD Internet Skyfiber",
  "MWIFO - Wireless - Internet - Backup",
  "MWIFO - Wireless - Internet - IP Transit Non ISP",
  "MWIFO - Wireless - Internet Skyfiber",
  "MWIFO - Wireless - Internet Skyfiber BW > 100 Mbps",
  "MWIFO - Wireless - Leased Line Service",
  "MWIFO - Wireless - Non Fasttrack Internet Skyfiber",
  "MWIFO - Wireless Skyfiber + WIFI + Manage Svc",
  "VSAT - VSAT - Internet Service - Dedicated",
  "VSAT - VSAT - Managed Service - L3VPN MPLS Solution",
];
const noIpServiceTypes = [
  "MWIFO - FO - Internet Service - Broadband Up To",
  "MWIFO - GSM - Internet Service - Dedicated - M2M",
  "VSAT - VSAT - Internet Service - Dedicated",
  "MWIFO - Wireless - BOD Internet Skyfiber",
];
const workTypes = [
  "Bandwidth on Demand Existing Site",
  "Bandwidth on Demand Existing Site with New Equipment",
  "Bandwidth on Demand New Site",
  "Change Media/Service",
  "Dismantle Old Site",
  "Downgrade",
  "Isolate",
  "New Installation",
  "New Installation with Additional Service",
  "Relayout",
  "Relocation",
  "Relocation (Activate with New Equipment)",
  "Renewal Bandwidth With Equipment",
  "Resume",
  "Upgrade Bandwidth",
  "Upgrade Equipment with BW",
];
const switchBrands = ["Huawei", "H3C", "Raisecom", "Cisco"];
const switchEmailTo = [
  "bertus.pamungkas@iforte.co.id",
  "abdul.khamim@iforte.co.id",
  "core.network@iforte.co.id",
  "presales@iforte.co.id",
  "agus.budi@iforte.co.id",
  "febi@iforte.co.id",
];
const switchEmailCc = [
  "sasmito@iforte.co.id",
  "oktaviandya@iforte.co.id",
  "provisioning@iforte.co.id",
  "presales@iforte.co.id",
];
const statuses = [
  "Idle",
  "On Progress",
  "Completed",
  "Reschedule",
  "Pending",
];

function getWibClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function formatActivationDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function getCompletedDate(request: ActivationRequest) {
  if (!request.completedAt) return request.activationDate;
  return getWibClock(new Date(request.completedAt)).date;
}

function formatCompletedTime(value: string) {
  if (!value) return "Data lama";
  return `${new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value))} WIB`;
}

function switchEmailService(request: ActivationRequest) {
  if (request.serviceType === "Internet") return "MWIFO - FO - Internet Service - Dedicated";
  if (request.serviceType === "Leased-Line") return "MWIFO - FO - Leased Line Service";
  return request.serviceType || "-";
}

function buildSwitchEmail(request: ActivationRequest) {
  const customer = `${request.siteId} ${request.customerName}`.trim();
  const subject = `[Request IP Switch] ${request.siteId} Subs ID ${request.subsId} ${request.customerName}`.trim();
  const body = [
    "Dear Team Corenetwork,",
    "",
    "Mohon bantuannya untuk alokasi IP Switch untuk kebutuhan customer berikut:",
    "",
    "Detail Customer",
    `- Customer: ${customer}`,
    `- Subs ID: ${request.subsId}`,
    `- Opportunity Number: ${request.oppNumber}`,
    "",
    "Detail Layanan",
    `- Service: ${switchEmailService(request)}`,
    `- Bandwidth Customer: ${request.bandwidth || "-"}`,
    "",
    "Detail Switch & Terminasi",
    `- VLAN Switch: ${request.vlanSwitch || "?"}`,
    "- IP Switch: ?",
    "- Terminasi:",
    `- Merek Switch: ${request.switchBrand || "-"}`,
    "",
    `Tanggal Aktivasi: ${request.activationDate}`,
    `Time: ${request.timeSlot}`,
    `Project PIC: ${request.projectPic}`,
    `Vendor PIC: ${request.vendorPic}`,
    `Provisioning PIC: ${request.provisioningPic}`,
    "",
    "Demikian yang dapat kami sampaikan. Terima kasih atas perhatian dan kerja samanya.",
  ].join("\n");
  return { subject, body };
}

function switchWebDraftUrl(request: ActivationRequest) {
  const { subject, body } = buildSwitchEmail(request);
  const to = switchEmailTo.join(",");
  const cc = switchEmailCc.join(",");
  const mailto = `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `https://outlook.office.com/mail/deeplink/compose?mailtouri=${encodeURIComponent(mailto)}`;
}

function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildSwitchEmailHtml(request: ActivationRequest) {
  const customer = escapeEmailHtml(`${request.siteId} ${request.customerName}`.trim());
  const subsId = escapeEmailHtml(request.subsId);
  const opportunity = escapeEmailHtml(request.oppNumber);
  const service = escapeEmailHtml(switchEmailService(request));
  const bandwidth = escapeEmailHtml(request.bandwidth || "-");
  const vlan = escapeEmailHtml(request.vlanSwitch || "?");
  return `<!doctype html>
<html><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.25;color:#000;margin:0;">
<p style="margin:0 0 12px 0;"><strong>Dear Team Corenetwork,</strong><br>
Mohon bantuannya untuk alokasi <strong>IP Switch</strong> untuk kebutuhan customer berikut:</p>
<p style="margin:0 0 4px 0;"><strong>Detail Customer</strong></p>
<ul style="margin:0 0 12px 22px;padding:0;">
<li><strong>Customer:</strong> ${customer}</li>
<li><strong>Subs ID:</strong> ${subsId}</li>
<li><strong>Opportunity Number:</strong> ${opportunity}</li>
</ul>
<p style="margin:0 0 4px 0;"><strong>Detail Layanan</strong></p>
<ul style="margin:0 0 12px 22px;padding:0;">
<li><strong>Service:</strong> ${service}</li>
<li><strong>Bandwidth Customer:</strong> ${bandwidth}</li>
</ul>
<p style="margin:0 0 4px 0;"><strong>Detail Switch &amp; Terminasi</strong></p>
<ul style="margin:0 0 12px 22px;padding:0;">
<li><strong>VLAN Switch:</strong> ${vlan}</li>
<li><strong>IP Switch:</strong> ?</li>
<li><strong>Terminasi:</strong></li>
</ul>
<p style="margin:0;">Demikian yang dapat kami sampaikan. Terima kasih atas perhatian dan kerja samanya.</p>
</body></html>`;
}

function downloadOutlookClassicDraft(request: ActivationRequest) {
  const { subject } = buildSwitchEmail(request);
  const htmlBody = buildSwitchEmailHtml(request);
  const eml = [
    `To: ${switchEmailTo.join(", ")}`,
    `Cc: ${switchEmailCc.join(", ")}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "X-Unsent: 1",
    "",
    htmlBody,
  ].join("\r\n");
  const blob = new Blob([eml], { type: "message/rfc822;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Request-IP-Switch-${request.subsId || request.siteId}.eml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const emptyForm = {
  deadline: "",
  activationDate: "",
  timeSlot: slots[0],
  area: "",
  vendorName: "",
  accessMedia: "METRO",
  serviceType: "",
  workType: "",
  isRelocation: false,
  isRelayout: false,
  customerName: "",
  siteId: "",
  subsId: "",
  oppNumber: "",
  woNumber: "",
  devicePlan: "",
  ipAddress: "",
  installSwitch: false,
  switchBrand: "",
  vlanSwitch: "",
  rfaCores: 1,
  popId: "",
  popName: "",
  cableLength: "",
  cableType: "",
  fatOdpCode: "",
  endToEnd: "",
  attenuation: "",
  customerPort: "",
  popOtbPort: "",
  bandwidth: "",
  bandwidthUnit: "Mbps",
  projectPic: "",
  vendorPic: "",
  provisioningPic: pics[0],
  notes: "",
  screenshotUrl: "",
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: unknown,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const CUTOFF_HOUR = 17;

const readBandwidthNumber = (value: string) => {
  const match = value.trim().match(/^[\d.]+/);
  return match ? match[0] : "";
};
const readBandwidthUnit = (value: string) => {
  const match = value.trim().match(/(Gbps|Mbps)$/i);
  return match && match[1].toLowerCase() === "gbps" ? "Gbps" : "Mbps";
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "form" | "urgentForm" | "urgent" | "pending" | "reschedule" | "completed">("dashboard");
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessageText] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("error");
  function setMessage(text: string, kind: "success" | "error" = "error") {
    setMessageText(text);
    setMessageKind(kind);
  }
  const [selectedRequest, setSelectedRequest] =
    useState<ActivationRequest | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivationRequest | null>(null);
  const [deleteCompletedAllOpen, setDeleteCompletedAllOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<ActivationRequest | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleCalendarOpen, setRescheduleCalendarOpen] = useState(false);
  const [switchEmailTarget, setSwitchEmailTarget] = useState<ActivationRequest | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ActivationRequest | null>(null);
  const [pendingReason, setPendingReason] = useState("");
  const [requestTypeDialog, setRequestTypeDialog] = useState(false);
  const [completedDateFilter, setCompletedDateFilter] = useState("all");
  const [successSubmittedRequest, setSuccessSubmittedRequest] = useState<ActivationRequest | null>(null);

  // 17:00 WIB cutoff — refreshed every minute
  const [pastCutoff, setPastCutoff] = useState(() => getWibClock().hour >= CUTOFF_HOUR);
  useEffect(() => {
    const tick = () => setPastCutoff(getWibClock().hour >= CUTOFF_HOUR);
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  async function load() {
    const response = await fetch("/api/requests", { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (response.status === 503) {
      setRequests([]);
      return;
    }
    const data = (await response.json()) as any;
    if (!response.ok) throw new Error(data.error);
    setRequests(data.requests ?? []);
  }

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const data = (await res.json()) as any;
        if (!data.user) {
          window.location.href = "/login";
          return;
        }
        setCurrentUser(data.user);
        setAuthLoading(false);
        await load();
      } catch {
        window.location.href = "/login";
      }
    }
    initAuth();

    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      window.location.href = "/login";
    }
  }

  // Enforce vendor view boundaries
  useEffect(() => {
    if (currentUser?.role === "vendor_user" && ["urgent", "pending", "completed"].includes(view)) {
      setView("dashboard");
    }
  }, [currentUser, view]);

  async function submit(payload = form, urgent = false) {
    const response = await fetch("/api/requests", {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : { ...payload, requestType: urgent ? "Urgent" : "Regular" }),
    });
    const data = (await response.json()) as any;
    if (!response.ok) throw new Error(data.error);
    setRequests((current) =>
      editingId
        ? current.map((item) => item.id === editingId ? data.request : item)
        : [data.request, ...current],
    );
    setForm(emptyForm);
    const wasEditing = Boolean(editingId);
    setEditingId(null);
    setView("dashboard");
    if (!wasEditing) {
      setSuccessSubmittedRequest(data.request);
    }
    setMessage(
      data.request.timeSlot !== payload.timeSlot
        ? `Request tersimpan di ${data.request.timeSlot} karena slot sebelumnya penuh.`
        : wasEditing
        ? "Perubahan request berhasil disimpan."
        : urgent
          ? `Request urgent ${data.request.approvalCode} tersimpan dan menunggu approval.`
          : "Request aktivasi berhasil dikirim.",
      "success",
    );
    return data.request as ActivationRequest;
  }

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const tool = {
      name: "create_activation_request",
      title: "Buat request aktivasi",
      description:
        "Membuat request aktivasi customer baru dengan data vendor, RFA, jadwal, dan PIC Provisioning.",
      inputSchema: {
        type: "object",
        properties: {
          activationDate: { type: "string" },
          timeSlot: { type: "string", enum: slots },
          area: { type: "string" },
          vendorName: { type: "string" },
          accessMedia: { type: "string", enum: ["GPON", "Interkoneksi", "Existing Link", "DWDM", "M2M", "METRO", "SDWAN", "Skyfiber", "UTP", "VSAT", "Wireless"] },
          serviceType: { type: "string", enum: serviceTypes },
          workType: { type: "string", enum: workTypes },
          isRelocation: { type: "boolean" },
          isRelayout: { type: "boolean" },
          customerName: { type: "string" },
          siteId: { type: "string" },
          subsId: { type: "string" },
          oppNumber: { type: "string" },
          woNumber: { type: "string" },
          devicePlan: { type: "string" },
          ipAddress: { type: "string" },
          installSwitch: { type: "boolean" },
          switchBrand: { type: "string", enum: switchBrands },
          vlanSwitch: { type: "string" },
          rfaCores: { type: "integer", minimum: 1 },
          popId: { type: "string" },
          popName: { type: "string" },
          cableLength: { type: "string" },
          cableType: { type: "string" },
          fatOdpCode: { type: "string" },
          endToEnd: { type: "string" },
          attenuation: { type: "string" },
          customerPort: { type: "string" },
          popOtbPort: { type: "string" },
          bandwidth: { type: "string" },
          projectPic: { type: "string" },
          vendorPic: { type: "string" },
          provisioningPic: { type: "string", enum: pics },
          notes: { type: "string" },
        },
        required: [
          "activationDate",
          "timeSlot",
          "area",
          "vendorName",
          "accessMedia",
          "serviceType",
          "workType",
          "customerName",
          "siteId",
          "subsId",
          "oppNumber",
          "woNumber",
          "devicePlan",
          "projectPic",
          "vendorPic",
          "provisioningPic",
        ],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input: unknown) => {
        const created = await submit(input as typeof form);
        return { id: created.id, status: created.status, siteId: created.siteId };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch(() => undefined);
    } catch {
      // Browser does not support WebMCP.
    }
    return () => controller.abort();
  }, []);

  const filtered = useMemo(
    () =>
      requests.filter((item) => {
        if (["Pending", "Completed"].includes(item.status) || item.approvalStatus === "Waiting Approval") return false;
        const haystack =
          `${item.customerName} ${item.siteId} ${item.subsId} ${item.woNumber} ${item.vendorName} ${item.area} ${item.provisioningPic}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (statusFilter === "Semua status" || item.status === statusFilter)
        );
      }).sort((a, b) => {
        const dateOrder = a.activationDate.localeCompare(b.activationDate);
        if (dateOrder !== 0) return dateOrder;
        const slotOrder = slots.indexOf(a.timeSlot) - slots.indexOf(b.timeSlot);
        if (slotOrder !== 0) return slotOrder;
        return a.customerName.localeCompare(b.customerName, "id");
      }),
    [requests, query, statusFilter],
  );

  async function updateRequest(
    id: string,
    field: "status" | "provisioningPic",
    value: string,
  ) {
    setRequests((all) =>
      all.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    const response = await fetch("/api/requests", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    if (!response.ok) {
      setMessage("Perubahan gagal disimpan.");
      await load();
    }
  }

  function changeStatus(item: ActivationRequest, status: string) {
    if (status === "Pending") {
      setPendingTarget(item);
      setPendingReason(item.pendingReason || "");
      return;
    }
    if (status === "Reschedule") {
      openReschedule(item);
      return;
    }
    void updateRequest(item.id, "status", status);
  }

  function openReschedule(item: ActivationRequest) {
    setRescheduleTarget(item);
    setRescheduleDate(item.activationDate);
    setRescheduleSlot(item.timeSlot);
    setRescheduleReason("");
    setRescheduleCalendarOpen(false);
  }

  async function savePending() {
    if (!pendingTarget || !pendingReason.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: pendingTarget.id,
          status: "Pending",
          pendingReason: pendingReason.trim(),
        }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) =>
        current.map((item) => item.id === pendingTarget.id ? data.request : item),
      );
      setSelectedRequest(null);
      setPendingTarget(null);
      setMessage("Request dipindahkan ke Daftar Pending.", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status Pending gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function saveReschedule() {
    if (!rescheduleTarget || !rescheduleDate) return;
    if (!rescheduleReason.trim()) {
      setMessage("Alasan reschedule wajib diisi.");
      return;
    }
    const needsApproval = rescheduleTarget.approvalStatus === "Waiting Approval";
    setBusy(true);
    try {
      const targetSlot = rescheduleSlot || rescheduleTarget.timeSlot;
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: rescheduleTarget.id,
          status: "Reschedule",
          activationDate: rescheduleDate,
          timeSlot: targetSlot,
          pendingReason: "",
          rescheduleReason: rescheduleReason.trim(),
          ...(needsApproval ? { approvalStatus: "Approved" } : {}),
        }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) =>
        current.map((item) => item.id === rescheduleTarget.id ? data.request : item),
      );
      setSelectedRequest((current) => current?.id === rescheduleTarget.id ? data.request : current);
      setRescheduleTarget(null);
      setMessage(
        data.request.timeSlot !== targetSlot
          ? `Jadwal diubah ke ${formatActivationDate(data.request.activationDate)} (${data.request.timeSlot} - dialihkan karena slot sebelumnya penuh).`
          : `Jadwal aktivasi berhasil diubah ke ${formatActivationDate(data.request.activationDate)} (${data.request.timeSlot}).`,
        "success",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Jadwal gagal diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function approveUrgent(item: ActivationRequest) {
    if (currentUser?.role !== "superuser") {
      setMessage("Hanya Superuser yang dapat menyetujui request urgent.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          approvalStatus: "Approved",
          activationDate: getWibClock().date,
          status: "On Progress",
        }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) => current.map((request) => request.id === item.id ? data.request : request));
      setSelectedRequest(null);
      setMessage(`Request urgent ${item.approvalCode} berhasil disetujui.`, "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval urgent gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  function openNewRequest() {
    if (pastCutoff) {
      setMessage("Pengajuan request reguler sudah tutup setelah pukul 17:00 WIB. Silakan ajukan Request Urgent.");
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setSelectedRequest(null);
    setView("form");
  }

  function openUrgentRequest() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedRequest(null);
    setView("urgentForm");
  }

  function editRequest(item: ActivationRequest) {
    if (currentUser?.role === "vendor_user") {
      setMessage("Vendor tidak memiliki izin untuk mengedit request.");
      return;
    }
    setEditingId(item.id);
    setForm({
      deadline: item.deadline,
      activationDate: item.activationDate,
      timeSlot: item.timeSlot,
      area: item.area,
      vendorName: item.vendorName,
      accessMedia: item.accessMedia,
      serviceType: item.serviceType || "",
      workType: item.workType || "",
      isRelocation: Boolean(item.isRelocation),
      isRelayout: Boolean(item.isRelayout),
      customerName: item.customerName,
      siteId: item.siteId,
      subsId: item.subsId,
      oppNumber: item.oppNumber,
      woNumber: item.woNumber,
      devicePlan: item.devicePlan,
      ipAddress: item.ipAddress || "",
      installSwitch: Boolean(item.installSwitch),
      switchBrand: item.switchBrand || "",
      vlanSwitch: item.vlanSwitch || "",
      rfaCores: item.rfaCores,
      popId: item.popId || "",
      popName: item.popName || item.popAllocation || "",
      cableLength: item.cableLength || "",
      cableType: item.cableType || "",
      fatOdpCode: item.fatOdpCode || "",
      endToEnd: item.endToEnd || "",
      attenuation: item.attenuation || "",
      customerPort: item.customerPort || "",
      popOtbPort: item.popOtbPort || "",
      bandwidth: item.bandwidth || "",
      bandwidthUnit: readBandwidthUnit(item.bandwidth || ""),
      projectPic: item.projectPic,
      vendorPic: item.vendorPic,
      provisioningPic: item.provisioningPic,
      notes: item.notes,
      screenshotUrl: item.screenshotUrl || "",
    });
    setSelectedRequest(null);
    setView("form");
  }

  async function deleteRequest() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) => current.filter((item) => item.id !== deleteTarget.id));
      setSelectedRequest((current) => current?.id === deleteTarget.id ? null : current);
      setDeleteTarget(null);
      setMessage("Request aktivasi berhasil dihapus.", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAllCompletedForDate() {
    if (!completedForDate.length) return;
    setBusy(true);
    try {
      const deletedIds = new Set(completedForDate.map((item) => item.id));
      const responses = await Promise.all(
        completedForDate.map((item) => fetch("/api/requests", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        })),
      );
      if (responses.some((response) => !response.ok)) throw new Error("Sebagian data gagal dihapus.");
      setRequests((current) => current.filter((item) => !deletedIds.has(item.id)));
      setSelectedRequest((current) => current && deletedIds.has(current.id) ? null : current);
      setDeleteCompletedAllOpen(false);
      setMessage(
        completedDateFilter === "all"
          ? "Semua data completed berhasil dihapus."
          : `Semua data completed tanggal ${formatActivationDate(completedDateFilter)} berhasil dihapus.`,
        "success",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data completed gagal dihapus.");
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  const activeCount = requests.filter((r) => r.status === "On Progress").length;
  const today = getWibClock().date;
  const todayCount = requests.filter((r) => r.activationDate === today && r.approvalStatus !== "Waiting Approval").length;
  const completed = requests.filter((r) => r.status === "Completed").length;
  const completedRequests = requests
    .filter((r) => r.status === "Completed")
    .sort((a, b) => {
      const dateOrder = getCompletedDate(b).localeCompare(getCompletedDate(a));
      if (dateOrder !== 0) return dateOrder;
      return (b.completedAt || "").localeCompare(a.completedAt || "");
    });
  const completedForDate = completedDateFilter === "all"
    ? completedRequests
    : completedRequests.filter((r) => getCompletedDate(r) === completedDateFilter);
  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const rescheduleRequests = requests.filter((item) => {
    if (["Pending", "Completed"].includes(item.status) || item.approvalStatus === "Waiting Approval") return false;
    return true;
  });
  const urgentRequests = requests.filter((r) => r.approvalStatus === "Waiting Approval");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium tracking-wide">Memverifikasi sesi…</span>
      </div>
    );
  }

  return (
    <main className="portal-shell min-h-screen text-slate-100">
      <header className="portal-header px-5 py-4 lg:px-10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div className="brand-lockup">
            <span className="brand-logo-shell">
              <img
                src="/iforte-logo.png"
                alt="iForte"
                className="brand-logo-image"
              />
            </span>
            <div className="brand-copy">
              <strong className="block text-sm font-extrabold tracking-[0.14em]">
                PROVISIONING
              </strong>
              <span className="text-xs text-slate-400">Activation Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="live-pill hidden sm:flex">
              <span className="live-dot" />
              Sistem online
            </div>
            {currentUser && (
              <div className="user-profile-badge flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {currentUser.role === "superuser" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        SUPERUSER
                      </span>
                    )}
                    {currentUser.role === "project_user" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        PROJECT USER
                      </span>
                    )}
                    {currentUser.role === "vendor_user" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        VENDOR USER
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Logout"
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-400 border border-slate-800 text-xs font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 active:scale-[.96] cursor-pointer"
                >
                  <LogOut size={15} />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-7 px-4 py-7 lg:grid-cols-[236px_minmax(0,1fr)] lg:px-10">
        <aside className="portal-sidebar flex gap-2 lg:flex-col">
          <div className="sidebar-label hidden lg:block">WORKSPACE</div>
          <button
            onClick={() => { setView("dashboard"); setEditingId(null); setForm(emptyForm); }}
            className={`nav-button ${view === "dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            {currentUser?.role === "vendor_user" ? "Dashboard Saya" : "Dashboard"}
          </button>
          <button
            onClick={openNewRequest}
            disabled={pastCutoff}
            title={pastCutoff ? "Pengajuan reguler tutup pukul 17:00 WIB" : undefined}
            className={`nav-button ${view === "form" ? "active" : ""} ${pastCutoff ? "disabled" : ""}`}
          >
            {pastCutoff ? <Lock size={18} /> : <Plus size={18} />}
            Request Baru
          </button>
          <button
            onClick={openUrgentRequest}
            className={`nav-button urgent-nav ${view === "urgentForm" ? "active" : ""}`}
          >
            <Flame size={18} />
            Request Urgent
          </button>
          <button
            onClick={() => { setView("reschedule"); setEditingId(null); setSelectedRequest(null); }}
            className={`nav-button ${view === "reschedule" ? "active" : ""}`}
          >
            <CalendarClock size={18} />
            Reschedule
            {rescheduleRequests.length > 0 && <span className="nav-count">{rescheduleRequests.length}</span>}
          </button>
          {currentUser?.role !== "vendor_user" && (
            <>
              <button
                onClick={() => { setView("urgent"); setEditingId(null); setSelectedRequest(null); }}
                className={`nav-button ${view === "urgent" ? "active" : ""}`}
              >
                <MessageCircle size={18} />
                Approval Urgent
                {urgentRequests.length > 0 && <span className="nav-count urgent-count">{urgentRequests.length}</span>}
              </button>
              <button
                onClick={() => { setView("pending"); setEditingId(null); setSelectedRequest(null); }}
                className={`nav-button ${view === "pending" ? "active" : ""}`}
              >
                <CirclePause size={18} />
                Pending
                {pendingRequests.length > 0 && <span className="nav-count">{pendingRequests.length}</span>}
              </button>
              <button
                onClick={() => { setView("completed"); setEditingId(null); setSelectedRequest(null); }}
                className={`nav-button ${view === "completed" ? "active" : ""}`}
              >
                <CheckCircle2 size={18} />
                Done Activation
                {completedRequests.length > 0 && <span className="nav-count completed-count">{completedRequests.length}</span>}
              </button>
            </>
          )}
          <div className={`deadline-note mt-auto hidden lg:block ${pastCutoff ? "cutoff-active" : ""}`}>
            <span className="deadline-icon">{pastCutoff ? <ShieldAlert size={18} /> : <Clock3 size={18} />}</span>
            <b>{pastCutoff ? "Pengajuan reguler tutup" : "Pengajuan dibuka"}</b>
            <p>{pastCutoff ? "Setelah pukul 17:00 WIB, gunakan Request Urgent." : "Request reguler dibuka sampai pukul 17:00 WIB."}</p>
          </div>
        </aside>

        <section>
          {message && (
            <div role={messageKind === "error" ? "alert" : "status"} className={`portal-message portal-message-${messageKind}`}>
              <span><strong>{messageKind === "error" ? "Perhatian: " : "Berhasil: "}</strong>{message}</span>
              <button type="button" aria-label="Tutup pesan" onClick={() => setMessage("")}>
                <X size={17} />
              </button>
            </div>
          )}
          {view === "dashboard" ? (
            <>
              <div className="page-heading mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow"><Sparkles size={13} /> AKTIVASI HARI INI</span>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
                    Aktivasi Customer
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Kelola jadwal, PIC, dan progres site dalam satu halaman.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setRequestTypeDialog(true)}
                >
                  <Plus size={18} />
                  Buat request
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  icon={<ClipboardList />}
                  label="Total request"
                  value={requests.filter((r) => r.approvalStatus !== "Waiting Approval").length}
                  tone="blue"
                />
                <Metric
                  icon={<Activity />}
                  label="Sedang berjalan"
                  value={activeCount}
                  tone="orange"
                />
                <Metric
                  icon={<CalendarDays />}
                  label="Jadwal hari ini"
                  value={todayCount}
                  tone="purple"
                />
                <Metric
                  icon={<CheckCircle2 />}
                  label="Selesai"
                  value={completed}
                  tone="green"
                />
              </div>
              <div className="data-panel overflow-hidden">
                <div className="panel-toolbar flex flex-wrap items-center gap-3 p-4 lg:p-5">
                  <div className="mr-auto">
                    <b className="text-sm text-white">Daftar request aktivasi</b>
                    <span className="mt-1 block text-xs text-slate-500">Kelola jadwal dan penanggung jawab site</span>
                  </div>
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      aria-label="Cari request berdasarkan Site ID, Subs ID, WO atau vendor"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cari Site ID, Subs ID, WO, vendor…"
                    />
                  </label>
                  <select
                    aria-label="Filter status request"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Semua status</option>
                    {statuses.filter((status) => !["Pending", "Completed"].includes(status)).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Jadwal Aktivasi</th>
                        <th>Time</th>
                        <th>Area & Vendor</th>
                        <th>Media</th>
                        <th>PIC Provisioning</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr
                          key={item.id}
                          className="clickable-row"
                          tabIndex={0}
                          onClick={() => setSelectedRequest(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedRequest(item);
                            }
                          }}
                          aria-label={`Lihat detail ${item.customerName || item.siteId}`}
                        >
                          <td data-label="Customer">
                            <b>{item.customerName || "Nama customer belum diisi"}</b>
                            <span>
                              {item.siteId} · {item.subsId} · WO {item.woNumber}
                            </span>
                          </td>
                          <td data-label="Jadwal Aktivasi">
                            <b className="capitalize">{formatActivationDate(item.activationDate)}</b>
                          </td>
                          <td data-label="Time">
                            <span className="timeslot-badge"><Clock3 size={14} /> {item.timeSlot}</span>
                          </td>
                          <td data-label="Area & Vendor">
                            <b>{item.area}</b>
                            <span>{item.vendorName}</span>
                          </td>
                          <td data-label="Media">
                            <span className="media-badge">
                              {item.accessMedia}
                            </span>
                            {item.installSwitch && (
                              <span className="switch-install-note">Install Switch · {item.switchBrand}</span>
                            )}
                          </td>
                          <td data-label="PIC Provisioning">
                            {currentUser?.role === "vendor_user" ? (
                              <span className="font-medium text-slate-300">{item.provisioningPic}</span>
                            ) : (
                              <select
                                aria-label={`PIC Provisioning untuk ${item.customerName || item.siteId}`}
                                value={item.provisioningPic}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(e) =>
                                  updateRequest(
                                    item.id,
                                    "provisioningPic",
                                    e.target.value,
                                  )
                                }
                              >
                                {pics.map((pic) => (
                                  <option key={pic}>{pic}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td data-label="Status">
                            <div className="status-control">
                              {item.status === "On Progress" && <span className="progress-beacon" aria-label="Sedang berjalan" />}
                              {currentUser?.role === "vendor_user" ? (
                                <span className={`status ${item.status.toLowerCase().replace(" ", "-")}`}>
                                  {item.status}
                                </span>
                              ) : (
                                <select
                                  className={`status ${item.status.toLowerCase().replace(" ", "-")}`}
                                  aria-label={`Status request ${item.customerName || item.siteId}`}
                                  value={item.status}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => changeStatus(item, event.target.value)}
                                >
                                  {statuses.map((status) => (
                                    <option key={status}>{status}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td data-label="Aksi">
                            <div className="row-actions">
                              {item.installSwitch && (
                                <button
                                  type="button"
                                  className="icon-action email"
                                  title="Buat email Request IP Switch"
                                  aria-label={`Buat email Request IP Switch ${item.customerName || item.siteId}`}
                                  onClick={(event) => { event.stopPropagation(); setSwitchEmailTarget(item); }}
                                >
                                  <Mail size={15} />
                                </button>
                              )}
                              {currentUser?.role !== "vendor_user" && (
                                <>
                                  <button
                                    type="button"
                                    className="icon-action edit"
                                    title="Edit request"
                                    aria-label={`Edit ${item.customerName || item.siteId}`}
                                    onClick={(event) => { event.stopPropagation(); editRequest(item); }}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-action delete"
                                    title="Hapus request"
                                    aria-label={`Hapus ${item.customerName || item.siteId}`}
                                    onClick={(event) => { event.stopPropagation(); setDeleteTarget(item); }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && (
                  <div className="empty-state">
                    <span><ClipboardList size={24} /></span>
                    <b>Belum ada request</b>
                    <p>Request yang baru dikirim akan tampil di sini.</p>
                  </div>
                )}
              </div>
            </>
          ) : view === "form" || view === "urgentForm" ? (
            <RequestForm
              requests={requests.filter((item) => item.id !== editingId)}
              form={form}
              setForm={setForm}
              busy={busy}
              editing={Boolean(editingId)}
              urgent={view === "urgentForm"}
              onCancel={() => { setEditingId(null); setForm(emptyForm); setView("dashboard"); }}
              onSubmit={async () => {
                if (busy) return;
                if (view === "urgentForm" && !form.screenshotUrl) {
                  setMessage("Mohon lampirkan screenshot untuk request urgent.");
                  return;
                }
                setBusy(true);
                setMessage("");
                try {
                  await submit(form, view === "urgentForm");
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Request gagal dikirim.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : view === "urgent" ? (
            <UrgentApprovalList
              requests={urgentRequests}
              onOpen={setSelectedRequest}
              onApprove={approveUrgent}
              onReschedule={openReschedule}
              busy={busy}
              canApprove={currentUser?.role === "superuser"}
            />
          ) : view === "completed" ? (
            <CompletedList
              requests={completedForDate}
              selectedDate={completedDateFilter}
              onDateChange={setCompletedDateFilter}
              onOpen={setSelectedRequest}
              onDelete={setDeleteTarget}
              onDeleteAll={() => setDeleteCompletedAllOpen(true)}
            />
          ) : view === "reschedule" ? (
            <RescheduleList
              requests={rescheduleRequests}
              onOpen={setSelectedRequest}
              onReschedule={openReschedule}
            />
          ) : (
            <PendingList
              requests={pendingRequests}
              onOpen={setSelectedRequest}
              onReschedule={openReschedule}
            />
          )}
        </section>
      </div>
      <RequestDetail
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onEdit={editRequest}
        onDelete={setDeleteTarget}
        canEdit={currentUser?.role !== "vendor_user"}
      />
      <Dialog open={Boolean(switchEmailTarget)} onOpenChange={(open) => !open && setSwitchEmailTarget(null)}>
        <DialogContent className="email-choice-dialog">
          <DialogHeader>
            <DialogTitle>Kirim Request IP Switch</DialogTitle>
            <DialogDescription>
              Pilih Outlook yang akan digunakan. Draft email akan terisi otomatis dan siap diperiksa sebelum dikirim.
            </DialogDescription>
          </DialogHeader>
          <div className="email-choice-options">
            <button
              type="button"
              onClick={() => {
                if (!switchEmailTarget) return;
                window.open(switchWebDraftUrl(switchEmailTarget), "_blank", "noopener,noreferrer");
                setSwitchEmailTarget(null);
              }}
            >
              <span><Mail size={19} /></span>
              <div><b>Outlook Web</b><small>Buka draft di browser</small></div>
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!switchEmailTarget) return;
                const { subject, body } = buildSwitchEmail(switchEmailTarget);
                const msTo = switchEmailTo.join(",");
                const msCc = switchEmailCc.join(",");
                const mailto = `mailto:${msTo}?cc=${encodeURIComponent(msCc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                const url = `ms-outlook://compose?mailtouri=${encodeURIComponent(mailto)}`;
                window.location.href = url;
                setSwitchEmailTarget(null);
              }}
            >
              <span><Mail size={19} /></span>
              <div><b>New Outlook</b><small>Buka langsung di aplikasi New Outlook</small></div>
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!switchEmailTarget) return;
                downloadOutlookClassicDraft(switchEmailTarget);
                setSwitchEmailTarget(null);
              }}
            >
              <span><Mail size={19} /></span>
              <div><b>Outlook 2024 Classic</b><small>Unduh draft .eml, lalu buka dengan Outlook</small></div>
              <ChevronRight size={18} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={requestTypeDialog} onOpenChange={setRequestTypeDialog}>
        <DialogContent className="request-type-dialog">
          <DialogHeader>
            <DialogTitle>Pilih Jenis Request</DialogTitle>
            <DialogDescription>
              Tentukan jenis pengajuan aktivasi yang akan dibuat.
            </DialogDescription>
          </DialogHeader>
          <div className="request-type-options">
            <button
              type="button"
              className={`request-type-option regular ${pastCutoff ? "disabled" : ""}`}
              disabled={pastCutoff}
              onClick={() => { setRequestTypeDialog(false); openNewRequest(); }}
            >
              <span>{pastCutoff ? <Lock size={20} /> : <Plus size={20} />}</span>
              <div><b>Request New</b><small>{pastCutoff ? "Tutup setelah pukul 17:00 WIB" : "Request aktivasi reguler"}</small></div>
              {!pastCutoff && <ChevronRight size={19} />}
            </button>
            <button
              type="button"
              className="request-type-option urgent"
              onClick={() => { setRequestTypeDialog(false); openUrgentRequest(); }}
            >
              <span><Flame size={20} /></span>
              <div><b>Request New Urgent</b><small>Need Approval</small></div>
              <ChevronRight size={19} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus request aktivasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {deleteTarget?.customerName || deleteTarget?.siteId} akan dihapus permanen dari daftar monitoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={deleteRequest} className="confirm-delete">
              {busy ? "Menghapus…" : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteCompletedAllOpen} onOpenChange={setDeleteCompletedAllOpen}>
        <AlertDialogContent className="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus semua aktivasi selesai?</AlertDialogTitle>
            <AlertDialogDescription>
              {completedDateFilter === "all"
                ? `Seluruh ${completedForDate.length} data completed akan dihapus permanen.`
                : `Seluruh ${completedForDate.length} data completed pada ${formatActivationDate(completedDateFilter)} akan dihapus permanen.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !completedForDate.length} onClick={deleteAllCompletedForDate} className="confirm-delete">
              {busy ? "Menghapus…" : `Ya, hapus semua (${completedForDate.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="reschedule-dialog max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="text-sky-400" size={20} />
              Ganti Tanggal Aktivasi (Reschedule)
            </DialogTitle>
            <DialogDescription>
              Tentukan jadwal tanggal dan slot baru untuk <strong className="text-slate-200">{rescheduleTarget?.customerName || rescheduleTarget?.siteId}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Field Tanggal Aktivasi Baru */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Tanggal Aktivasi Baru
              </span>
              <Popover open={rescheduleCalendarOpen} onOpenChange={setRescheduleCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="activation-date-trigger w-full flex items-center justify-between"
                  >
                    <span className="capitalize">
                      {rescheduleDate ? formatActivationDate(rescheduleDate) : "Pilih tanggal aktivasi baru"}
                    </span>
                    <CalendarDays size={18} className="text-sky-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="activation-calendar-popover w-auto p-0 z-50" align="start">
                  <Calendar
                    className="activation-calendar"
                    mode="single"
                    selected={rescheduleDate ? new Date(rescheduleDate + "T00:00:00") : undefined}
                    defaultMonth={rescheduleDate ? new Date(rescheduleDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      const value = [
                        date.getFullYear(),
                        String(date.getMonth() + 1).padStart(2, "0"),
                        String(date.getDate()).padStart(2, "0"),
                      ].join("-");
                      setRescheduleDate(value);
                      const countForSlot = (slot: string) =>
                        requests.filter((r) => r.id !== rescheduleTarget?.id && r.activationDate === value && r.timeSlot === slot).length;
                      const nextSlot = slots.find((slot) => countForSlot(slot) < SLOT_CAPACITY);
                      if (nextSlot) setRescheduleSlot(nextSlot);
                      setRescheduleCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Field Time Slot */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Pilih Time Slot
              </span>
              <div className="slot-grid grid grid-cols-2 gap-2">
                {slots.map((slot, index) => {
                  const count = requests.filter(
                    (r) => r.id !== rescheduleTarget?.id && r.activationDate === rescheduleDate && r.timeSlot === slot
                  ).length;
                  const isFull = count >= SLOT_CAPACITY;
                  const isSelected = (rescheduleSlot || rescheduleTarget?.timeSlot) === slot;
                  return (
                    <label
                      key={slot}
                      className={`flex flex-col p-2.5 rounded-lg border transition cursor-pointer text-xs ${
                        isSelected
                          ? "border-sky-500 bg-sky-950/40 text-sky-200"
                          : isFull
                          ? "border-slate-800 bg-slate-950/40 text-slate-500 opacity-60 cursor-not-allowed"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Slot {index + 1}</span>
                        <input
                          type="radio"
                          name="rescheduleSlot"
                          value={slot}
                          disabled={isFull}
                          checked={isSelected}
                          onChange={(e) => setRescheduleSlot(e.target.value)}
                          className="sr-only"
                        />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-sky-400"></span>}
                      </div>
                      <span className="font-semibold text-slate-200 mt-1">{slot}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {rescheduleDate ? `${count}/${SLOT_CAPACITY} terisi${isFull ? " · Penuh" : ""}` : "Pilih tanggal"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Field Alasan Reschedule */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Alasan Reschedule
              </span>
              <textarea
                rows={3}
                required
                placeholder="Jelaskan alasan perubahan jadwal aktivasi"
                value={rescheduleReason}
                onChange={(event) => setRescheduleReason(event.target.value)}
                className="w-full min-h-[42px] rounded-lg border px-3 py-2 text-sm"
              />
              <span className="block text-[11px] text-slate-500">
                Awalan otomatis: {currentUser?.role === "vendor_user" ? "(from vendor to provision)" : "(from provision to vendor)"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" className="secondary-button" disabled={busy} onClick={() => setRescheduleTarget(null)}>
              Batal
            </button>
            <button type="button" className="primary-button" disabled={busy || !rescheduleDate || !rescheduleReason.trim()} onClick={() => void saveReschedule()}>
              {busy ? "Menyimpan…" : "Simpan Jadwal Baru"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(pendingTarget)} onOpenChange={(open) => !open && setPendingTarget(null)}>
        <DialogContent className="reschedule-dialog">
          <DialogHeader>
            <DialogTitle>Alasan Request Pending</DialogTitle>
            <DialogDescription>
              Jelaskan kendala yang menyebabkan {pendingTarget?.customerName || pendingTarget?.siteId} berstatus Pending.
            </DialogDescription>
          </DialogHeader>
          <label className="reschedule-field">
            <span>Reason Pending</span>
            <textarea
              rows={4}
              required
              placeholder="Contoh: menunggu izin akses lokasi atau material vendor"
              value={pendingReason}
              onChange={(event) => setPendingReason(event.target.value)}
            />
          </label>
          <DialogFooter>
            <button type="button" className="secondary-button" disabled={busy} onClick={() => setPendingTarget(null)}>
              Batal
            </button>
            <button type="button" className="primary-button" disabled={busy || !pendingReason.trim()} onClick={savePending}>
              {busy ? "Menyimpan…" : "Simpan Pending"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(successSubmittedRequest)}
        onOpenChange={(open) => !open && setSuccessSubmittedRequest(null)}
      >
        <DialogContent className="success-dialog max-w-md p-6 sm:max-w-lg">
          <div className="flex flex-col items-center text-center">
            <div className="success-dialog-icon">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <DialogHeader className="flex flex-col items-center gap-1.5 text-center">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                Terima kasih telah mengisi
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400 max-w-sm">
                Request aktivasi customer berhasil dikirim dan telah tercatat ke dalam sistem monitoring.
              </DialogDescription>
            </DialogHeader>

            {successSubmittedRequest && (
              <div className="mt-5 w-full space-y-3.5 text-left">
                {/* Ringkasan Singkat Request */}
                <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Ringkasan Pengajuan
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      <Sparkles size={11} /> {successSubmittedRequest.requestType === "Urgent" ? "Urgent Request" : "Reguler"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Customer</span>
                      <strong className="text-slate-200 font-semibold truncate block">
                        {successSubmittedRequest.customerName || "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Site ID / Subs ID</span>
                      <strong className="text-slate-200 font-semibold truncate block">
                        {successSubmittedRequest.siteId} · {successSubmittedRequest.subsId}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Jadwal Aktivasi</span>
                      <strong className="text-slate-200 font-semibold block capitalize">
                        {formatActivationDate(successSubmittedRequest.activationDate)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Time Slot</span>
                      <strong className="text-slate-200 font-semibold block">
                        {successSubmittedRequest.timeSlot}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Checklist Elemen */}
                <div className="success-checklist-box">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Elemen Checklist
                  </span>
                  <div className="space-y-2.5">
                    <div className="success-checklist-item">
                      <span className="success-checklist-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>Data customer, Site ID, &amp; WO terverifikasi</span>
                    </div>
                    <div className="success-checklist-item">
                      <span className="success-checklist-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>Jadwal &amp; kuota time slot berhasil dialokasikan</span>
                    </div>
                    <div className="success-checklist-item">
                      <span className="success-checklist-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>PIC Vendor &amp; Provisioning ({successSubmittedRequest.provisioningPic}) ditugaskan</span>
                    </div>
                    <div className="success-checklist-item">
                      <span className="success-checklist-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>Spesifikasi perangkat &amp; RFA tersimpan di antrean</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                onClick={() => {
                  setSuccessSubmittedRequest(null);
                  if (pastCutoff) {
                    openUrgentRequest();
                  } else {
                    openNewRequest();
                  }
                }}
              >
                Buat Request Baru
              </button>
              <button
                type="button"
                className="w-full sm:w-auto primary-button text-xs py-2.5"
                onClick={() => setSuccessSubmittedRequest(null)}
              >
                Selesai &amp; Lihat Dashboard
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CompletedList({
  requests,
  selectedDate,
  onDateChange,
  onOpen,
  onDelete,
  onDeleteAll,
}: {
  requests: ActivationRequest[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpen: (request: ActivationRequest) => void;
  onDelete: (request: ActivationRequest) => void;
  onDeleteAll: () => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  return (
    <div>
      <div className="page-heading mb-7">
        <span className="eyebrow completed-eyebrow"><CheckCircle2 size={13} /> COMPLETED HISTORY</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Daftar Aktivasi Selesai</h1>
        <p className="mt-2 text-sm text-slate-400">Lihat pekerjaan yang selesai hari ini atau pilih tanggal sebelumnya.</p>
      </div>
      <div className="data-panel overflow-hidden">
        <div className="panel-toolbar completed-toolbar flex flex-wrap items-center gap-4 p-4 lg:p-5">
          <div>
            <b className="text-sm text-white">Progress completed</b>
            <span className="mt-1 block text-xs text-slate-500">
              {selectedDate === "all"
                ? `${requests.length} pekerjaan selesai dari seluruh tanggal`
                : `${requests.length} pekerjaan selesai pada tanggal terpilih`}
            </span>
          </div>
          <div className="completed-toolbar-actions">
            <button
              type="button"
              className={`view-all-button ${selectedDate === "all" ? "active" : ""}`}
              aria-pressed={selectedDate === "all"}
              onClick={() => { onDateChange("all"); setCalendarOpen(false); }}
            >
              <ClipboardList size={15} /> View All
            </button>
            <div className="completed-date-filter">
              <span id="completed-date-label">Tanggal selesai</span>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="activation-date-trigger" aria-labelledby="completed-date-label completed-date-value">
                    <span id="completed-date-value">{selectedDate === "all" ? "Pilih tanggal" : formatActivationDate(selectedDate)}</span>
                    <CalendarDays size={17} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="activation-calendar-popover w-auto p-0" align="end">
                  <Calendar className="activation-calendar" mode="single"
                    selected={selectedDate === "all" ? undefined : new Date(selectedDate + "T00:00:00")}
                    defaultMonth={selectedDate === "all" ? undefined : new Date(selectedDate + "T00:00:00")}
                    onSelect={(date) => {
                      if (!date) return;
                      onDateChange([date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"));
                      setCalendarOpen(false);
                    }} />
                </PopoverContent>
              </Popover>
            </div>
            <button type="button" className="bulk-delete-button" disabled={!requests.length} onClick={onDeleteAll}>
              <Trash2 size={15} /> Hapus Semua
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="pending-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Waktu Selesai</th>
                <th>Area & Vendor</th>
                <th>PIC Provisioning</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => onOpen(item)}>
                  <td data-label="Customer"><button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }}>{item.customerName || item.siteId}</button><span>{item.siteId} · {item.subsId} · WO {item.woNumber}</span></td>
                  <td data-label="Waktu Selesai"><b className="capitalize">{formatActivationDate(getCompletedDate(item))}</b><span>{formatCompletedTime(item.completedAt)}</span></td>
                  <td data-label="Area & Vendor"><b>{item.area}</b><span>{item.vendorName}</span></td>
                  <td data-label="PIC Provisioning"><b>{item.provisioningPic}</b></td>
                  <td data-label="Aksi">
                    <button
                      type="button"
                      className="icon-action delete"
                      title="Hapus dari daftar selesai"
                      aria-label={`Hapus ${item.customerName || item.siteId}`}
                      onClick={(event) => { event.stopPropagation(); onDelete(item); }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!requests.length && (
          <div className="empty-state"><span><CheckCircle2 size={24} /></span><b>Belum ada pekerjaan selesai</b><p>Pilih tanggal lain untuk melihat riwayat completed.</p></div>
        )}
      </div>
    </div>
  );
}

function PendingList({
  requests,
  onOpen,
  onReschedule,
}: {
  requests: ActivationRequest[];
  onOpen: (request: ActivationRequest) => void;
  onReschedule: (request: ActivationRequest) => void;
}) {
  return (
    <div>
      <div className="page-heading mb-7">
        <span className="eyebrow"><CirclePause size={13} /> PENDING QUEUE</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Daftar Request Pending</h1>
        <p className="mt-2 text-sm text-slate-400">Pantau alasan kendala dan jadwalkan kembali aktivasi customer.</p>
      </div>
      <div className="data-panel overflow-hidden">
        <div className="panel-toolbar flex items-center gap-3 p-4 lg:p-5">
          <div>
            <b className="text-sm text-white">Semua status Pending</b>
            <span className="mt-1 block text-xs text-slate-500">{requests.length} request menunggu tindak lanjut</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="pending-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Jadwal Sebelumnya</th>
                <th>Reason Pending</th>
                <th>PIC Provisioning</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => onOpen(item)}>
                  <td data-label="Customer">
                    <button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }}>{item.customerName || item.siteId}</button>
                    <span>{item.siteId} · {item.subsId} · WO {item.woNumber}</span>
                  </td>
                  <td data-label="Jadwal Sebelumnya">
                    <b className="capitalize">{formatActivationDate(item.activationDate)}</b>
                    <span>{item.timeSlot}</span>
                  </td>
                  <td data-label="Reason Pending"><span className="pending-reason">{item.pendingReason || "-"}</span></td>
                  <td data-label="PIC Provisioning"><b>{item.provisioningPic}</b></td>
                  <td data-label="Tindakan">
                    <button
                      type="button"
                      className="reschedule-button"
                      onClick={(event) => { event.stopPropagation(); onReschedule(item); }}
                    >
                      <CalendarClock size={16} /> Jadwalkan Kembali
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!requests.length && (
          <div className="empty-state">
            <span><CheckCircle2 size={24} /></span>
            <b>Tidak ada request Pending</b>
            <p>Semua request sudah memiliki jadwal tindak lanjut.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RescheduleList({
  requests,
  onOpen,
  onReschedule,
}: {
  requests: ActivationRequest[];
  onOpen: (request: ActivationRequest) => void;
  onReschedule: (request: ActivationRequest) => void;
}) {
  return (
    <div>
      <div className="page-heading mb-7">
        <span className="eyebrow"><CalendarClock size={13} /> RESCHEDULE QUEUE</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Kelola Request Reschedule</h1>
        <p className="mt-2 text-sm text-slate-400">Ubah jadwal aktivasi dan pantau alasan perubahannya untuk setiap request.</p>
      </div>
      <div className="data-panel overflow-hidden">
        <div className="panel-toolbar flex flex-wrap items-center gap-3 p-4 lg:p-5">
          <div className="mr-auto">
            <b className="text-sm text-white">Semua request</b>
            <span className="mt-1 block text-xs text-slate-500">{requests.length} request dapat dijadwalkan ulang</span>
          </div>
          {requests.length > 0 && (
            <span className="text-xs text-slate-500">Alasan reschedule otomatis diberi awalan asal perubahan</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="pending-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Jadwal</th>
                <th>Alasan Reschedule</th>
                <th>PIC Provisioning</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => onOpen(item)}>
                  <td data-label="Customer">
                    <button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }}>{item.customerName || item.siteId}</button>
                    <span>{item.siteId} · {item.subsId} · WO {item.woNumber}</span>
                  </td>
                  <td data-label="Jadwal">
                    <b className="capitalize">{formatActivationDate(item.activationDate)}</b>
                    <span>{item.timeSlot}</span>
                  </td>
                  <td data-label="Alasan Reschedule">
                    <span className={`pending-reason ${item.rescheduleReason ? "" : "text-slate-600"}`}>{item.rescheduleReason || "-"}</span>
                  </td>
                  <td data-label="PIC Provisioning"><b>{item.provisioningPic}</b></td>
                  <td data-label="Tindakan">
                    <button
                      type="button"
                      className="reschedule-button"
                      title="Ubah jadwal aktivasi"
                      onClick={(event) => { event.stopPropagation(); onReschedule(item); }}
                    >
                      <CalendarClock size={16} /> Reschedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!requests.length && (
          <div className="empty-state">
            <span><CheckCircle2 size={24} /></span>
            <b>Tidak ada request</b>
            <p>Semua request sudah memiliki jadwal tindak lanjut.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UrgentApprovalList({
  requests,
  onOpen,
  onApprove,
  onReschedule,
  busy,
  canApprove = true,
}: {
  requests: ActivationRequest[];
  onOpen: (request: ActivationRequest) => void;
  onApprove: (request: ActivationRequest) => void;
  onReschedule: (request: ActivationRequest) => void;
  busy: boolean;
  canApprove?: boolean;
}) {
  return (
    <div>
      <div className="page-heading mb-7">
        <span className="eyebrow urgent-eyebrow"><Flame size={13} /> URGENT APPROVAL</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Waiting Approval</h1>
        <p className="mt-2 text-sm text-slate-400">Setujui untuk jadwal hari ini atau tentukan tanggal aktivasi baru.</p>
      </div>
      <div className="data-panel overflow-hidden">
        <div className="panel-toolbar flex items-center gap-3 p-4 lg:p-5">
          <div>
            <b className="text-sm text-white">Antrean request urgent</b>
            <span className="mt-1 block text-xs text-slate-500">Kelola approval request urgent langsung dari portal</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="pending-table">
            <thead><tr><th>Kode Approval</th><th>Customer</th><th>Jadwal Diajukan</th><th>PIC Provisioning</th><th>Tindakan</th></tr></thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => onOpen(item)}>
                  <td data-label="Kode Approval"><b className="approval-code">{item.approvalCode}</b></td>
                  <td data-label="Customer"><button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }}>{item.customerName || item.siteId}</button><span>{item.siteId} · {item.subsId}</span></td>
                  <td data-label="Jadwal Diajukan"><b className="capitalize">{formatActivationDate(item.activationDate)}</b><span>{item.timeSlot}</span></td>
                  <td data-label="PIC Provisioning"><b>{item.provisioningPic}</b></td>
                  <td data-label="Tindakan">
                    <div className="urgent-actions">
                      {canApprove ? (
                        <button type="button" className="approve-button" disabled={busy} onClick={(event) => { event.stopPropagation(); void onApprove(item); }}><CheckCircle2 size={16} /> Approve</button>
                      ) : (
                        <button type="button" className="approve-button opacity-40 cursor-not-allowed" disabled title="Hanya Superuser yang dapat menyetujui request urgent"><Lock size={15} /> Superuser Only</button>
                      )}
                      <button type="button" className="reschedule-button" disabled={busy} onClick={(event) => { event.stopPropagation(); onReschedule(item); }}><CalendarClock size={16} /> Reschedule</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!requests.length && (
          <div className="empty-state"><span><CheckCircle2 size={24} /></span><b>Tidak ada approval tertunda</b><p>Request urgent yang baru dibuat akan tampil di sini.</p></div>
        )}
      </div>
    </div>
  );
}

function RequestDetail({
  request,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
}: {
  request: ActivationRequest | null;
  onClose: () => void;
  onEdit: (request: ActivationRequest) => void;
  onDelete: (request: ActivationRequest) => void;
  canEdit?: boolean;
}) {
  return (
    <Sheet open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="detail-sheet w-full sm:max-w-xl">
        {request && (
          <>
            <SheetHeader className="detail-header">
              <span className="detail-kicker">DETAIL REQUEST AKTIVASI</span>
              <SheetTitle className="detail-title">
                {request.customerName || "Nama customer belum diisi"}
              </SheetTitle>
              <SheetDescription className="detail-description">
                {request.siteId} · {request.subsId}
              </SheetDescription>
              <span className={`detail-status status-${request.status.toLowerCase().replaceAll(" ", "-")}`}>
                {request.approvalStatus === "Waiting Approval" ? "Waiting Approval" : request.status}
              </span>
              {canEdit && (
                <div className="detail-actions">
                  <button type="button" onClick={() => onEdit(request)}><Pencil size={15} /> Edit</button>
                  <button type="button" className="danger" onClick={() => onDelete(request)}><Trash2 size={15} /> Hapus</button>
                </div>
              )}
            </SheetHeader>

            <div className="detail-scroll">
              <DetailSection title="Data Customer">
                <DetailItem label="Nama Customer" value={request.customerName || "-"} wide />
                <DetailItem label="Product Type" value={request.serviceType || "Belum ditentukan"} wide />
                <DetailItem
                  label="Work Type"
                  value={request.workType || [
                    request.isRelocation ? "Relocation" : "",
                    request.isRelayout ? "Relayout" : "",
                  ].filter(Boolean).join(" & ") || "-"}
                  wide
                />
                <DetailItem label="Site ID" value={request.siteId} />
                <DetailItem label="Subs ID" value={request.subsId} />
                <DetailItem label="Opportunity Number" value={request.oppNumber} />
                <DetailItem label="Work Order" value={request.woNumber} />
              </DetailSection>

              <DetailSection title="Jadwal Aktivasi">
                <DetailItem label="Hari & Tanggal" value={formatActivationDate(request.activationDate)} wide />
                <DetailItem label="Time" value={request.timeSlot} />
                <DetailItem label="Status" value={request.status} />
                {request.status === "Completed" && (
                  <DetailItem label="Waktu Selesai" value={`${formatActivationDate(getCompletedDate(request))} · ${formatCompletedTime(request.completedAt)}`} wide />
                )}
                {request.status === "Pending" && (
                  <DetailItem label="Reason Pending" value={request.pendingReason || "-"} wide />
                )}
                {request.rescheduleReason && (
                  <DetailItem label="Alasan Reschedule" value={request.rescheduleReason} wide />
                )}
                {request.requestType === "Urgent" && (
                  <>
                    <DetailItem label="Jenis Request" value="Urgent" />
                    <DetailItem label="Status Approval" value={request.approvalStatus} />
                    <DetailItem label="Kode Approval" value={request.approvalCode || "-"} wide />
                  </>
                )}
              </DetailSection>

              <DetailSection title="Area & PIC">
                <DetailItem label="Area" value={request.area} />
                <DetailItem label="Vendor" value={request.vendorName} />
                <DetailItem label="PIC Project" value={request.projectPic} />
                <DetailItem label="PIC Vendor" value={request.vendorPic} />
                <DetailItem label="PIC Provisioning" value={request.provisioningPic} wide />
              </DetailSection>

              <DetailSection title="Perangkat & RFA">
                <DetailItem label="Akses Media" value={request.accessMedia} />
                <DetailItem label="Bandwidth" value={request.bandwidth || "-"} />
                <DetailItem label="Jumlah Core" value={`${request.rfaCores} Core`} />
                <DetailItem label="Panjang Kabel" value={request.cableLength || "-"} />
                <DetailItem label="Type Kabel" value={request.cableType || "-"} />
                <DetailItem label="Kode FAT/ODP" value={request.fatOdpCode || "-"} />
                <DetailItem label="POP ID" value={request.popId || "-"} />
                <DetailItem label="Nama POP" value={request.popName || request.popAllocation || "-"} />
                <DetailItem label="Port Customer" value={request.customerPort || "-"} />
                <DetailItem label="Port OTB POP" value={request.popOtbPort || "-"} />
                <DetailItem label="Redaman" value={request.attenuation || "-"} />
                <DetailItem label="End to End" value={request.endToEnd || "-"} wide />
                <DetailItem label="IP" value={request.ipAddress || "-"} wide />
                <DetailItem label="Perangkat yang Dipasang" value={request.devicePlan} wide />
                <DetailItem
                  label="Install Switch"
                  value={request.installSwitch ? `Ya · ${request.switchBrand} · VLAN ${request.vlanSwitch || "?"}` : "Tidak"}
                  wide
                />
              </DetailSection>

              <DetailSection title="Catatan">
                <DetailItem label="Catatan Tambahan" value={request.notes || "-"} wide />
                {request.screenshotUrl && (
                  <div className="detail-item wide">
                    <span>Screenshot Bukti</span>
                    <a href={request.screenshotUrl} target="_blank" rel="noreferrer">
                      <img src={request.screenshotUrl} alt="Screenshot bukti request" className="detail-screenshot" />
                    </a>
                  </div>
                )}
              </DetailSection>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <div className="detail-grid">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`detail-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "orange" | "purple" | "green";
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <i><ArrowUpRight size={15} /></i>
    </div>
  );
}

function RequestForm({
  requests,
  form,
  setForm,
  busy,
  onSubmit,
  editing,
  urgent,
  onCancel,
}: {
  requests: ActivationRequest[];
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  busy: boolean;
  onSubmit: () => void;
  editing: boolean;
  urgent: boolean;
  onCancel: () => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotError, setScreenshotError] = useState("");
  const MAX_SCREENSHOT_BYTES = 20 * 1024 * 1024;
  async function uploadScreenshot(file: File) {
    setScreenshotError("");
    if (!file.type.startsWith("image/")) {
      setScreenshotError("File harus berupa gambar (screenshot).");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotError("Ukuran file maksimal 20MB.");
      return;
    }
    setScreenshotUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: data });
      const result = (await response.json()) as any;
      if (!response.ok) throw new Error(result.error || "Gambar gagal diunggah.");
      setForm((current) => ({ ...current, screenshotUrl: result.url }));
    } catch (error) {
      setScreenshotError(
        error instanceof Error ? error.message : "Gambar gagal diunggah.",
      );
    } finally {
      setScreenshotUploading(false);
    }
  }
  const counts = Object.fromEntries(slots.map((slot) => [slot, requests.filter((item) => item.activationDate === form.activationDate && item.timeSlot === slot).length]));
  const effectiveSlot = form.activationDate ? candidateSlots(form.timeSlot).find((slot) => counts[slot] < SLOT_CAPACITY) ?? "" : form.timeSlot;
  const scheduleFull = Boolean(form.activationDate) && !effectiveSlot;
  useEffect(() => {
    if (effectiveSlot && effectiveSlot !== form.timeSlot) setForm((current) => ({ ...current, timeSlot: effectiveSlot }));
  }, [effectiveSlot, form.timeSlot, setForm]);
  const input = (key: keyof typeof emptyForm) => ({
    value: (form[key] ?? "") as string | number,
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm({
        ...form,
        [key]:
          key === "rfaCores" ? Number(event.target.value) : event.target.value,
      }),
  });
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <span className="eyebrow"><ShieldCheck size={13} /> VENDOR SUBMISSION</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
          {editing ? "Edit Request Aktivasi" : urgent ? "Request New Urgent" : "Request Aktivasi Customer"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Lengkapi seluruh data agar jadwal dapat diverifikasi Team Provisioning.
        </p>
        <div className="request-window open">
          <Clock3 size={18} />
          <div>
            <b>{editing ? "Mode edit request" : urgent ? "Memerlukan Approval" : "Pengajuan request dibuka"}</b>
            <span>{editing ? "Perbarui data lalu simpan perubahan." : urgent ? "Request akan masuk ke menu Urgent Approval untuk disetujui atau dijadwalkan ulang." : "Request reguler dibuka sampai pukul 17:00 WIB. Setelah itu, gunakan Request Urgent."}</span>
          </div>
        </div>
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <FormSection number="01" title="Jadwal Aktivasi" icon={<CalendarDays size={18} />}>
          <div className="form-grid">
            <Field label="Tanggal Aktivasi">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild><button type="button" className="activation-date-trigger"><span>{form.activationDate ? formatActivationDate(form.activationDate) : "Pilih tanggal aktivasi"}</span><CalendarDays size={19} /></button></PopoverTrigger>
                <PopoverContent className="activation-calendar-popover w-auto p-0" align="start">
                  <Calendar className="activation-calendar" mode="single" selected={form.activationDate ? new Date(form.activationDate + "T00:00:00") : undefined} onSelect={(date) => {
                    if (!date) return;
                    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
                    const next = slots.find((slot) => requests.filter((item) => item.activationDate === value && item.timeSlot === slot).length < SLOT_CAPACITY);
                    setForm({ ...form, activationDate: value, timeSlot: next ?? slots[0] });
                    setCalendarOpen(false);
                  }} />
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="Time Aktivasi" wide>
              <div className="slot-grid">
                {slots.map((slot, index) => <label key={slot} className={[effectiveSlot === slot ? "selected" : "", counts[slot] >= SLOT_CAPACITY ? "slot-full" : ""].join(" ")}>
                  <input type="radio" name="slot" value={slot} disabled={!form.activationDate || counts[slot] >= SLOT_CAPACITY} checked={effectiveSlot === slot} onChange={(event) => setForm({ ...form, timeSlot: event.target.value })} />
                  <b>Slot {index + 1}</b><span>{slot}</span><span>{form.activationDate ? counts[slot] + "/10 request" + (counts[slot] >= SLOT_CAPACITY ? " · Penuh" : "") : "Pilih tanggal dahulu"}</span>
                </label>)}
              </div>
            </Field>
            <p className="wide date-preview" role="status">{scheduleFull ? "Slot penuh. Pilih slot sebelumnya yang tersedia atau tanggal lain." : "Maksimal 10 request per slot. Slot penuh otomatis dialihkan ke slot berikutnya."}</p>
            <Field label="Catatan Tambahan" wide><textarea rows={3} placeholder="Kebutuhan akses, kendala lokasi, atau informasi tambahan" {...input("notes")} /></Field>
          </div>
        </FormSection>
        <FormSection number="02" title="Data Customer" icon={<Building2 size={18} />}>
          <div className="form-grid">
            <Field label="Nama Customer" wide>
              <input
                required
                placeholder="Nama perusahaan atau customer"
                {...input("customerName")}
              />
            </Field>
<Field label="Product Type" wide>
                <select required {...input("serviceType")}>
                  <option value="" disabled>Pilih Product Type</option>
                {serviceTypes.map((service) => <option key={service}>{service}</option>)}
              </select>
            </Field>
            <Field label="Work Type" wide>
              <select required={!editing} {...input("workType")}>
                <option value="" disabled={!editing}>Pilih Work Type</option>
                {workTypes.map((workType) => <option key={workType}>{workType}</option>)}
              </select>
            </Field>
            <Field label="Site ID">
              <input required placeholder="S007xxxx" {...input("siteId")} />
            </Field>
            <Field label="Subs ID">
              <input required placeholder="SI07xxxx" {...input("subsId")} />
            </Field>
            <Field label="Opportunity Number">
              <input
                required
                placeholder="123456/OPT-..."
                {...input("oppNumber")}
              />
            </Field>
            <Field label="Work Order">
              <input required placeholder="021xxxxx" {...input("woNumber")} />
            </Field>
            <Field label="Bandwidth">
              <div className="bandwidth-group">
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Contoh: 1"
                  value={readBandwidthNumber(form.bandwidth)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      bandwidth: event.target.value
                        ? `${event.target.value} ${form.bandwidthUnit}`
                        : "",
                    })
                  }
                />
                <select
                  required
                  aria-label="Satuan bandwidth"
                  value={form.bandwidthUnit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      bandwidthUnit: event.target.value,
                      bandwidth: readBandwidthNumber(form.bandwidth)
                        ? `${readBandwidthNumber(form.bandwidth)} ${event.target.value}`
                        : "",
                    })
                  }
                >
                  <option value="Mbps">Mbps</option>
                  <option value="Gbps">Gbps</option>
                </select>
              </div>
            </Field>
          </div>
        </FormSection>
        <FormSection number="03" title="Area & Penanggung Jawab" icon={<ShieldCheck size={18} />}>
          <div className="form-grid">
            <Field label="Area">
              <input
                required
                placeholder="Jakarta / Jawa Barat / ..."
                {...input("area")}
              />
            </Field>
            <Field label="Nama Vendor">
              <input
                required
                placeholder="Nama perusahaan vendor"
                {...input("vendorName")}
              />
            </Field>
            <Field label="PIC Project">
              <input
                required
                placeholder="Nama PIC Project"
                {...input("projectPic")}
              />
            </Field>
            <Field label="PIC Vendor">
              <input
                required
                placeholder="Nama dan nomor kontak"
                {...input("vendorPic")}
              />
            </Field>
            <Field label="PIC Provisioning">
              <select {...input("provisioningPic")}>
                {pics.map((pic) => (
                  <option key={pic}>{pic}</option>
                ))}
              </select>
            </Field>
            <Field label="Akses Media">
              <select {...input("accessMedia")}>
                <option>GPON</option>
                <option>Interkoneksi</option>
                <option>Existing Link</option>
                <option>DWDM</option>
                <option>M2M</option>
                <option>METRO</option>
                <option>SDWAN</option>
                <option>Skyfiber</option>
                <option>UTP</option>
                <option>VSAT</option>
                <option>Wireless</option>
              </select>
            </Field>
          </div>
        </FormSection>
        <FormSection number="04" title="Perangkat & RFA" icon={<RadioTower size={18} />}>
          <div className="form-grid">
            {!noIpServiceTypes.includes(form.serviceType) && (
              <Field label="IP" wide>
                <input
                  required
                  placeholder="Contoh: 103.84.2.0/30"
                  {...input("ipAddress")}
                />
              </Field>
            )}
            <Field label="Perangkat yang Dipasang" wide>
              <textarea
                required
                rows={3}
                placeholder="Contoh: SFP 10G 20 km, MC220, Router MikroTik…"
                {...input("devicePlan")}
              />
            </Field>
            <Field label="Additional Perangkat" wide>
              <div className="switch-install-control">
                <label className={form.installSwitch ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={form.installSwitch}
                    onChange={(event) => setForm({
                      ...form,
                      installSwitch: event.target.checked,
                      switchBrand: event.target.checked ? form.switchBrand : "",
                      vlanSwitch: event.target.checked ? form.vlanSwitch : "",
                    })}
                  />
                  <span>Install Switch</span>
                </label>
                {form.installSwitch && (
                  <div className="switch-install-fields">
                    <select
                      required
                      value={form.switchBrand}
                      onChange={(event) => setForm({ ...form, switchBrand: event.target.value })}
                      aria-label="Pilih merek switch"
                    >
                      <option value="" disabled>Pilih Switch</option>
                      {switchBrands.map((brand) => <option key={brand}>{brand}</option>)}
                    </select>
                    <input
                      required
                      value={form.vlanSwitch}
                      onChange={(event) => setForm({ ...form, vlanSwitch: event.target.value })}
                      placeholder="VLAN Switch"
                      aria-label="VLAN Switch"
                    />
                  </div>
                )}
              </div>
            </Field>
            {!['Interkoneksi', 'Existing Link'].includes(form.accessMedia) && <>
            <Field label="Jumlah Core RFA">
              <input
                required
                min={1}
                type="number"
                {...input("rfaCores")}
              />
            </Field>
            <Field label="Panjang Kabel">
              <input
                required
                placeholder="Contoh: 500 meter"
                {...input("cableLength")}
              />
            </Field>
            <Field label="Type Kabel">
              <input
                required
                placeholder="Contoh: FO 1 Core / 2 Core"
                {...input("cableType")}
              />
            </Field>
            <Field label="Kode FAT/ODP (Opsional)">
              <input
                placeholder="Isi jika tersedia, atau lewati"
                {...input("fatOdpCode")}
              />
            </Field>
            <Field label="Redaman">
              <input
                required
                placeholder="Contoh: -18 dBm"
                {...input("attenuation")}
              />
            </Field>
            <Field label="Port Customer">
              <input
                required
                placeholder="Port terminasi di customer"
                {...input("customerPort")}
              />
            </Field>
            <Field label="Port OTB POP">
              <input
                required
                placeholder="Port terminasi OTB di POP"
                {...input("popOtbPort")}
              />
            </Field>
            <Field label="POP ID">
              <input
                required
                placeholder="Contoh: JAW-JI-SMP1-0003"
                {...input("popId")}
              />
            </Field>
            <Field label="Nama POP">
              <input
                required
                placeholder="Contoh: POP Madura Sumenep"
                {...input("popName")}
              />
            </Field>
            <Field label="End to End" wide>
              <textarea
                required
                rows={3}
                placeholder="Informasi jalur atau terminasi end-to-end"
                {...input("endToEnd")}
              />
            </Field>
            </>}
            {["Interkoneksi", "Existing Link"].includes(form.accessMedia) && (
              <div className="interconnection-note wide">
                <ShieldCheck size={18} />
                <span><b>Mode {form.accessMedia}</b> Data RFA tidak diwajibkan. Lengkapi perangkat yang akan dipasang.</span>
              </div>
            )}
          </div>
        </FormSection>
        {urgent && (
          <FormSection number="05" title="Screenshot Bukti" icon={<ClipboardList size={18} />}>
            <div className="form-grid">
              <Field label="Screenshot Bukti Urgent" wide>
                <div className="screenshot-upload">
                  {form.screenshotUrl ? (
                    <div className="screenshot-preview">
                      <img src={form.screenshotUrl} alt="Screenshot bukti urgent" />
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={screenshotUploading}
                        onClick={() => setForm((current) => ({ ...current, screenshotUrl: "" }))}
                      >
                        Hapus screenshot
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="screenshot-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={screenshotUploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadScreenshot(file);
                          }}
                        />
                        <ImagePlus size={30} />
                        <b>{screenshotUploading ? "Mengunggah gambar…" : "Klik untuk pilih screenshot"}</b>
                        <small>Wajib untuk request urgent · format JPG/PNG · maksimal 20MB</small>
                      </div>
                    </>
                  )}
                  {screenshotError && <span className="screenshot-error">{screenshotError}</span>}
                </div>
              </Field>
            </div>
          </FormSection>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          {editing && (
            <button disabled={busy} className="secondary-button" type="button" onClick={onCancel}>
              Batal
            </button>
          )}
          <button
            disabled={busy || screenshotUploading || !form.activationDate || scheduleFull}
            className="primary-button min-w-48"
            type="submit"
          >
            {busy ? (
              editing ? "Menyimpan…" : "Mengirim…"
            ) : (
              <>
                <Send size={18} />
                {editing ? "Simpan perubahan" : urgent ? "Kirim request urgent" : "Kirim request"}
                <ChevronRight size={17} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  number,
  title,
  children,
  icon,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="section-title">
        <span>{number}</span>
        <div>{icon}</div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>{label}</span>
      {children}
    </label>
  );
}
