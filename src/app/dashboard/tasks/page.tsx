"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, ProgressBar } from "@/components/dashboard/primitives";
import { TaskRow } from "@/components/dashboard/TaskRow";
import type { AssignedTask } from "@/lib/dashboard-types";
import { getDashboardData } from "@/lib/mock/dashboard";

const DIRECT_LANE = "__direct__";

export default function MyTasksPage() {
  const { assignedTasks } = getDashboardData();
  const [tasks, setTasks] = useState<AssignedTask[]>(assignedTasks);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateTask(id: string, patch: Partial<AssignedTask>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  function startTask(id: string) {
    updateTask(id, { status: "in_progress" });
  }

  function submitTask(id: string, notes: string) {
    updateTask(id, {
      status: "submitted",
      submission: { notes, submittedAt: new Date().toISOString() },
    });
  }

  // Group → lanes (direct + subgroups), preserving encounter order.
  const groups = useMemo(() => {
    const byGroup = new Map<
      string,
      { title: string; lanes: Map<string, { title: string | null; tasks: AssignedTask[] }> }
    >();

    for (const t of tasks) {
      if (!byGroup.has(t.taskGroupId)) {
        byGroup.set(t.taskGroupId, { title: t.taskGroupTitle, lanes: new Map() });
      }
      const group = byGroup.get(t.taskGroupId)!;
      const laneKey = t.subgroupId ?? DIRECT_LANE;
      if (!group.lanes.has(laneKey)) {
        group.lanes.set(laneKey, { title: t.subgroupTitle, tasks: [] });
      }
      group.lanes.get(laneKey)!.tasks.push(t);
    }

    return Array.from(byGroup.entries()).map(([groupId, g]) => {
      const lanes = Array.from(g.lanes.entries())
        // direct lane first, then subgroups
        .sort(([a], [b]) =>
          a === DIRECT_LANE ? -1 : b === DIRECT_LANE ? 1 : 0
        )
        .map(([laneKey, lane]) => ({
          laneKey,
          title: lane.title,
          tasks: [...lane.tasks].sort((x, y) => x.sequenceOrder - y.sequenceOrder),
        }));

      const all = g.lanes
        ? Array.from(g.lanes.values()).flatMap((l) => l.tasks)
        : [];
      const approved = all.filter((t) => t.status === "approved").length;

      return {
        groupId,
        title: g.title,
        lanes,
        total: all.length,
        approved,
        allApproved: all.length > 0 && approved === all.length,
      };
    });
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="space-y-7">
        <Header />
        <EmptyState
          title="No assigned tasks yet"
          description="Apply to a task group — once an admin approves you, your tasks show up here."
          action={
            <Link href="/dashboard/browse" className="btn btn-primary">
              Browse task groups
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Header />

      {groups.map((group) => (
        <section key={group.groupId} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-[#0a0a0a]">
              {group.title}
            </h2>
          </div>

          {/* Group-level completion */}
          <div className="card p-4">
            <ProgressBar value={group.approved} total={group.total} />
          </div>

          {group.allApproved && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-lg">🎓</span>
              <div>
                <p className="font-semibold text-emerald-800">
                  Certificate earned
                </p>
                <p className="text-sm text-emerald-700">
                  All your tasks in this group are approved. Your certificate is
                  on its way.
                </p>
              </div>
            </div>
          )}

          {/* Lanes */}
          <div className="grid gap-5 lg:grid-cols-2">
            {group.lanes.map((lane) => {
              let priorAllApproved = true;
              return (
                <div key={lane.laneKey} className="space-y-2.5">
                  {lane.title && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      {lane.title}
                    </p>
                  )}
                  {lane.tasks.map((task) => {
                    const locked =
                      task.status === "not_started" && !priorAllApproved;
                    priorAllApproved =
                      priorAllApproved && task.status === "approved";
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        locked={locked}
                        expanded={expandedId === task.id}
                        onToggle={() =>
                          setExpandedId(
                            expandedId === task.id ? null : task.id
                          )
                        }
                        onStart={() => startTask(task.id)}
                        onSubmit={(notes) => submitTask(task.id, notes)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
        My tasks
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500">
        Work through your assigned tasks, submit for review, and track feedback.
      </p>
    </div>
  );
}
