"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "claim";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const endpoint =
        mode === "login" ? "/api/admin/auth/login" : "/api/admin/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" ? data.error : "Something went wrong."
        );
        return;
      }
      router.push("/admin");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-dot-grid px-5">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white text-xs font-bold tracking-widest">
            K
          </span>
          <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">
            KFIQ Admin
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
          {mode === "login" ? "Admin sign in" : "Set up admin access"}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          {mode === "login"
            ? "Sign in with your KFIQ admin credentials."
            : "First time here? Set a password for your allowlisted KFIQ email."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kfiq.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "claim" ? "At least 8 characters" : "••••••••"}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create admin account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "claim" : "login");
            setError(null);
          }}
          className="mt-5 text-sm font-medium text-zinc-500 hover:text-[#0a0a0a] transition-colors"
        >
          {mode === "login"
            ? "First time? Set up your access →"
            : "← Back to sign in"}
        </button>
      </div>
    </main>
  );
}
