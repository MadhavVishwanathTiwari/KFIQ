"use client";

import type { Feedback } from "@/lib/dashboard-types";

export function FeedbackThread({ feedback }: { feedback: Feedback[] }) {
  if (feedback.length === 0) {
    return (
      <p className="text-sm italic text-zinc-400">
        No feedback yet. Reviewers leave notes here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {feedback.map((f) => (
        <li
          key={f.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#0a0a0a]">
              {f.author}
            </span>
            <span className="text-xs text-zinc-400">
              {new Date(f.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{f.message}</p>
        </li>
      ))}
    </ul>
  );
}
