"use client";

import { slots, SLOT_CAPACITY, candidateSlots } from "@/lib/scheduling";
import { exportWithScheduleTemplate } from "@/lib/schedule-template-export";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CircleAlert,
  Clock3,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  CirclePause,
  Flame,
  MessageCircle,
  RadioTower,
  Search,
  Send,
  ImagePlus,
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ActivationRequest = {
  id: string;
  createdAt: string;
  deadline: string;
  activationDate: string;
  activationDay: string;
  timeSlot: string;
  email: string;
  area: string;
  regionScope: string;
  vendorName: string;
  accessMedia: string;
  serviceType: string;
  workType: string;
  isRelocation: boolean;
  isRelayout: boolean;
  customerName: string;
  customerContact: string;
  activationPic: string;
  siteId: string;
  subsId: string;
  siteName: string;
  oppNumber: string;
  woNumber: string;
  devicePlan: string;
  installSwitch: boolean;
  switchBrand: string;
  vlanSwitch: string;
  switchPopPortAllocation: string;
  customerIp: string;
  buildType: string;
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
  odpFatPort: string;
  fatCoordinates: string;
  bandwidth: string;
  bandwidthIx: string;
  bandwidthIix: string;
  localLoop: string;
  coordinationProof: string;
  projectPic: string;
  vendorPic: string;
  provisioningPic: string;
  status: string;
  completedAt: string;
  pendingReason: string;
  rescheduleReason: string;
  picRescheduleReason: string;
  picRescheduleDate: string;
  picRescheduleTimeSlot: string;
  vendorRescheduleDate: string;
  vendorRescheduleTimeSlot: string;
  rescheduleApprovalStatus: string;
  rescheduleRequestedBy: string;
  rescheduleOriginalStatus: string;
  rescheduleApprovalReason: string;
  rescheduleApprovedBy: string;
  rescheduleApprovedAt: string;
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
  regionScope: string;
};

type RequestsResponse = {
  requests?: ActivationRequest[];
  picCounts?: Record<string, number>;
  slotCounts?: Record<string, number>;
  serverNow?: { date: string; hour: number; minute: number };
  error?: string;
};

type AuthResponse = { user?: CurrentUser; error?: string };
type MutationResponse = { request: ActivationRequest; error?: string };

