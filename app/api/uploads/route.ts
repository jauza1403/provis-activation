import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { getSessionUser } from "@/lib/auth";

const MAX_SCREENSHOT_BYTES = 20 * 1024 * 1024; // 20MB
const SCREENSHOT_PREFIX = "urgent-screenshots/";

function unsupportedBucket() {
  return NextResponse.json(
    { error: "Penyimpanan screenshot belum tersedia. Konfigurasi bucket R2 (BUCKET) terlebih dahulu." },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Sesi telah berakhir. Silakan login kembali." },
      { status: 401 },
    );
  }
  if (!env.BUCKET) return unsupportedBucket();

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah." },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File harus berupa gambar (screenshot)." },
        { status: 400 },
      );
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 20MB." },
        { status: 400 },
      );
    }
    const extension = (/\.([a-zA-Z0-9]{1,10})$/.exec(file.name)?.[1] ?? "png").toLowerCase();
    const key = `${SCREENSHOT_PREFIX}${crypto.randomUUID()}.${extension}`;
    await env.BUCKET.put(key, file, {
      httpMetadata: { contentType: file.type },
      customMetadata: { uploadedBy: user.username, uploadedAt: new Date().toISOString() },
    });
    return NextResponse.json(
      { url: `/api/uploads?key=${encodeURIComponent(key)}` },
      { status: 201 },
    );
  } catch (error) {
    console.error("upload-failed", error);
    return NextResponse.json(
      { error: "Gambar gagal diunggah. Silakan coba kembali." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Sesi telah berakhir. Silakan login kembali." },
      { status: 401 },
    );
  }
  if (!env.BUCKET) return unsupportedBucket();

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  if (!key.startsWith(SCREENSHOT_PREFIX)) {
    return NextResponse.json({ error: "Key tidak valid." }, { status: 400 });
  }
  const object = await env.BUCKET.get(key);
  if (!object) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }
  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/png");
  headers.set("Cache-Control", "private, max-age=3600");
  if (object.size) headers.set("Content-Length", String(object.size));
  return new Response(object.body, { headers });
}