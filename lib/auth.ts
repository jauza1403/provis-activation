import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { VENDOR_SEED_ACCOUNTS } from "@/lib/vendor-account-seeds";

export type UserRole = "superuser" | "project_user" | "vendor_user";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  vendorName: string;
  regionScope: string;
};

type SeedAccount = AuthUser & {
  salt: string;
  passwordHash: string;
};

export const COOKIE_NAME = "auth_session";
const SESSION_SECRET = "iforte-provisioning-activation-portal-rbac-secret-key-2026";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export const SEED_ACCOUNTS = [
  {
    id: "usr-super-001",
    username: "superuser",
    name: "Super Administrator",
    role: "superuser" as UserRole,
    vendorName: "",
    regionScope: "",
    salt: "seed-superuser-2026",
    passwordHash: "15ccd838f2fc841d1918554201fa08036fc57951f6ef8deafeb9fd0597448f2a",
  },
  {
    id: "usr-project-002",
    username: "projectuser",
    name: "Project Coordinator",
    role: "project_user" as UserRole,
    vendorName: "",
    regionScope: "",
    salt: "seed-projectuser-2026",
    passwordHash: "e29188d3417ce749b4f4b3ad9db6636519d75dd33ee57c400607b8b35f225924",
  },
  ...VENDOR_SEED_ACCOUNTS,
] satisfies SeedAccount[];

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = { ...user, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sigBytes = Array.from(new Uint8Array(signature));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...sigBytes));

  return `${data}.${encodedSignature}`;
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const sigStr = base64UrlDecode(encodedSignature);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (!["superuser", "project_user", "vendor_user"].includes(payload.role)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      vendorName: payload.vendorName || "",
      regionScope: payload.regionScope || "",
    };
  } catch {
    return null;
  }
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSessionUser(request?: Request): Promise<AuthUser | null> {
  let token: string | null = null;
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    token = parseCookie(cookieHeader, COOKIE_NAME);
  }
  if (!token) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value ?? null;
    } catch {
      // Ignore when running outside of Server Component/Route Handler request context
    }
  }
  if (!token) return null;
  return verifySessionToken(token);
}

