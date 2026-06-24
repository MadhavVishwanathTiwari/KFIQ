"use client";

import Link from "next/link";
import { useDashboardSession } from "@/components/dashboard/session";
import {
  AssignmentStatusPill,
  SkillBadges,
  StatCard,
} from "@/components/dashboard/primitives";
import { countTasks, type Feedback } from "@/lib/dashboard-types";
import { getDashboardData } from "@/lib/mock/dashboard";

export default function OverviewPage() {
  const session = useDashboardSession();
  const firstName = session.fullName.split(" ")[0];
  const { intern, taskGroups, applications, assignedTasks, certificates } =
    getDashboardData();

  const activeGroups = applications.filter((a) => a.status === "approved").length;
  const inProgress = assignedTasks.filter((t) => t.status === "in_progress").length;
  const awaitingReview = assignedTasks.filter(
    (t) => t.status === "submitted"
  ).length;

  const actionable = assignedTasks.filter((t) =>
    ["not_started", "in_progress", "rejected"].includes(t.status)
  );

  const appliedGroupIds = new Set(
    applications.filter((a) => a.status !== "not_applied").map((a) => a.taskGroupId)
  );
  const recommended = taskGroups.filter((g) => {
    if (appliedGroupIds.has(g.id)) return false;
    const fieldMatch = g.field === intern.fieldOfInterest;
    const skillMatch = g.requiredSkills.some((s) => intern.skills.includes(s));
    return fieldMatch || skillMatch;
  });

  const recentFeedback: (Feedback & { taskTitle: string })[] = assignedTasks
    .flatMap((t) => t.feedback.map((f) => ({ ...f, taskTitle: t.taskTitle })))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="badge badge-manual">Cohort · {intern.cohort}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Here&apos;s where your internship stands today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active groups" value={activeGroups} hint="Approved" />
        <StatCard label="In progress" value={inProgress} hint="Tasks" />
        <StatCard
          label="Awaiting review"
          value={awaitingReview}
          hint="Submitted"
        />
        <StatCard label="Certificates" value={certificates.length} hint="Earned" />
      </div>

      {/* Continue where you left off */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
            Continue where you left off
          </h2>
          <Link
            href="/dashboard/tasks"
            className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
          >
            All tasks →
          </Link>
        </div>
        {actionable.length === 0 ? (
          <p className="card px-5 py-8 text-center text-sm text-zinc-500">
            Nothing in flight right now. Browse task groups to pick up new work.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {actionable.map((task) => (
              <li key={task.id}>
                <Link
                  href="/dashboard/tasks"
                  className="card flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0a0a0a]">
                      {task.taskTitle}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {task.taskGroupTitle}
                      {task.subgroupTitle ? ` · ${task.subgroupTitle}` : ""}
                    </p>
                  </div>
                  <AssignmentStatusPill status={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommended task groups */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
            Recommended for you
          </h2>
          <Link
            href="/dashboard/browse"
            className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
          >
            Browse all →
          </Link>
        </div>
        {recommended.length === 0 ? (
          <p className="card px-5 py-8 text-center text-sm text-zinc-500">
            No new matches right now — check back as admins post more groups.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.map((g) => (
              <Link
                key={g.id}
                href={`/dashboard/browse/${g.id}`}
                className="card p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  {g.field}
                </p>
                <p className="mt-1.5 font-semibold text-[#0a0a0a]">{g.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {g.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <SkillBadges skills={g.requiredSkills.slice(0, 3)} />
                  <span className="text-xs text-zinc-400">
                    {countTasks(g)} tasks
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent feedback */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
          Recent feedback
        </h2>
        {recentFeedback.length === 0 ? (
          <p className="card px-5 py-8 text-center text-sm text-zinc-500">
            No feedback yet. Reviewers leave notes here once you submit work.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {recentFeedback.map((f) => (
              <li key={f.id} className="card p-4">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#0a0a0a]">
                    {f.author}
                  </span>
                  <span className="text-xs text-zinc-400">on {f.taskTitle}</span>
                </div>
                <p className="text-sm text-zinc-600">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
