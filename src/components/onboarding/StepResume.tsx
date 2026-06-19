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
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      setFile(null);
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-xl font-bold">
        {hasExistingResume ? "Replace your resume" : "Upload your resume"}
      </h2>
      <p className="mb-6 text-slate-600">
        We&apos;ll parse your resume to pre-fill skills, education, and
        experience. PDF or Word, up to 10 MB.
        {hasExistingResume &&
          " Uploading a new file will replace the current one and re-parse your profile."}
      </p>

      {hasExistingResume && (
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Current file:{" "}
          <a
            href={intern.resumeUrl!}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 underline"
          >
            View uploaded resume
          </a>
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-fit" disabled={loading}>
          {loading
            ? "Uploading..."
            : hasExistingResume
              ? "Upload new resume"
              : "Upload & continue"}
        </button>
      </form>
    </section>
  );
}
