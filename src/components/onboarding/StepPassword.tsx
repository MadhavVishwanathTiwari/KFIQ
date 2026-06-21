"use client";

import { useState } from "react";

type Props = {
  hasPassword: boolean;
  onComplete: () => Promise<void>;
};

export function StepPassword({ hasPassword, onComplete }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match — please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to set password"
        );
      }
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-md">
      <div className="mb-7">
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Step 1
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
          {hasPassword ? "Update your password" : "Set a password"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          {hasPassword
            ? "You can update your dashboard password anytime from here."
            : "Create a password so you can sign back in anytime without needing a verification code."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Same password again"
            required
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading
            ? "Saving…"
            : hasPassword
            ? "Update password"
            : "Save & continue →"}
        </button>
      </form>
    </section>
  );
}