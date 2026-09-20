"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  KeyRound,
  Lock,
  User,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan autentikasi.");
      }

      // Redirect to main portal dashboard
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell min-h-screen flex flex-col justify-center items-center px-4 py-12 text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="brand-logo-shell mb-3 inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <Image
              src="/iforte-logo.png"
              alt="iForte"
              width={132}
              height={32}
              priority
              className="h-8 object-contain"
            />
          </div>
          <div className="brand-copy">
            <h1 className="text-xl font-extrabold tracking-wider text-white">
              PROVISIONING
            </h1>
            <span className="text-xs font-semibold tracking-widest text-sky-400 uppercase">
              Activation Portal · Sign In
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <KeyRound size={18} className="text-sky-400" />
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan akun Superuser, Project User, atau Vendor User Anda.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </span>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="login-field-input w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-[color,background-color,border-color,box-shadow] duration-150"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="login-field-input w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-[color,background-color,border-color,box-shadow] duration-150"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition-[color,background-color,border-color,box-shadow,opacity,transform,filter] duration-150 active:scale-[.96] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span>Memproses…</span>
              ) : (
                <>
                  <span>Masuk ke Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          iForte Provisioning Activation Portal &copy; {new Date().getFullYear()} · PT iForte Solusi Infotek
        </p>
      </div>
    </main>
  );
}
