"use client";

import { useState } from "react";
import type { OnboardingState } from "@/lib/types";

type Props = {
  intern: OnboardingState;
  onUploaded: () => Promise<void>;
};

export function StepResume({ intern, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasExistingResume = Boolean(
    intern.resumeUrl && intern.resumeParseStatus !== "not_uploaded"
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a resume file to upload");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setFile(null);
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-lg">
      <div className="mb-7">
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Step 2
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
          {hasExistingResume ? "Replace your resume" : "Upload your resume"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          We&apos;ll parse your resume to pre-fill skills, education, and
          experience. PDF or Word, up to 10 MB.
          {hasExistingResume &&
            " Uploading a new file replaces the current one and re-parses your profile."}
        </p>
      </div>

      {hasExistingResume && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <span className="text-zinc-500">Current file:</span>
          <a
            href={intern.resumeUrl!}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#0a0a0a] underline underline-offset-2"
          >
            View uploaded resume ↗
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="field">
          <label htmlFor="resume">
            {hasExistingResume ? "New resume file" : "Resume file"}
          </label>
          <input
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
            ? "Uploading…"
            : hasExistingResume
            ? "Upload new resume"
            : "Upload & continue →"}
        </button>
      </form>
    </section>
  );
}