function displayRegionScope(regionScope: string) {
  const normalized = regionScope.trim().toLowerCase();
  if (normalized === "jabojabar") return "JABO/JABAR";
  if (normalized === "jabo") return "JABO";
  if (normalized === "regional") return "REGIONAL";
  return regionScope.trim().toUpperCase();
}

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
const bandwidthUnits = ["Mbps", "Gbps"];
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
const noRfaAccessMedia = ["Interkoneksi", "Existing Link"];
const noIpServiceTypes = [
  "MWIFO - FO - Internet Service - Broadband Up To",
  "MWIFO - GSM - Internet Service - Dedicated - M2M",
  "VSAT - VSAT - Internet Service - Dedicated",
  "MWIFO - Wireless - BOD Internet Skyfiber",
];
const projectPics = [
  "Andi Prayudi", "Andy", "Anfal", "Azis", "Candra", "Dedi Irawan", "Devri",
  "Eko", "Enggar", "Fahmi", "Firman", "Gondo", "Handi", "Ibnu", "Iman",
  "Irfan Arfandi", "Masturi", "Matyas", "Melisa", "Pringgo", "Saepul",
  "Septian", "Sofian", "Ubaydillah", "Udawan", "Uswa", "Wawan", "Yafizham", "Zillah",
];
const statuses = [
  "Idle",
  "Request Approval",
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

function slotStartMinutes(slot: string) {
  const match = slot.match(/^(\d{2})\.(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function isSlotOpen(slot: string, date: string, serverNow: { date: string; hour: number; minute: number }) {
  if (!date || date > serverNow.date) return true;
  if (date < serverNow.date) return false;
  return serverNow.hour * 60 + serverNow.minute >= slotStartMinutes(slot);
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

function formatActivationDay(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
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
  activationDay: "",
  timeSlot: slots[0],
  email: "",
  area: "",
  vendorName: "",
  accessMedia: "METRO",
  serviceType: "",
  workType: "",
  isRelocation: false,
  isRelayout: false,
  customerName: "",
  customerContact: "",
  activationPic: "",
  siteId: "",
  subsId: "",
  siteName: "",
  oppNumber: "",
  woNumber: "",
  devicePlan: "",
  installSwitch: false,
  switchBrand: "",
  vlanSwitch: "",
  switchPopPortAllocation: "",
  customerIp: "",
  buildType: "",
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
  odpFatPort: "",
  fatCoordinates: "",
  bandwidth: "",
  bandwidthIx: "",
  bandwidthIix: "",
  localLoop: "",
  coordinationProof: "",
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

function SidebarNav({
  currentUser,
  view,
  pastCutoff,
  urgentCount,
  pendingCount,
  rescheduleCount,
  completedCount,
  onDashboard,
  onNewRequest,
  onUrgentRequest,
  onUrgent,
  onPending,
  onReschedules,
  onCompleted,
}: {
  currentUser: CurrentUser | null;
  view: string;
  pastCutoff: boolean;
  urgentCount: number;
  pendingCount: number;
  rescheduleCount: number;
  completedCount: number;
  onDashboard: () => void;
  onNewRequest: () => void;
  onUrgentRequest: () => void;
  onUrgent: () => void;
  onPending: () => void;
  onReschedules: () => void;
  onCompleted: () => void;
}) {
  const isVendor = currentUser?.role === "vendor_user";
  return (
    <>
      <div className="sidebar-group">
        <div className="sidebar-group-label">WORKSPACE</div>
        <button
          type="button"
          onClick={onDashboard}
          className={`nav-button ${view === "dashboard" ? "active" : ""}`}
        >
          <LayoutDashboard size={18} />
          {isVendor ? "Dashboard Saya" : "Dashboard"}
        </button>
        <button
          type="button"
          onClick={onNewRequest}
          disabled={pastCutoff}
          title={pastCutoff ? "Pengajuan reguler tutup pukul 17:00 WIB" : undefined}
          className={`nav-button ${view === "form" ? "active" : ""} ${pastCutoff ? "disabled" : ""}`}
        >
          {pastCutoff ? <Lock size={18} /> : <Plus size={18} />}
          Request Baru
        </button>
        <button
          type="button"
          onClick={onUrgentRequest}
          className={`nav-button urgent-nav ${view === "urgentForm" ? "active" : ""}`}
        >
          <Flame size={18} />
          Request Urgent
        </button>
      </div>
      <div className="sidebar-group">
        <div className="sidebar-group-label">FOLLOW-UP</div>
        {!isVendor && (
          <button
            type="button"
            onClick={onUrgent}
            className={`nav-button ${view === "urgent" ? "active" : ""}`}
          >
            <MessageCircle size={18} />
            Approval Urgent
            {urgentCount > 0 && <span className="nav-count urgent-count">{urgentCount}</span>}
          </button>
        )}
        <button
          type="button"
          onClick={onPending}
          className={`nav-button ${view === "pending" ? "active" : ""}`}
        >
          <CirclePause size={18} />
          {isVendor ? "PIC Updates" : "Pending / On Hold"}
          {pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
        </button>
        <button
          type="button"
          onClick={onReschedules}
          className={`nav-button ${view === "rescheduleQueue" || view === "myReschedules" ? "active" : ""}`}
        >
          <CalendarClock size={18} />
          {isVendor ? "My Reschedule" : "Vendor Reschedule"}
          {rescheduleCount > 0 && <span className="nav-count">{rescheduleCount}</span>}
        </button>
      </div>
      {!isVendor && (
        <div className="sidebar-group">
          <div className="sidebar-group-label">HISTORY</div>
          <button
            type="button"
            onClick={onCompleted}
            className={`nav-button ${view === "completed" ? "active" : ""}`}
          >
            <CheckCircle2 size={18} />
            Selesai
            {completedCount > 0 && <span className="nav-count completed-count">{completedCount}</span>}
          </button>
        </div>
      )}
    </>
  );
}

const PAGE_SIZE = 10;

function paginate<T>(items: T[], page: number): { page: number; totalPages: number; items: T[] } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    totalPages,
    items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
  };
}

function PaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= PAGE_SIZE) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalItems);
  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Menampilkan {from}–{to} dari {totalItems} data
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <span className="pagination-current">Halaman {page} / {totalPages}</span>
        <button
          type="button"
          className="pagination-button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "form" | "urgentForm" | "urgent" | "pending" | "rescheduleQueue" | "myReschedules" | "completed">("dashboard");
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [picCounts, setPicCounts] = useState<Record<string, number>>({});
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [serverNow, setServerNow] = useState(() => getWibClock());
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
  const [rescheduleCalendarOpen, setRescheduleCalendarOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState(slots[0]);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState<"pic" | "vendor" | "urgent">("pic");
  const [rescheduleApprovalTarget, setRescheduleApprovalTarget] = useState<ActivationRequest | null>(null);
  const [rescheduleApprovalCalendarOpen, setRescheduleApprovalCalendarOpen] = useState(false);
  const [rescheduleApprovalDate, setRescheduleApprovalDate] = useState("");
  const [rescheduleApprovalSlot, setRescheduleApprovalSlot] = useState(slots[0]);
  const [rescheduleApprovalReason, setRescheduleApprovalReason] = useState("");
  const [rescheduleApprovalDecision, setRescheduleApprovalDecision] = useState<"Approved" | "Rejected">("Approved");
  const [switchEmailTarget, setSwitchEmailTarget] = useState<ActivationRequest | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ActivationRequest | null>(null);
  const [pendingCalendarOpen, setPendingCalendarOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState("");
  const [pendingSlot, setPendingSlot] = useState(slots[0]);
  const [pendingReason, setPendingReason] = useState("");
  const [requestTypeDialog, setRequestTypeDialog] = useState(false);
  const [completedDateFilter, setCompletedDateFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [tablePage, setTablePage] = useState(1);

  // 17:00 WIB cutoff — refreshed every minute
  const [pastCutoff, setPastCutoff] = useState(() => getWibClock().hour >= CUTOFF_HOUR);
  useEffect(() => {
    const tick = () => setPastCutoff(getWibClock().hour >= CUTOFF_HOUR);
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Hide header saat scroll ke bawah, tampilkan kembali saat scroll ke atas
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y > 160 && delta > 10) setHeaderHidden(true);
      else if (delta < -10 || y <= 160) setHeaderHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function load() {
    const response = await fetch("/api/requests", { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (response.status === 503) {
      setRequests([]);
      setPicCounts({});
      setSlotCounts({});
      return;
    }
    const data = (await response.json()) as RequestsResponse;
    if (!response.ok) throw new Error(data.error);
    setRequests(data.requests ?? []);
    setPicCounts(data.picCounts ?? {});
    setSlotCounts(data.slotCounts ?? {});
    if (data.serverNow) setServerNow(data.serverNow);
  }

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const data = (await res.json()) as AuthResponse;
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

  async function submit(payload = form, urgent = false) {
    const response = await fetch("/api/requests", {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : { ...payload, requestType: urgent ? "Urgent" : "Regular" }),
    });
    const data = (await response.json()) as MutationResponse;
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
    // WebMCP registration intentionally captures the initial submit handler once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = getWibClock().date;
  const filtered = useMemo(
    () =>
      requests.filter((item) => {
        if (overdueOnly && !(item.activationDate < today && item.status !== "Completed")) return false;
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
    [requests, query, statusFilter, overdueOnly, today],
  );

  // Reset & jaga halaman tetap valid saat filter / data berubah
  const [prevTableFilter, setPrevTableFilter] = useState({ query, statusFilter, overdueOnly });
  if (prevTableFilter.query !== query || prevTableFilter.statusFilter !== statusFilter || prevTableFilter.overdueOnly !== overdueOnly) {
    setPrevTableFilter({ query, statusFilter, overdueOnly });
    setTablePage(1);
  }
  const tableMaxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (tablePage > tableMaxPage) setTablePage(tableMaxPage);

  const tableInfo = paginate(filtered, tablePage);

  async function exportScheduleTemplate() {
    try {
      await exportWithScheduleTemplate(`Schedule-Aktivasi-${today}`, filtered);
      setMessage(`Export template berhasil dibuat untuk ${filtered.length} request.`, "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export template gagal dibuat.");
    }
  }

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
      const picked = usableSchedule(item.activationDate, item.timeSlot);
      setPendingTarget(item);
      setPendingDate(picked.date);
      setPendingSlot(picked.slot);
      setPendingReason(item.pendingReason || "");
      return;
    }
    if (status === "Reschedule") {
      openReschedule(item);
      return;
    }
    void updateRequest(item.id, "status", status);
  }

  function usableSchedule(date: string, slot: string) {
    const anyOpenOnDate = date && slots.some((candidate) => isSlotOpen(candidate, date, serverNow));
    const effectiveDate = anyOpenOnDate ? date : serverNow.date;
    const preferred = slot && isSlotOpen(slot, effectiveDate, serverNow) ? slot : "";
    const effectiveSlot = preferred || slots.find((candidate) => isSlotOpen(candidate, effectiveDate, serverNow)) || slots[0];
    return { date: effectiveDate, slot: effectiveSlot };
  }

  function openReschedule(item: ActivationRequest, mode: "pic" | "vendor" = currentUser?.role === "vendor_user" ? "vendor" : "pic") {
    const picked = usableSchedule(mode === "vendor" ? item.vendorRescheduleDate || item.activationDate : item.picRescheduleDate || item.activationDate, mode === "vendor" ? item.vendorRescheduleTimeSlot || item.timeSlot : item.picRescheduleTimeSlot || item.timeSlot);
    setRescheduleTarget(item);
    setRescheduleDate(picked.date);
    setRescheduleSlot(picked.slot);
    setRescheduleReason(mode === "vendor" ? item.rescheduleReason || "" : item.picRescheduleReason || "");
    setRescheduleMode(mode);
  }

  function openUrgentReschedule(item: ActivationRequest) {
    const picked = usableSchedule(item.activationDate, item.timeSlot);
    setRescheduleTarget(item);
    setRescheduleDate(picked.date);
    setRescheduleSlot(picked.slot);
    setRescheduleReason("");
    setRescheduleMode("urgent");
  }

  function openRescheduleApproval(item: ActivationRequest, decision: "Approved" | "Rejected" = "Approved") {
    const picked = usableSchedule(item.rescheduleRequestedBy === "vendor" ? item.vendorRescheduleDate : item.picRescheduleDate, item.rescheduleRequestedBy === "vendor" ? item.vendorRescheduleTimeSlot : item.picRescheduleTimeSlot);
    setRescheduleApprovalTarget(item);
    setRescheduleApprovalDate(picked.date);
    setRescheduleApprovalSlot(picked.slot);
    setRescheduleApprovalReason("");
    setRescheduleApprovalDecision(decision);
  }

  async function saveRescheduleApproval() {
    if (!rescheduleApprovalTarget || !rescheduleApprovalReason.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: rescheduleApprovalTarget.id,
          rescheduleDecision: rescheduleApprovalDecision,
          activationDate: rescheduleApprovalDate,
          timeSlot: rescheduleApprovalSlot,
          rescheduleApprovalReason: rescheduleApprovalReason.trim(),
        }),
      });
      const data = (await response.json()) as MutationResponse;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) => current.map((item) => item.id === rescheduleApprovalTarget.id ? data.request : item));
      setRescheduleApprovalTarget(null);
      setRescheduleApprovalReason("");
      setMessage(rescheduleApprovalDecision === "Approved" ? "Reschedule disetujui." : "Reschedule ditolak.", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval reschedule gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function savePending() {
    if (!pendingTarget || !pendingDate || !pendingSlot || !pendingReason.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: pendingTarget.id,
          status: "Pending",
          activationDate: pendingDate,
          timeSlot: pendingSlot,
          pendingReason: pendingReason.trim(),
        }),
      });
      const data = (await response.json()) as MutationResponse;
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
    const vendorReschedule = rescheduleMode === "vendor";
    const urgentReschedule = rescheduleMode === "urgent";
    if (!rescheduleTarget || !rescheduleDate || !rescheduleSlot) return;
    if (!urgentReschedule && !rescheduleReason.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(urgentReschedule
          ? {
              id: rescheduleTarget.id,
              rescheduleUrgent: true,
              activationDate: rescheduleDate,
              timeSlot: rescheduleSlot,
            }
          : {
              id: rescheduleTarget.id,
              status: vendorReschedule ? "Reschedule" : "Pending",
              activationDate: rescheduleDate,
              timeSlot: rescheduleSlot,
              ...(vendorReschedule ? { rescheduleReason: rescheduleReason.trim() } : { picRescheduleReason: rescheduleReason.trim() }),
            }),
      });
      const data = (await response.json()) as MutationResponse;
      if (!response.ok) throw new Error(data.error);
      setRequests((current) =>
        current.map((item) => item.id === rescheduleTarget.id ? data.request : item),
      );
      setSelectedRequest((current) => current?.id === rescheduleTarget.id ? data.request : current);
      setRescheduleTarget(null);
      setRescheduleReason("");
      setMessage(urgentReschedule
        ? "Jadwal request urgent berhasil diubah."
        : vendorReschedule ? "Vendor Reschedule berhasil diajukan untuk approval PIC." : "PIC Reschedule berhasil disimpan dan diinformasikan ke vendor.", "success");
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
      const data = (await response.json()) as MutationResponse;
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
      activationDay: item.activationDay || "",
      timeSlot: item.timeSlot,
      email: item.email || "",
      area: item.area,
      vendorName: item.vendorName,
      accessMedia: item.accessMedia,
      serviceType: item.serviceType || "",
      workType: item.workType || "",
      isRelocation: Boolean(item.isRelocation),
      isRelayout: Boolean(item.isRelayout),
      customerName: item.customerName,
      customerContact: item.customerContact || "",
      activationPic: item.activationPic || "",
      siteId: item.siteId,
      subsId: item.subsId,
      siteName: item.siteName || "",
      oppNumber: item.oppNumber,
      woNumber: item.woNumber,
      devicePlan: item.devicePlan,
      installSwitch: Boolean(item.installSwitch),
      switchBrand: item.switchBrand || "",
      vlanSwitch: item.vlanSwitch || "",
      switchPopPortAllocation: item.switchPopPortAllocation || "",
      customerIp: item.customerIp || "",
      buildType: item.buildType || "",
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
      odpFatPort: item.odpFatPort || "",
      fatCoordinates: item.fatCoordinates || "",
      bandwidth: item.bandwidth || "",
      bandwidthIx: item.bandwidthIx || "",
      bandwidthIix: item.bandwidthIix || "",
      localLoop: item.localLoop || "",
      coordinationProof: item.coordinationProof || "",
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
      const data = (await response.json()) as MutationResponse;
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
  const onHoldRequests = requests.filter((r) => r.status === "Pending" && !r.rescheduleApprovalStatus);
  const vendorRescheduleRequests = requests.filter((r) => r.status === "Reschedule" && r.rescheduleApprovalStatus === "Pending PIC Approval");
  const picUpdatesRequests = onHoldRequests;
  const myRescheduleRequests = vendorRescheduleRequests.filter((r) => r.rescheduleRequestedBy === "vendor");
  const urgentRequests = requests.filter((r) => r.approvalStatus === "Waiting Approval");
  const overdueRequests = requests.filter((r) => r.activationDate < today && !["Completed", "Pending"].includes(r.status) && r.approvalStatus !== "Waiting Approval");
  const attentionItems = [
    ...(currentUser?.role !== "vendor_user" ? [{
      key: "urgent",
      label: "Approval urgent",
      description: "Request urgent menunggu keputusan",
      count: urgentRequests.length,
      icon: <MessageCircle size={18} />,
      tone: "urgent",
      onClick: () => { setOverdueOnly(false); setView("urgent"); },
    }] : []),
    {
      key: "pending",
      label: currentUser?.role === "vendor_user" ? "PIC updates" : "Pending / on hold",
      description: currentUser?.role === "vendor_user" ? "Request yang perlu diperbarui" : "Request yang tertahan",
      count: onHoldRequests.length,
      icon: <CirclePause size={18} />,
      tone: "pending",
      onClick: () => { setOverdueOnly(false); setView("pending"); },
    },
    ...(currentUser?.role !== "vendor_user" ? [{
      key: "reschedule",
      label: "Vendor reschedule",
      description: "Menunggu approval jadwal baru",
      count: vendorRescheduleRequests.length,
      icon: <CalendarClock size={18} />,
      tone: "reschedule",
      onClick: () => { setOverdueOnly(false); setView("rescheduleQueue"); },
    }] : [{
      key: "reschedule",
      label: "My reschedule requests",
      description: "Pengajuan jadwal yang sedang diproses",
      count: myRescheduleRequests.length,
      icon: <CalendarClock size={18} />,
      tone: "reschedule",
      onClick: () => { setOverdueOnly(false); setView("myReschedules"); },
    }]),
    {
      key: "overdue",
      label: "Melewati jadwal",
      description: "Aktivasi belum selesai sesuai tanggal",
      count: overdueRequests.length,
      icon: <ShieldAlert size={18} />,
      tone: "overdue",
      onClick: () => { setOverdueOnly(true); setView("dashboard"); },
    },
  ];

  const hamburgerNoticeCount =
    (currentUser?.role !== "vendor_user" ? urgentRequests.length : 0)
    + (currentUser?.role === "vendor_user" ? picUpdatesRequests.length : onHoldRequests.length)
    + (currentUser?.role === "vendor_user" ? myRescheduleRequests.length : vendorRescheduleRequests.length);

  const closeMobileNav = () => setMobileNavOpen(false);
  const goDashboard = () => { closeMobileNav(); setView("dashboard"); setOverdueOnly(false); setEditingId(null); setForm(emptyForm); };
  const goNewRequest = () => { closeMobileNav(); openNewRequest(); };
  const goUrgentRequest = () => { closeMobileNav(); openUrgentRequest(); };
  const goUrgent = () => { closeMobileNav(); setView("urgent"); setEditingId(null); setSelectedRequest(null); };
  const goPending = () => { closeMobileNav(); setView("pending"); setEditingId(null); setSelectedRequest(null); };
  const goReschedules = () => { closeMobileNav(); setView(currentUser?.role === "vendor_user" ? "myReschedules" : "rescheduleQueue"); setEditingId(null); setSelectedRequest(null); };
  const goCompleted = () => { closeMobileNav(); setView("completed"); setEditingId(null); setSelectedRequest(null); };

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
      <header className={`portal-header px-5 py-4 lg:px-10 ${headerHidden ? "portal-header-hidden" : ""}`}>
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div className="brand-lockup">
            <span className="brand-logo-shell">
              <Image
                src="/iforte-logo.png"
                alt="iForte"
                width={132}
                height={40}
                priority
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
                <div className="text-right">
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
                  {currentUser.role === "vendor_user" && currentUser.regionScope && (
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 mt-1">
                      Region: {displayRegionScope(currentUser.regionScope)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Logout"
                  className="hidden md:flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-400 border border-slate-800 text-xs font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 active:scale-[.96] cursor-pointer"
                >
                  <LogOut size={15} />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka menu navigasi"
              className="hamburger-button md:hidden"
            >
              <Menu size={20} />
              {hamburgerNoticeCount > 0 && (
                <span className="hamburger-notice">{hamburgerNoticeCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="portal-content-grid mx-auto grid max-w-[1500px] gap-7 px-4 py-7 lg:grid-cols-[236px_minmax(0,1fr)] lg:px-10">
        <aside className="portal-sidebar flex gap-2 lg:flex-col">
          <SidebarNav
            currentUser={currentUser}
            view={view}
            pastCutoff={pastCutoff}
            urgentCount={urgentRequests.length}
            pendingCount={currentUser?.role === "vendor_user" ? picUpdatesRequests.length : onHoldRequests.length}
            rescheduleCount={currentUser?.role === "vendor_user" ? myRescheduleRequests.length : vendorRescheduleRequests.length}
            completedCount={completedRequests.length}
            onDashboard={goDashboard}
            onNewRequest={goNewRequest}
            onUrgentRequest={goUrgentRequest}
            onUrgent={goUrgent}
            onPending={goPending}
            onReschedules={goReschedules}
            onCompleted={goCompleted}
          />
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
              <section className="attention-panel mb-6" aria-labelledby="attention-title">
                <div className="attention-header">
                  <div>
                    <span className="eyebrow"><ShieldAlert size={13} /> PERLU TINDAKAN</span>
                    <h2 id="attention-title">Prioritas operasional</h2>
                    <p>Mulai dari pekerjaan yang berisiko menghambat aktivasi.</p>
                  </div>
                  <span className="attention-total">
                    {attentionItems.filter((item) => item.count > 0).length} antrean aktif
                  </span>
                </div>
                <div className="attention-grid">
                  {attentionItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`attention-card attention-${item.tone}`}
                      onClick={item.onClick}
                    >
                      <span className="attention-icon">{item.icon}</span>
                      <span className="attention-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="attention-count">{item.count}</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <p className="attention-footnote">Pilih kartu untuk membuka antrean yang sama dengan menu Follow-up di samping.</p>
              </section>
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
                  {overdueOnly && (
                    <button type="button" className="active-filter" onClick={() => setOverdueOnly(false)}>
                      Melewati jadwal · Hapus filter <X size={14} />
                    </button>
                  )}
                  <select
                    aria-label="Filter status request"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Semua status</option>
{statuses.filter((status) => status !== "Completed").map((status) => (
  <option key={status}>{status}</option>
))}
                  </select>
                  <button type="button" className="secondary-button" onClick={() => void exportScheduleTemplate()} disabled={busy || filtered.length === 0}>
                    Export Schedule Excel
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Customer</th>
                        <th scope="col">Jadwal Aktivasi</th>
                        <th scope="col">Time</th>
                        <th scope="col">Area & Vendor</th>
                        <th scope="col">Media</th>
                        <th scope="col">PIC Provisioning</th>
                        <th scope="col">Status</th>
                        <th scope="col">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableInfo.items.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Customer">
                            <button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={() => setSelectedRequest(item)}>
                              {item.customerName || "Nama customer belum diisi"}
                            </button>
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
                              {currentUser?.role === "vendor_user" && !["Completed", "Pending", "Request Approval"].includes(item.status) && (
                                <button type="button" className="icon-action edit" title="Ajukan reschedule" aria-label={`Ajukan reschedule ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); openReschedule(item); }}>
                                  <CalendarClock size={15} />
                                </button>
                              )}
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
                <PaginationBar
                  page={tableInfo.page}
                  totalPages={tableInfo.totalPages}
                  totalItems={filtered.length}
                  onPageChange={setTablePage}
                />
              </div>
            </>
          ) : view === "form" || view === "urgentForm" ? (
            <RequestForm
              picCounts={picCounts}
              slotCounts={slotCounts}
              serverNow={serverNow}
              form={form}
              setForm={setForm}
              busy={busy}
              editing={Boolean(editingId)}
              urgent={view === "urgentForm"}
              onCancel={() => { setEditingId(null); setForm(emptyForm); setView("dashboard"); }}
              onSubmit={async () => {
                if (busy) return;
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
              onReschedule={openUrgentReschedule}
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
          ) : view === "pending" ? (
            <PendingList
              requests={currentUser?.role === "vendor_user" ? picUpdatesRequests : onHoldRequests}
              onOpen={setSelectedRequest}
              onReschedule={openReschedule}
              onReviewReschedule={openRescheduleApproval}
              vendorMode={currentUser?.role === "vendor_user"}
              queueType={currentUser?.role === "vendor_user" ? "updates" : "hold"}
            />
          ) : view === "myReschedules" ? (
            <PendingList
              requests={myRescheduleRequests}
              onOpen={setSelectedRequest}
              onReschedule={openReschedule}
              onReviewReschedule={openRescheduleApproval}
              vendorMode
              queueType="mine"
            />
          ) : (
            <PendingList
              requests={vendorRescheduleRequests}
              onOpen={setSelectedRequest}
              onReschedule={openReschedule}
              onReviewReschedule={openRescheduleApproval}
              vendorMode={currentUser?.role === "vendor_user"}
              queueType="approval"
            />
          )}
        </section>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="mobile-nav-sheet" showCloseButton>
          <SheetHeader>
            <SheetTitle className="text-base text-slate-100">Menu Navigasi</SheetTitle>
            <SheetDescription className="text-xs">
              {currentUser?.name} · {currentUser?.role}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <SidebarNav
              currentUser={currentUser}
              view={view}
              pastCutoff={pastCutoff}
              urgentCount={urgentRequests.length}
              pendingCount={currentUser?.role === "vendor_user" ? picUpdatesRequests.length : onHoldRequests.length}
              rescheduleCount={currentUser?.role === "vendor_user" ? myRescheduleRequests.length : vendorRescheduleRequests.length}
              completedCount={completedRequests.length}
              onDashboard={goDashboard}
              onNewRequest={goNewRequest}
              onUrgentRequest={goUrgentRequest}
              onUrgent={goUrgent}
              onPending={goPending}
              onReschedules={goReschedules}
              onCompleted={goCompleted}
            />
          </div>
          <SheetFooter>
            <button type="button" onClick={handleLogout} className="mobile-nav-sheet-logout">
              <LogOut size={17} />
              Keluar
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
              <div><b>Request Baru</b><small>{pastCutoff ? "Tutup setelah pukul 17:00 WIB" : "Aktivasi reguler tanpa approval"}</small></div>
              {!pastCutoff && <ChevronRight size={19} />}
            </button>
            <button
              type="button"
              className="request-type-option urgent"
              onClick={() => { setRequestTypeDialog(false); openUrgentRequest(); }}
            >
              <span><Flame size={20} /></span>
              <div><b>Request Urgent</b><small>Memerlukan approval Superuser</small></div>
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
      <Dialog open={Boolean(rescheduleApprovalTarget)} onOpenChange={(open) => !open && setRescheduleApprovalTarget(null)}>
        <DialogContent className="reschedule-dialog">
          <DialogHeader>
            <DialogTitle>{rescheduleApprovalDecision === "Approved" ? "Approve Reschedule" : "Reject Reschedule"}</DialogTitle>
            <DialogDescription>
              {rescheduleApprovalTarget?.rescheduleRequestedBy === "vendor" ? "Vendor mengajukan perubahan jadwal untuk ditinjau PIC Provisioning." : "PIC Provisioning mengajukan perubahan jadwal untuk ditinjau vendor."}
            </DialogDescription>
          </DialogHeader>
          <label className="reschedule-field">
            <span>Tanggal Reschedule</span>
            <Popover open={rescheduleApprovalCalendarOpen} onOpenChange={setRescheduleApprovalCalendarOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="activation-date-trigger" aria-label="Pilih tanggal reschedule">
                  <span>{rescheduleApprovalDate ? formatActivationDate(rescheduleApprovalDate) : "Pilih tanggal reschedule"}</span>
                  <CalendarDays size={19} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="activation-calendar-popover w-auto p-0" align="start">
                <Calendar
                  className="activation-calendar"
                  mode="single"
                  disabled={{ before: new Date(`${serverNow.date}T00:00:00`) }}
                  selected={rescheduleApprovalDate ? new Date(rescheduleApprovalDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
                    setRescheduleApprovalDate(value);
                    if (!isSlotOpen(rescheduleApprovalSlot, value, serverNow)) setRescheduleApprovalSlot(slots.find((slot) => isSlotOpen(slot, value, serverNow)) ?? slots[0]);
                    setRescheduleApprovalCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </label>
          <label className="reschedule-field">
            <span>Time Reschedule</span>
            <select value={rescheduleApprovalSlot} onChange={(event) => setRescheduleApprovalSlot(event.target.value)}>
              {slots.map((slot) => <option key={slot} disabled={!isSlotOpen(slot, rescheduleApprovalDate, serverNow)}>{slot}</option>)}
            </select>
          </label>
          <label className="reschedule-field">
            <span>Reason Approval</span>
            <textarea rows={4} required placeholder="Jelaskan alasan menerima atau menolak reschedule" value={rescheduleApprovalReason} onChange={(event) => setRescheduleApprovalReason(event.target.value)} />
          </label>
          <DialogFooter>
            <button type="button" className="secondary-button" disabled={busy} onClick={() => setRescheduleApprovalTarget(null)}>Batal</button>
            <button type="button" className="primary-button" disabled={busy || (rescheduleApprovalDecision === "Approved" && (!rescheduleApprovalDate || !rescheduleApprovalSlot)) || !rescheduleApprovalReason.trim()} onClick={() => void saveRescheduleApproval()}>
              {busy ? "Menyimpan…" : rescheduleApprovalDecision === "Approved" ? "Approve Reschedule" : "Reject Reschedule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="reschedule-dialog">
          <DialogHeader>
            <DialogTitle>{rescheduleMode === "vendor" ? "Vendor Reschedule" : rescheduleMode === "urgent" ? "Ubah Jadwal Urgent" : "PIC Reschedule"}</DialogTitle>
            <DialogDescription>
              {rescheduleMode === "urgent"
                ? "Tentukan tanggal aktivasi baru untuk request urgent yang masih menunggu approval."
                : `Tentukan tanggal aktivasi baru untuk ${rescheduleTarget?.customerName || rescheduleTarget?.siteId}.`}
              {rescheduleMode === "vendor" ? "Ajukan perubahan jadwal karena kendala vendor." : rescheduleMode === "pic" ? "Ubah jadwal langsung karena kendala internal PIC Provisioning." : ""}
            </DialogDescription>
          </DialogHeader>
          <label className="reschedule-field">
            <span>Tanggal Aktivasi Baru</span>
            <Popover open={rescheduleCalendarOpen} onOpenChange={setRescheduleCalendarOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="activation-date-trigger" aria-label="Pilih tanggal aktivasi baru">
                  <span>{rescheduleDate ? formatActivationDate(rescheduleDate) : "Pilih tanggal aktivasi baru"}</span>
                  <CalendarDays size={19} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="activation-calendar-popover w-auto p-0" align="start">
                <Calendar
                  className="activation-calendar"
                  mode="single"
                  disabled={{ before: new Date(`${serverNow.date}T00:00:00`) }}
                  selected={rescheduleDate ? new Date(rescheduleDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
                    setRescheduleDate(value);
                    if (!isSlotOpen(rescheduleSlot, value, serverNow)) setRescheduleSlot(slots.find((slot) => isSlotOpen(slot, value, serverNow)) ?? slots[0]);
                    setRescheduleCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </label>
          <label className="reschedule-field">
            <span>Time Aktivasi Baru</span>
            <select value={rescheduleSlot} onChange={(event) => setRescheduleSlot(event.target.value)}>
              {slots.map((slot) => <option key={slot} disabled={!isSlotOpen(slot, rescheduleDate, serverNow)}>{slot}</option>)}
            </select>
          </label>
          {rescheduleMode !== "urgent" && (
            <label className="reschedule-field">
              <span>Reason</span>
              <textarea rows={4} required placeholder={rescheduleMode === "vendor" ? "Jelaskan kendala dari sisi vendor" : "Contoh: device belum siap atau konflik jadwal PIC"} value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} />
            </label>
          )}
          <DialogFooter>
            <button type="button" className="secondary-button" disabled={busy} onClick={() => setRescheduleTarget(null)}>
              Batal
            </button>
            <button type="button" className="primary-button" disabled={busy || !rescheduleDate || !rescheduleSlot || (rescheduleMode !== "urgent" && !rescheduleReason.trim())} onClick={() => void saveReschedule()}>
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
            <span>Usulan Tanggal Aktivasi</span>
            <Popover open={pendingCalendarOpen} onOpenChange={setPendingCalendarOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="activation-date-trigger" aria-label="Pilih usulan tanggal aktivasi">
                  <span>{pendingDate ? formatActivationDate(pendingDate) : "Pilih usulan tanggal aktivasi"}</span>
                  <CalendarDays size={19} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="activation-calendar-popover w-auto p-0" align="start">
                <Calendar
                  className="activation-calendar"
                  mode="single"
                  disabled={{ before: new Date(`${serverNow.date}T00:00:00`) }}
                  selected={pendingDate ? new Date(pendingDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
                    setPendingDate(value);
                    if (!isSlotOpen(pendingSlot, value, serverNow)) setPendingSlot(slots.find((slot) => isSlotOpen(slot, value, serverNow)) ?? slots[0]);
                    setPendingCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </label>
          <label className="reschedule-field">
            <span>Usulan Time</span>
            <select value={pendingSlot} onChange={(event) => setPendingSlot(event.target.value)}>
              {slots.map((slot) => <option key={slot} disabled={!isSlotOpen(slot, pendingDate, serverNow)}>{slot}</option>)}
            </select>
          </label>
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
            <button type="button" className="primary-button" disabled={busy || !pendingDate || !pendingSlot || !pendingReason.trim()} onClick={savePending}>
              {busy ? "Menyimpan…" : "Simpan Pending"}
            </button>
          </DialogFooter>
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
  const [completedPage, setCompletedPage] = useState(1);
  const [prevCompletedDate, setPrevCompletedDate] = useState(selectedDate);
  if (prevCompletedDate !== selectedDate) {
    setPrevCompletedDate(selectedDate);
    setCompletedPage(1);
  }
  const completedMaxPage = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  if (completedPage > completedMaxPage) setCompletedPage(completedMaxPage);
  const completedInfo = paginate(requests, completedPage);
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
                <th scope="col">Customer</th>
                <th scope="col">Waktu Selesai</th>
                <th scope="col">Area & Vendor</th>
                <th scope="col">PIC Provisioning</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {completedInfo.items.map((item) => (
                <tr key={item.id}>
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
        <PaginationBar
          page={completedInfo.page}
          totalPages={completedInfo.totalPages}
          totalItems={requests.length}
          onPageChange={setCompletedPage}
        />
      </div>
    </div>
  );
}

function PendingList({
  requests,
  onOpen,
  onReschedule,
  onReviewReschedule,
  vendorMode = false,
  queueType,
}: {
  requests: ActivationRequest[];
  onOpen: (request: ActivationRequest) => void;
  onReschedule: (request: ActivationRequest) => void;
  onReviewReschedule: (request: ActivationRequest, decision?: "Approved" | "Rejected") => void;
  vendorMode?: boolean;
  queueType: "hold" | "approval" | "updates" | "mine";
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);
  const filteredRequests = useMemo(() => requests.filter((item) => (
    `${item.customerName} ${item.siteId} ${item.subsId} ${item.woNumber} ${item.vendorName} ${item.provisioningPic} ${item.workType}`
      .toLowerCase()
      .includes(searchQuery)
  )), [requests, searchQuery]);
  const [prevPendingSearch, setPrevPendingSearch] = useState(searchQuery);
  if (prevPendingSearch !== searchQuery) {
    setPrevPendingSearch(searchQuery);
    setPendingPage(1);
  }
  const pendingMaxPage = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  if (pendingPage > pendingMaxPage) setPendingPage(pendingMaxPage);
  const pendingInfo = paginate(filteredRequests, pendingPage);
  return (
    <div>
      <div className="page-heading mb-7">
        <span className="eyebrow"><CirclePause size={13} /> {queueType === "approval" ? "RESCHEDULE APPROVAL QUEUE" : queueType === "updates" ? "PIC UPDATES" : queueType === "mine" ? "MY RESCHEDULE REQUESTS" : "ON HOLD QUEUE"}</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">{queueType === "approval" ? "Vendor Reschedule Request" : queueType === "updates" ? "PIC Updates" : queueType === "mine" ? "My Reschedule Requests" : (vendorMode ? "On Hold" : "Pending / On Hold")}</h1>
        <p className="mt-2 text-sm text-slate-400">{queueType === "approval" ? "Tinjau perubahan jadwal yang diajukan vendor." : queueType === "updates" ? "Informasi ON HOLD dan perubahan jadwal dari PIC Provisioning." : queueType === "mine" ? "Pantau pengajuan perubahan jadwal Anda yang menunggu approval PIC." : (vendorMode ? "Pantau request yang sedang ditangani PIC Provisioning." : "Pantau request yang sedang ditahan karena kendala operasional.")}</p>
      </div>
      <div className="data-panel overflow-hidden">
        <div className="panel-toolbar flex items-center gap-3 p-4 lg:p-5">
          <div>
            <b className="text-sm text-white">{queueType === "approval" ? "Reschedule menunggu approval" : queueType === "updates" ? "Update dari PIC Provisioning" : queueType === "mine" ? "Pengajuan menunggu approval PIC" : "Request ON HOLD"}</b>
            <span className="mt-1 block text-xs text-slate-500">{requests.length} request menunggu tindak lanjut</span>
          </div>
          <label className="search-box pending-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Cari customer, site ID, WO, vendor, Work Type…"
              aria-label="Cari request pending"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="pending-table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">{queueType === "mine" ? "Jadwal Diajukan" : "Jadwal Sebelumnya"}</th>
                <th scope="col">{queueType === "approval" || queueType === "mine" ? "Reason Reschedule" : queueType === "updates" ? "Tipe / Reason" : "Reason Pending"}</th>
                <th scope="col">PIC Provisioning</th>
                <th scope="col">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {pendingInfo.items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Customer">
                    <button type="button" className="customer-detail-button" aria-label={`Lihat detail ${item.customerName || item.siteId}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }}>{item.customerName || item.siteId}</button>
                    <span>{item.siteId} · {item.subsId} · WO {item.woNumber}</span>
                  </td>
                  <td data-label={queueType === "mine" ? "Jadwal Diajukan" : "Jadwal Sebelumnya"}>
                    <b className="capitalize">{formatActivationDate(queueType === "mine" ? item.vendorRescheduleDate : item.activationDate)}</b>
                    <span>{queueType === "mine" ? item.vendorRescheduleTimeSlot : item.timeSlot}</span>
                  </td>
                  <td data-label={queueType === "approval" || queueType === "mine" ? "Reason Reschedule" : queueType === "updates" ? "Tipe / Reason" : "Reason Pending"}>
                    {queueType === "updates" && <b className="block text-xs text-sky-300">{item.picRescheduleDate ? "PIC RESCHEDULED" : "ON HOLD"}</b>}
                    <span className="pending-reason">{queueType === "approval" || queueType === "mine" ? item.rescheduleReason || "-" : item.picRescheduleDate ? item.picRescheduleReason || "-" : item.pendingReason || "-"}</span>
                  </td>
                  <td data-label="PIC Provisioning"><b>{item.provisioningPic}</b></td>
                  <td data-label="Tindakan">
                    {queueType === "approval" && item.rescheduleApprovalStatus === "Pending PIC Approval" ? (
                      <div className="row-actions">
                        <button type="button" className="reschedule-button" onClick={(event) => { event.stopPropagation(); onReviewReschedule(item, "Approved"); }}><CheckCircle2 size={16} /> Approve</button>
                        <button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); onReviewReschedule(item, "Rejected"); }}>Reject</button>
                      </div>
                    ) : !vendorMode && queueType === "hold" ? (
                      <button type="button" className="reschedule-button" onClick={(event) => { event.stopPropagation(); onReschedule(item); }}>
                        <CalendarClock size={16} /> PIC Reschedule
                      </button>
                    ) : (
                      <span className="pending-reason">Informasi saja</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredRequests.length && (
          <div className="empty-state">
            <span><CheckCircle2 size={24} /></span>
            <b>{requests.length ? "Request Pending tidak ditemukan" : "Tidak ada request Pending"}</b>
            <p>{requests.length ? "Coba gunakan kata kunci lain." : "Semua request sudah memiliki jadwal tindak lanjut."}</p>
          </div>
        )}
        <PaginationBar
          page={pendingInfo.page}
          totalPages={pendingInfo.totalPages}
          totalItems={filteredRequests.length}
          onPageChange={setPendingPage}
        />
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
  const [urgentPage, setUrgentPage] = useState(1);
  const urgentMaxPage = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  if (urgentPage > urgentMaxPage) setUrgentPage(urgentMaxPage);
  const urgentInfo = paginate(requests, urgentPage);
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
            <thead><tr><th scope="col">Kode Approval</th><th scope="col">Customer</th><th scope="col">Jadwal Diajukan</th><th scope="col">PIC Provisioning</th><th scope="col">Tindakan</th></tr></thead>
            <tbody>
              {urgentInfo.items.map((item) => (
                <tr key={item.id}>
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
        <PaginationBar
          page={urgentInfo.page}
          totalPages={urgentInfo.totalPages}
          totalItems={requests.length}
          onPageChange={setUrgentPage}
        />
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
                {request.approvalStatus === "Waiting Approval" ? "Request Approval" : request.status}
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
                {request.status === "Reschedule" && (
                  <DetailItem label="Reason Reschedule" value={request.rescheduleReason || "-"} wide />
                )}
                {request.picRescheduleReason && (
                  <DetailItem label="Reason PIC Reschedule" value={request.picRescheduleReason} wide />
                )}
                {request.picRescheduleDate && (
                  <DetailItem label="Jadwal PIC Reschedule" value={`${formatActivationDate(request.picRescheduleDate)} · ${request.picRescheduleTimeSlot}`} wide />
                )}
                {request.vendorRescheduleDate && (
                  <DetailItem label="Jadwal Vendor Reschedule" value={`${formatActivationDate(request.vendorRescheduleDate)} · ${request.vendorRescheduleTimeSlot}`} wide />
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
                <DetailItem label="Perangkat yang Dipasang" value={request.devicePlan} wide />
                <DetailItem
                  label="Install Switch"
                  value={request.installSwitch ? `Ya · ${request.switchBrand} · VLAN ${request.vlanSwitch || "?"}` : "Tidak"}
                  wide
                />
              </DetailSection>

              <DetailSection title="Catatan">
                <DetailItem label="Catatan Tambahan" value={request.notes || "-"} wide />
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
  picCounts,
  slotCounts,
  serverNow,
  form,
  setForm,
  busy,
  onSubmit,
  editing,
  urgent,
  onCancel,
}: {
  picCounts: Record<string, number>;
  slotCounts: Record<string, number>;
  serverNow: { date: string; hour: number; minute: number };
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
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const MAX_SCREENSHOT_BYTES = 20 * 1024 * 1024;
  const steps = [
    { number: 1, label: "Jadwal" },
    { number: 2, label: "Customer" },
    { number: 3, label: "PIC & area" },
    { number: 4, label: "Network / RFA" },
    ...(urgent ? [{ number: 5, label: "Bukti urgent" }] : []),
  ];
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
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Gambar gagal diunggah.");
      const uploadedUrl = result.url;
      setForm((current) => ({ ...current, screenshotUrl: uploadedUrl }));
    } catch (error) {
      setScreenshotError(error instanceof Error ? error.message : "Gambar gagal diunggah.");
    } finally {
      setScreenshotUploading(false);
    }
  }
  const counts = Object.fromEntries(slots.map((slot) => [slot, slotCounts[`${form.activationDate}|${slot}`] ?? 0]));
  const effectiveSlot = form.activationDate ? candidateSlots(form.timeSlot).find((slot) => counts[slot] < SLOT_CAPACITY && isSlotOpen(slot, form.activationDate, serverNow)) ?? "" : form.timeSlot;
  const scheduleFull = Boolean(form.activationDate) && !effectiveSlot;
  function goToNextStep() {
    if (!formRef.current?.reportValidity()) return;
    setStep((current) => Math.min(current + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    if (effectiveSlot && effectiveSlot !== form.timeSlot) setForm((current) => ({ ...current, timeSlot: effectiveSlot }));
    const currentPicCount = picCounts[form.provisioningPic] ?? 0;
    if (currentPicCount >= 7) {
      const nextPic = pics.find((pic) => (picCounts[pic] ?? 0) < 7);
      if (nextPic) setForm((current) => ({ ...current, provisioningPic: nextPic }));
    }
  }, [effectiveSlot, form.timeSlot, form.provisioningPic, picCounts, slotCounts, setForm]);
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
          {editing ? "Edit Request Aktivasi" : urgent ? "Request Urgent" : "Request Aktivasi Customer"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Lengkapi data yang sama untuk Request Baru maupun Request Urgent. Perbedaannya ada pada jalur approval dan batas waktu pengajuan.
        </p>
        <div className={`request-window ${urgent ? "urgent" : "open"}`}>
          {urgent ? <Flame size={18} /> : <Clock3 size={18} />}
          <div>
            <b>{editing ? "Mode edit request" : urgent ? "Memerlukan Approval" : "Pengajuan request dibuka"}</b>
            <span>{editing ? "Perbarui data lalu simpan perubahan." : urgent ? "Request masuk ke Urgent Approval. Jadwal baru aktif setelah disetujui Superuser." : "Request Baru diproses tanpa approval selama diajukan sebelum pukul 17:00 WIB."}</span>
          </div>
        </div>
      </div>
      <div className="data-master-note" role="note">
        <span><ClipboardList size={18} aria-hidden="true" /></span>
        <div>
          <b>Sinkron ke Spreadsheet Schedule Activation</b>
          <p>Field bertanda wajib akan dikirim ke kolom Spreadsheet Schedule Activation. Gunakan format dan istilah yang sama agar data tidak berubah saat sinkronisasi.</p>
        </div>
      </div>
      <nav className="form-stepper" aria-label="Progress pengisian request">
        {steps.map((item) => (
          <button
            key={item.number}
            type="button"
            className={step === item.number ? "active" : step > item.number ? "complete" : ""}
            onClick={() => item.number < step && setStep(item.number)}
            disabled={item.number > step}
            aria-current={step === item.number ? "step" : undefined}
          >
            <span>{item.number}</span>
            <b>{item.label}</b>
          </button>
        ))}
      </nav>
      <form
        ref={formRef}
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (urgent && !form.screenshotUrl) {
            setScreenshotError("Screenshot wajib diunggah untuk Request Urgent.");
            return;
          }
          onSubmit();
        }}
      >
        {step === 1 && <FormSection number="01" title="Jadwal Aktivasi" description="Pilih tanggal dan slot yang masih tersedia untuk pekerjaan ini." icon={<CalendarDays size={18} />}>
          <div className="form-grid">
            <Field label="Email">
              <input required type="email" placeholder="nama@perusahaan.com" {...input("email")} />
            </Field>
            <Field label="Hari">
              <input value={form.activationDate ? formatActivationDay(form.activationDate) : "-"} readOnly aria-label="Hari aktivasi" />
            </Field>
            <Field label="Tanggal Aktivasi">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild><button type="button" className="activation-date-trigger"><span>{form.activationDate ? formatActivationDate(form.activationDate) : "Pilih tanggal aktivasi"}</span><CalendarDays size={19} /></button></PopoverTrigger>
                <PopoverContent className="activation-calendar-popover w-auto p-0" align="start">
                  <Calendar className="activation-calendar" mode="single" disabled={{ before: new Date(`${serverNow.date}T00:00:00`) }} selected={form.activationDate ? new Date(form.activationDate + "T00:00:00") : undefined} onSelect={(date) => {
                    if (!date) return;
                    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
                    const next = slots.find((slot) => (slotCounts[`${value}|${slot}`] ?? 0) < SLOT_CAPACITY && isSlotOpen(slot, value, serverNow));
                    setForm({ ...form, activationDate: value, timeSlot: next ?? slots[0] });
                    setCalendarOpen(false);
                  }} />
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="Time Aktivasi" wide>
              <div className="slot-grid">
                {slots.map((slot, index) => {
                  const slotOpen = isSlotOpen(slot, form.activationDate, serverNow);
                  const slotFull = counts[slot] >= SLOT_CAPACITY;
                  return <label key={slot} className={[effectiveSlot === slot ? "selected" : "", slotFull || !slotOpen ? "slot-full" : ""].join(" ")}>
                    <input type="radio" name="slot" value={slot} disabled={!form.activationDate || slotFull || !slotOpen} checked={effectiveSlot === slot} onChange={(event) => setForm({ ...form, timeSlot: event.target.value })} />
                    <b>Slot {index + 1}</b><span>{slot}</span><span>{form.activationDate ? slotFull ? counts[slot] + "/10 request · Penuh" : !slotOpen ? "Belum dibuka" : counts[slot] + "/10 request" : "Pilih tanggal dahulu"}</span>
                  </label>;
                })}
              </div>
            </Field>
            <p className="wide date-preview" role="status">{scheduleFull ? "Slot penuh. Pilih slot sebelumnya yang tersedia atau tanggal lain." : "Maksimal 10 request per slot. Slot penuh otomatis dialihkan ke slot berikutnya."}</p>
            <Field label="Catatan Tambahan" wide><textarea rows={3} placeholder="Kebutuhan akses, kendala lokasi, atau informasi tambahan" {...input("notes")} /></Field>
          </div>
        </FormSection>}
        {step === 2 && <FormSection number="02" title="Data Customer" description="Gunakan nama, ID, produk, dan bandwidth yang sama dengan data master." icon={<Building2 size={18} />}>
          <div className="form-grid">
            <Field label="Nama Customer" wide>
              <input
                required
                placeholder="Nama perusahaan atau customer"
                {...input("customerName")}
              />
            </Field>
            <Field label="Nama & No. Telp Customer" wide>
              <input required placeholder="Nama kontak · 08xxxxxxxxxx" {...input("customerContact")} />
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
            <Field label="Site Name / Location Name" wide>
              <input required placeholder="Nama lokasi site" {...input("siteName")} />
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
            <Field label="Bandwidth IX">
              <BandwidthField id="bandwidth-ix" sheetLabel="Bandwidth IX" required value={form.bandwidthIx} onChange={(value) => setForm({ ...form, bandwidthIx: value })} />
            </Field>
            <Field label="Bandwidth IIX">
              <BandwidthField id="bandwidth-iix" sheetLabel="Bandwidth IIX" required value={form.bandwidthIix} onChange={(value) => setForm({ ...form, bandwidthIix: value })} />
            </Field>
            <Field label="Local Loop">
              <input required placeholder="Contoh: Metro / GPON / FO" {...input("localLoop")} />
            </Field>
            <Field label="Bukti koordinasi dengan customer" wide>
              <input required placeholder="Link atau keterangan bukti koordinasi" {...input("coordinationProof")} />
            </Field>
          </div>
        </FormSection>}
        {step === 3 && <FormSection number="03" title="Area & Penanggung Jawab" description="Tentukan area layanan, vendor, dan PIC yang menerima pekerjaan." icon={<ShieldCheck size={18} />}>
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
              <select required {...input("projectPic")}>
                <option value="">Pilih PIC Project…</option>
                {projectPics.map((pic) => <option key={pic}>{pic}</option>)}
              </select>
            </Field>
            <Field label="PIC Aktivasi">
              <input required placeholder="Nama PIC Aktivasi" {...input("activationPic")} />
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
                  <option key={pic} disabled={(picCounts[pic] ?? 0) >= 7}>
                    {pic} ({picCounts[pic] ?? 0}/7)
                  </option>
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
        </FormSection>}
        {step === 4 && <FormSection number="04" title="Perangkat & RFA" description="Lengkapi perangkat dan detail jaringan. Beberapa field menyesuaikan akses media." icon={<RadioTower size={18} />}>
          <div className="form-grid">
            <Field label="Perangkat yang Dipasang" wide>
              <textarea
                required
                rows={3}
                placeholder="Contoh: SFP 10G 20 km, MC220, Router MikroTik…"
                {...input("devicePlan")}
              />
              <div className="internet-service-notice" role="note">
                <CircleAlert size={18} aria-hidden="true" />
                <span>Apabila memilih product Internet Service, harap mencantumkan nama router dan kebutuhannya.</span>
              </div>
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
            {!noRfaAccessMedia.includes(form.accessMedia) && <>
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
              <select required {...input("cableType")}>
                <option value="" disabled>Pilih type kabel</option>
                <option>12 core</option>
                <option>24 core</option>
                <option>DW</option>
                <option>Precone</option>
              </select>
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
            <Field label="Alokasi Port Switch POP">
              <input required placeholder="Port switch POP" {...input("switchPopPortAllocation")} />
            </Field>
            <Field label="IP Customer">
              <input required={!noIpServiceTypes.includes(form.serviceType)} placeholder="IP customer" {...input("customerIp")} />
            </Field>
            {(form.accessMedia === "METRO" || form.accessMedia === "GPON") && (
              <Field label="Build / Existing" wide>
                <select required {...input("buildType")}>
                  <option value="" disabled>Pilih build</option>
                  <option>Build 1:8</option>
                  <option>Build 1:4</option>
                  <option>Existing 1:4</option>
                  <option>Existing 1:8</option>
                </select>
              </Field>
            )}
            <Field label="Port ODP/FAT">
              <input required placeholder="Port ODP/FAT" {...input("odpFatPort")} />
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
            <Field label="Koordinat FAT">
              <input required placeholder="Latitude, Longitude" {...input("fatCoordinates")} />
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
            {noRfaAccessMedia.includes(form.accessMedia) && (
              <div className="interconnection-note wide">
                <ShieldCheck size={18} />
                <span><b>Mode {form.accessMedia}</b> Data RFA tidak diwajibkan. Lengkapi perangkat yang akan dipasang.</span>
              </div>
            )}
          </div>
        </FormSection>}
        {urgent && step === 5 && (
          <FormSection number="05" title="Screenshot Bukti" description="Lampirkan bukti yang menjelaskan kebutuhan urgent." icon={<ClipboardList size={18} />}>
            <div className="form-grid">
              <Field label="Screenshot Bukti Urgent" wide>
                {form.screenshotUrl ? (
                  <div className="screenshot-preview">
                    <Image src={form.screenshotUrl} alt="Screenshot bukti urgent" width={960} height={540} unoptimized />
                    <button type="button" className="secondary-button" disabled={screenshotUploading} onClick={() => setForm((current) => ({ ...current, screenshotUrl: "" }))}>Hapus screenshot</button>
                  </div>
                ) : (
                  <div className="screenshot-dropzone">
                    <input type="file" accept="image/*" disabled={screenshotUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadScreenshot(file); }} />
                    <ImagePlus size={30} aria-hidden="true" />
                    <b>{screenshotUploading ? "Mengunggah gambar…" : "Klik untuk pilih screenshot"}</b>
                    <small>Wajib untuk request urgent · format JPG/PNG · maksimal 20MB</small>
                  </div>
                )}
                {screenshotError && <p className="field-error" role="alert">{screenshotError}</p>}
              </Field>
            </div>
          </FormSection>
        )}
        <div className="form-actions flex flex-wrap justify-between gap-3">
          <div className="flex gap-3">
            {step > 1 && (
              <button disabled={busy} className="secondary-button" type="button" onClick={goToPreviousStep}>
                Kembali
              </button>
            )}
            {editing && step === 1 && (
            <button disabled={busy} className="secondary-button" type="button" onClick={onCancel}>
              Batal
            </button>
            )}
          </div>
          {step < steps.length ? (
            <button disabled={busy || (step === 1 && (!form.activationDate || scheduleFull))} className="primary-button min-w-48" type="button" onClick={goToNextStep}>
              Lanjut ke {steps[step]?.label ?? "berikutnya"}
              <ChevronRight size={17} />
            </button>
          ) : (
            <button
              disabled={busy || !form.activationDate || scheduleFull}
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
          )}
        </div>
      </form>
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="section-title">
        <span>{number}</span>
        <div className="section-title-icon">{icon}</div>
        <div className="section-title-copy">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );

}

function parseBandwidth(value: string) {
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(Mbps|Gbps)$/i);
  if (!match) return { amount: value, unit: "Gbps" };
  return { amount: match[1], unit: bandwidthUnits.find((unit) => unit.toLowerCase() === match[2].toLowerCase()) ?? "Gbps" };
}

function BandwidthField({
  id,
  sheetLabel,
  value,
  onChange,
  required = false,
}: {
  id: string;
  sheetLabel: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = parseBandwidth(value);
  const update = (amount: string, unit: string) => onChange(amount.trim() ? `${amount.trim()} ${unit}` : "");
  return (
    <div className="bandwidth-field">
      <div className="bandwidth-input-wrap">
        <input
          id={id}
          required={required}
          type="text"
          inputMode="decimal"
          pattern="^\d+(?:[.,]\d+)?$"
          title="Masukkan angka bandwidth, misalnya 1 atau 0,5"
          value={parsed.amount}
          onChange={(event) => update(event.target.value, parsed.unit)}
          placeholder="1"
          aria-label="Nilai bandwidth"
          aria-describedby={`${id}-hint`}
        />
        <select
          value={parsed.unit}
          onChange={(event) => update(parsed.amount, event.target.value)}
          aria-label="Satuan bandwidth"
        >
          {bandwidthUnits.map((unit) => <option key={unit}>{unit}</option>)}
        </select>
      </div>
      <small id={`${id}-hint`} className="field-hint">Format kolom sheet: {sheetLabel} · contoh 1 Gbps.</small>
    </div>
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
