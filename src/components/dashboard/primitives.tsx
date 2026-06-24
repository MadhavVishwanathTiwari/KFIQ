"use client";

import type {
  ApplicationStatus,
  AssignmentStatus,
} from "@/lib/dashboard-types";

/* ------------------------------------------------------------------ */
/* Status pills                                                         */
/* ------------------------------------------------------------------ */

type Tone = "neutral" | "info" | "warn" | "success" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

const ASSIGNMENT_META: Record<AssignmentStatus, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  submitted: { label: "Awaiting review", tone: "warn" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Needs changes", tone: "danger" },
};

const APPLICATION_META: Record<ApplicationStatus, { label: string; tone: Tone }> =
  {
    not_applied: { label: "Not applied", tone: "neutral" },
    pending: { label: "Pending review", tone: "warn" },
    approved: { label: "Approved", tone: "success" },
    rejected: { label: "Rejected", tone: "danger" },
  };

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

export function AssignmentStatusPill({ status }: { status: AssignmentStatus }) {
  const meta = ASSIGNMENT_META[status];
  return <Pill label={meta.label} tone={meta.tone} />;
}

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  const meta = APPLICATION_META[status];
  return <Pill label={meta.label} tone={meta.tone} />;
}

/* ------------------------------------------------------------------ */
/* Skill badges                                                         */
/* ------------------------------------------------------------------ */

export function SkillBadges({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span key={s} className="badge badge-sm">
          {s}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                            */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                         */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {value} of {total} tasks approved
        </span>
        <span className="font-semibold text-[#0a0a0a]">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-[#0a0a0a] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter chips                                                         */
/* ------------------------------------------------------------------ */

export function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = opt === selected;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
