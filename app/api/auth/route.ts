import { NextResponse } from "next/server";
import {
  authenticateUser,
  COOKIE_NAME,
  createSessionToken,
  getSessionUser,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("auth-me-error", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;

    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    if (!username.trim() || !password.trim()) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 },
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 },
      );
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("auth-post-error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada sistem autentikasi." },
      { status: 500 },
    );
  }
}
