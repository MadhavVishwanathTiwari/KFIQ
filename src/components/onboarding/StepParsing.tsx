"use client";

import { useEffect, useRef, useState } from "react";
import type { OnboardingState, ProfileData } from "@/lib/types";
import { SourceBadge } from "@/components/onboarding/SourceBadge";

type Props = {
  intern: OnboardingState;
  profile: ProfileData;
  onComplete: () => Promise<void>;
  onRetry: () => Promise<void>;
};

export function StepParsing({ intern, profile, onComplete, onRetry }: Props) {
  const [loading, setLoading] = useState(
    intern.resumeParseStatus === "pending" ||
      intern.resumeParseStatus === "failed"
  );
  const [error, setError] = useState<string | null>(null);
  const parseStartedFor = useRef<string | null>(null);

  useEffect(() => {
    const shouldParse =
      intern.resumeParseStatus === "pending" ||
      intern.resumeParseStatus === "failed";

    if (!shouldParse) {
      parseStartedFor.current = null;
      return;
    }

    const key = `${intern.resumeParseStatus}:${intern.resumeUrl}`;
    if (parseStartedFor.current === key) return;
    parseStartedFor.current = key;

    void triggerParse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intern.resumeParseStatus, intern.resumeUrl]);

  async function triggerParse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/parse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parsing failed");
      await onRetry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing failed");
      await onRetry();
    } finally {
      setLoading(false);
    }
  }

  const totalParsed =
    profile.skills.length +
    profile.certifications.length +
    profile.education.length +
    profile.pastInternships.length +
    profile.projects.length;

  const isDone = intern.resumeParseStatus === "done";

  return (
    <section className="max-w-xl">
      <div className="mb-7">
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Step 3
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
          Parsing your resume
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          We run your resume through SharpAPI and write structured sections into
          your profile with{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs font-mono text-zinc-700">
            source = resume
          </code>
          .
        </p>
      </div>

      {/* Status card */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <StatusDot status={loading ? "processing" : intern.resumeParseStatus} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Status
          </p>
          <p className="mt-0.5 text-base font-bold capitalize text-[#0a0a0a]">
            {loading ? "Processing" : intern.resumeParseStatus}
          </p>
          {isDone && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {totalParsed} items extracted from your resume
            </p>
          )}
        </div>
      </div>

      {loading && (
        <p className="mb-6 text-sm text-zinc-400 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
          This may take up to 30 seconds…
        </p>
      )}

      {error && (
        <div className="mb-6 space-y-3">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void triggerParse()}
            disabled={loading}
          >
            Retry parsing
          </button>
        </div>
      )}

      {isDone && (
        <div className="space-y-5">
          <PreviewSection title="Skills" count={profile.skills.length}>
            {profile.skills.map((skill) => (
              <li key={skill.id} className="flex items-center gap-2">
                <span>{skill.name}</span>
                <SourceBadge source={skill.source} subtle />
              </li>
            ))}
          </PreviewSection>
          <PreviewSection title="Education" count={profile.education.length}>
            {profile.education.map((edu) => (
              <li key={edu.id} className="flex items-center gap-2 flex-wrap">
                <span>
                  {edu.institution}
                  {edu.degree ? ` — ${edu.degree}` : ""}
                </span>
                <SourceBadge source={edu.source} subtle />
              </li>
            ))}
          </PreviewSection>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void onComplete()}
            >
              Continue to profile →
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void triggerParse()}
              disabled={loading}
            >
              Re-parse resume
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-zinc-300",
    processing: "bg-zinc-600 animate-pulse",
    done: "bg-[#0a0a0a]",
    failed: "bg-red-500",
  };
  const cls = map[status] ?? "bg-zinc-300";
  return (
    <span
      className={`flex-shrink-0 h-3 w-3 rounded-full ${cls}`}
      aria-hidden
    />
  );
}

function PreviewSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {title}{" "}
        <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 font-bold">
          {count}
        </span>
      </h3>
      <ul className="space-y-1.5 text-sm text-[#0a0a0a]">{children}</ul>
    </div>
  );
}