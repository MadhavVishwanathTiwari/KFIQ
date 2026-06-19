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
      setError("Passwords do not match");
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
          typeof data.error === "string"
            ? data.error
            : "Failed to set password"
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
    <section>
      <h2 className="mb-2 text-xl font-bold">
        {hasPassword ? "Update your password" : "Set your password"}
      </h2>
      <p className="mb-6 text-slate-600">
        {hasPassword
          ? "You can return here anytime to change your dashboard password."
          : "Create a password to secure your dashboard account. You skipped this on the landing page signup."}
      </p>
      <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            required
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-fit" disabled={loading}>
          {loading ? "Saving..." : hasPassword ? "Update password" : "Save & continue"}
        </button>
      </form>
    </section>
  );
}
