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
      if (!res.ok) {
        throw new Error(data.error ?? "Parsing failed");
      }
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
    <section>
      <h2 className="mb-2 text-xl font-bold">Parsing your resume</h2>
      <p className="mb-6 text-slate-600">
        We send your resume to SharpAPI and write structured sections into your
        profile with <code className="text-sm">source = resume</code>.
      </p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Status</p>
        <p className="mt-1 text-lg font-bold capitalize text-slate-900">
          {loading ? "processing" : intern.resumeParseStatus}
        </p>
        {isDone && (
          <p className="mt-2 text-sm text-emerald-700">
            Parsed {totalParsed} profile items from your resume.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 space-y-3">
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
        <div className="space-y-4">
          <PreviewSection title="Skills" count={profile.skills.length}>
            {profile.skills.map((skill) => (
              <li key={skill.id} className="flex items-center gap-2">
                {skill.name}
                <SourceBadge source={skill.source} />
              </li>
            ))}
          </PreviewSection>
          <PreviewSection title="Education" count={profile.education.length}>
            {profile.education.map((edu) => (
              <li key={edu.id}>
                {edu.institution}
                {edu.degree ? ` — ${edu.degree}` : ""}
                <SourceBadge source={edu.source} />
              </li>
            ))}
          </PreviewSection>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onComplete()}
          >
            Continue to profile
          </button>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">This may take up to 30 seconds…</p>
      )}
    </section>
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
    <div>
      <h3 className="mb-2 font-semibold text-slate-800">
        {title} ({count})
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {children}
      </ul>
    </div>
  );
}