// Ensure the `users` table exists in D1 and seed test accounts if absent
let isDbInitialized = false;
export async function ensureUsersTableAndSeed(): Promise<void> {
  if (isDbInitialized) return;
  try {
    const db = getDb();
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        vendor_name TEXT NOT NULL DEFAULT '',
        region_scope TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )
    `);

    await db.run(sql`ALTER TABLE users ADD COLUMN region_scope TEXT NOT NULL DEFAULT ''`).catch(() => undefined);

    // Retire superseded shared/test accounts before seeding the current account set.
    await db.delete(users).where(eq(users.username, "airi"));
    await db.delete(users).where(eq(users.username, "vendoruser"));

    for (const seed of SEED_ACCOUNTS) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, seed.username));
      if (!existing) {
        const [idOwner] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, seed.id));
        const seedId = idOwner && idOwner.username !== seed.username
          ? `${seed.id}-${seed.username}`
          : seed.id;
        await db.insert(users).values({
          id: seedId,
          username: seed.username,
          passwordHash: seed.passwordHash,
          salt: seed.salt,
          name: seed.name,
          role: seed.role,
          vendorName: seed.vendorName,
          regionScope: seed.regionScope,
          createdAt: new Date().toISOString(),
        });
      } else if (
        existing.name !== seed.name ||
        existing.vendorName !== seed.vendorName ||
        existing.regionScope !== seed.regionScope ||
        existing.salt !== seed.salt ||
        existing.passwordHash !== seed.passwordHash
      ) {
        await db
          .update(users)
          .set({ name: seed.name, vendorName: seed.vendorName, regionScope: seed.regionScope, salt: seed.salt, passwordHash: seed.passwordHash })
          .where(eq(users.id, existing.id));
      }
    }
    isDbInitialized = true;
  } catch (err) {
    console.warn("D1 users table init/seed skipped, will use memory seed accounts:", err);
  }
}

export async function ensureActivationRequestsTable(): Promise<void> {
  try {
    const db = getDb();
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS activation_requests (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        deadline TEXT NOT NULL,
        activation_date TEXT NOT NULL,
        activation_day TEXT NOT NULL DEFAULT '',
        time_slot TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        area TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        region_scope TEXT NOT NULL DEFAULT '',
        access_media TEXT NOT NULL,
        service_type TEXT NOT NULL DEFAULT '',
        work_type TEXT NOT NULL DEFAULT '',
        is_relocation INTEGER NOT NULL DEFAULT 0,
        is_relayout INTEGER NOT NULL DEFAULT 0,
        customer_name TEXT NOT NULL DEFAULT '',
        customer_contact TEXT NOT NULL DEFAULT '',
        activation_pic TEXT NOT NULL DEFAULT '',
        site_id TEXT NOT NULL,
        subs_id TEXT NOT NULL,
        site_name TEXT NOT NULL DEFAULT '',
        opp_number TEXT NOT NULL,
        wo_number TEXT NOT NULL,
        device_plan TEXT NOT NULL,
        install_switch INTEGER NOT NULL DEFAULT 0,
        switch_brand TEXT NOT NULL DEFAULT '',
        vlan_switch TEXT NOT NULL DEFAULT '',
        switch_pop_port_allocation TEXT NOT NULL DEFAULT '',
        customer_ip TEXT NOT NULL DEFAULT '',
        build_type TEXT NOT NULL DEFAULT '',
        build_detail TEXT NOT NULL DEFAULT '',
        rfa_cores INTEGER NOT NULL,
        pop_allocation TEXT NOT NULL,
        pop_id TEXT NOT NULL DEFAULT '',
        pop_name TEXT NOT NULL DEFAULT '',
        cable_length TEXT NOT NULL DEFAULT '',
        cable_type TEXT NOT NULL DEFAULT '',
        fat_odp_code TEXT NOT NULL DEFAULT '',
        end_to_end TEXT NOT NULL DEFAULT '',
        attenuation TEXT NOT NULL DEFAULT '',
        customer_port TEXT NOT NULL DEFAULT '',
        pop_otb_port TEXT NOT NULL DEFAULT '',
        odp_fat_port TEXT NOT NULL DEFAULT '',
        fat_coordinates TEXT NOT NULL DEFAULT '',
        bandwidth TEXT NOT NULL DEFAULT '',
        bandwidth_ix TEXT NOT NULL DEFAULT '',
        bandwidth_iix TEXT NOT NULL DEFAULT '',
        local_loop TEXT NOT NULL DEFAULT '',
        coordination_proof TEXT NOT NULL DEFAULT '',
        project_pic TEXT NOT NULL,
        vendor_pic TEXT NOT NULL,
        provisioning_pic TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Submitted',
        completed_at TEXT NOT NULL DEFAULT '',
        pending_reason TEXT NOT NULL DEFAULT '',
        reschedule_reason TEXT NOT NULL DEFAULT '',
        pic_reschedule_reason TEXT NOT NULL DEFAULT '',
        pic_reschedule_date TEXT NOT NULL DEFAULT '',
        pic_reschedule_time_slot TEXT NOT NULL DEFAULT '',
        vendor_reschedule_date TEXT NOT NULL DEFAULT '',
        vendor_reschedule_time_slot TEXT NOT NULL DEFAULT '',
        reschedule_approval_status TEXT NOT NULL DEFAULT '',
        reschedule_requested_by TEXT NOT NULL DEFAULT '',
        reschedule_original_status TEXT NOT NULL DEFAULT '',
        reschedule_approval_reason TEXT NOT NULL DEFAULT '',
        reschedule_approved_by TEXT NOT NULL DEFAULT '',
        reschedule_approved_at TEXT NOT NULL DEFAULT '',
        request_type TEXT NOT NULL DEFAULT 'Regular',
        approval_status TEXT NOT NULL DEFAULT 'Not Required',
        approval_code TEXT NOT NULL DEFAULT '',
        approved_at TEXT NOT NULL DEFAULT '',
        whatsapp_message_id TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        screenshot_url TEXT NOT NULL DEFAULT ''
      )
    `);

    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN work_type TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN activation_day TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN email TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN customer_contact TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN activation_pic TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN site_name TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN switch_pop_port_allocation TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN customer_ip TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN build_type TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN build_detail TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN odp_fat_port TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN fat_coordinates TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN bandwidth_ix TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN bandwidth_iix TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN local_loop TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN coordination_proof TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN region_scope TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_reason TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN pic_reschedule_reason TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN pic_reschedule_date TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN pic_reschedule_time_slot TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN vendor_reschedule_date TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN vendor_reschedule_time_slot TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_approval_status TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_requested_by TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_original_status TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_approval_reason TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_approved_by TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN reschedule_approved_at TEXT NOT NULL DEFAULT ''`).catch(() => undefined);
    await db.run(sql`ALTER TABLE activation_requests ADD COLUMN screenshot_url TEXT NOT NULL DEFAULT ''`).catch(() => undefined);

    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_activation_date_slot ON activation_requests (activation_date, time_slot)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_activation_status ON activation_requests (status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_activation_pic ON activation_requests (provisioning_pic)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_activation_approval ON activation_requests (approval_status, approval_code)`);
  } catch (err) {
    console.warn("D1 activation_requests table init skipped:", err);
  }
}

export async function authenticateUser(
  usernameInput: string,
  passwordInput: string,
): Promise<AuthUser | null> {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();
  if (!username || !password) return null;

  // 1. Try D1 DB authentication first
  try {
    await ensureUsersTableAndSeed();
    const db = getDb();
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (userRecord) {
      const hash = await hashPassword(password, userRecord.salt);
      if (hash === userRecord.passwordHash) {
        return {
          id: userRecord.id,
          username: userRecord.username,
          name: userRecord.name,
          role: userRecord.role as UserRole,
          vendorName: userRecord.vendorName,
          regionScope: userRecord.regionScope,
        };
      }
      return null;
    }
  } catch (e) {
    console.warn("DB user lookup failed, falling back to seed accounts:", e);
  }

  // 2. Direct fallback to seed accounts for maximum robustness
  const seed = SEED_ACCOUNTS.find((u) => u.username === username);
  if (seed && (await hashPassword(password, seed.salt)) === seed.passwordHash) {
    return {
      id: seed.id,
      username: seed.username,
      name: seed.name,
      role: seed.role,
      vendorName: seed.vendorName,
      regionScope: seed.regionScope,
    };
  }

  return null;
}
