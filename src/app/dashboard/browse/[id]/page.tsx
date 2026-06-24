"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ApplicationStatusPill,
  EmptyState,
  SkillBadges,
} from "@/components/dashboard/primitives";
import type { ApplicationStatus, Task } from "@/lib/dashboard-types";
import { getDashboardData } from "@/lib/mock/dashboard";

export default function TaskGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const { taskGroups, applications } = getDashboardData();
  const group = taskGroups.find((g) => g.id === params.id);

  const initialStatus: ApplicationStatus =
    applications.find((a) => a.taskGroupId === params.id)?.status ?? "not_applied";
  const rejectionReason =
    applications.find((a) => a.taskGroupId === params.id)?.rejectionReason ?? null;

  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);

  if (!group) {
    return (
      <EmptyState
        title="Task group not found"
        description="It may have been removed."
        action={
          <Link href="/dashboard/browse" className="btn btn-secondary">
            Back to browse
          </Link>
        }
      />
    );
  }

  function apply() {
    // Optimistic only — no persistence in the mock shell.
    setStatus("pending");
  }

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/browse"
        className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
      >
        ← Back to browse
      </Link>

      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            {group.field}
          </span>
          <ApplicationStatusPill status={status} />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          {group.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          {group.description}
        </p>
        {group.certificateOnComplete && (
          <p className="mt-3 text-sm font-medium text-[#0a0a0a]">
            🎓 Earn a verifiable certificate on completion.
          </p>
        )}
      </div>

      {/* Required skills */}
      <div className="card p-5">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Skills used
        </p>
        <SkillBadges skills={group.requiredSkills} />
      </div>

      {/* Apply panel */}
      <div className="card p-5">
        {status === "not_applied" && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              Apply to be considered. Admins assign you specific tasks on
              approval.
            </p>
            <button type="button" className="btn btn-primary" onClick={apply}>
              Apply to this group
            </button>
          </div>
        )}
        {status === "pending" && (
          <p className="text-sm font-medium text-amber-700">
            Applied — your application is under review.
          </p>
        )}
        {status === "approved" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-emerald-700">
              You&apos;re approved for this group.
            </p>
            <Link href="/dashboard/tasks" className="btn btn-primary">
              View my tasks
            </Link>
          </div>
        )}
        {status === "rejected" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700">
              This application was not approved.
            </p>
            {rejectionReason && (
              <p className="text-sm text-zinc-600">{rejectionReason}</p>
            )}
            <button type="button" className="btn btn-secondary" onClick={apply}>
              Re-apply
            </button>
          </div>
        )}
      </div>

      {/* Structure */}
      <div className="space-y-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
          What you&apos;ll work on
        </h2>

        {group.directTasks.length > 0 && (
          <TaskList title="Group tasks" tasks={group.directTasks} />
        )}

        {group.subgroups.map((sg) => (
          <div key={sg.id}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-display text-base font-bold tracking-tight text-[#0a0a0a]">
                {sg.title}
              </h3>
              {sg.canRunConcurrent && (
                <span className="badge badge-sm">Runs in parallel</span>
              )}
            </div>
            <p className="mb-2.5 text-sm text-zinc-500">{sg.description}</p>
            <TaskList tasks={sg.tasks} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskList({ title, tasks }: { title?: string; tasks: Task[] }) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {title}
        </p>
      )}
      <ol className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="card flex items-start gap-3 p-4"
          >
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-500">
              {t.sequenceOrder}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#0a0a0a]">{t.title}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{t.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
