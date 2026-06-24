"use client";

import { AssignmentStatusPill, SkillBadges } from "./primitives";
import { FeedbackThread } from "./FeedbackThread";
import { SubmitWorkForm } from "./SubmitWorkForm";
import type { AssignedTask, AssignmentStatus } from "@/lib/dashboard-types";

const TIMELINE: AssignmentStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "approved",
];

const TIMELINE_LABEL: Record<AssignmentStatus, string> = {
  not_started: "Assigned",
  in_progress: "Started",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Returned",
};

export function TaskRow({
  task,
  locked,
  expanded,
  onToggle,
  onStart,
  onSubmit,
}: {
  task: AssignedTask;
  locked: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  onSubmit: (notes: string) => void;
}) {
  const canSubmit = task.status === "in_progress" || task.status === "rejected";
  const currentIndex = TIMELINE.indexOf(
    task.status === "rejected" ? "submitted" : task.status
  );

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        className="flex w-full items-center justify-between gap-4 p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-500">
            {task.sequenceOrder}
          </span>
          <span className="truncate font-semibold text-[#0a0a0a]">
            {task.taskTitle}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          {locked ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
              🔒 Locked
            </span>
          ) : (
            <AssignmentStatusPill status={task.status} />
          )}
        </div>
      </button>

      {expanded && !locked && (
        <div className="space-y-5 border-t border-zinc-100 p-5">
          <p className="text-sm leading-relaxed text-zinc-600">
            {task.taskDescription}
          </p>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Skills
            </p>
            <SkillBadges skills={task.requiredSkills} />
          </div>

          {/* Status timeline */}
          <div className="flex items-center gap-2">
            {TIMELINE.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        done
                          ? "bg-[#0a0a0a] text-white"
                          : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="mt-1 text-[10px] text-zinc-400">
                      {TIMELINE_LABEL[step]}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div
                      className={`h-px flex-1 ${
                        i < currentIndex ? "bg-[#0a0a0a]" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {task.status === "not_started" && (
            <button type="button" className="btn btn-primary" onClick={onStart}>
              Start task
            </button>
          )}

          {canSubmit && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#0a0a0a]">
                Submit your work
              </p>
              <SubmitWorkForm onSubmit={onSubmit} />
            </div>
          )}

          {task.status === "submitted" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
              Submitted on{" "}
              {task.submission
                ? new Date(task.submission.submittedAt).toLocaleDateString()
                : "—"}{" "}
              · awaiting reviewer approval.
            </p>
          )}

          {task.status === "approved" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
              Approved — nice work.
            </p>
          )}

          {/* Feedback */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Feedback
            </p>
            <FeedbackThread feedback={task.feedback} />
          </div>
        </div>
      )}
    </div>
  );
}
