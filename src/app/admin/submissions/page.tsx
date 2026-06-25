"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/primitives";
import type { AdminSubmission, SubmissionReviewStatus } from "@/lib/admin-types";

const STATUS_TONE: Record<SubmissionReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function SubmissionsPage() {
  const [subs, setSubs] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/submissions").then((r) => r.json());
    setSubs(data.submissions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Submissions
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Review work, leave feedback, and issue certificates when a group is done.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : subs.length === 0 ? (
        <EmptyState
          title="No submissions"
          description="Interns haven't submitted any work yet."
        />
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <SubmissionRow key={s.id} sub={s} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  sub,
  onChanged,
}: {
  sub: AdminSubmission;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [issued, setIssued] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function review(decision: "approved" | "rejected") {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/submissions/${sub.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(false);
    if (!res.ok) {
      setMsg("Failed to review.");
      return;
    }
    const data = await res.json();
    setEligible(Boolean(data.certificateEligible));
    onChanged();
  }

  async function sendFeedback() {
    if (!feedback.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/admin/submissions/${sub.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackText: feedback }),
    });
    setBusy(false);
    if (res.ok) {
      setFeedback("");
      setFeedbackSent(true);
    }
  }

  async function issueCertificate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internId: sub.internId,
        taskGroupId: sub.taskGroupId,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setIssued(true);
      setMsg(`Certificate issued · verify token ${data.certificate?.verifyToken}`);
    } else {
      setMsg(typeof data.error === "string" ? data.error : "Failed to issue.");
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0a0a0a]">{sub.taskTitle}</p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[sub.reviewStatus]}`}
            >
              {sub.reviewStatus}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {sub.internName} · {sub.taskGroupTitle}
          </p>
          {sub.notes && (
            <p className="mt-2 text-sm text-zinc-700">{sub.notes}</p>
          )}
          {sub.attachmentUrls && sub.attachmentUrls.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {sub.attachmentUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sub.reviewStatus === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => review("approved")}
              disabled={busy}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => review("rejected")}
              disabled={busy}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="mt-4 border-t border-zinc-200 pt-4">
        <div className="flex gap-2">
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave feedback for the intern…"
            className="flex-1 rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2 text-sm focus:border-[#0a0a0a] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={sendFeedback}
            disabled={busy || !feedback.trim()}
          >
            Send
          </button>
        </div>
        {feedbackSent && (
          <p className="mt-1.5 text-xs text-emerald-600">Feedback sent.</p>
        )}
      </div>

      {(eligible || issued) && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          {issued ? (
            <p className="text-sm font-medium text-emerald-700">{msg}</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-emerald-700">
                All tasks in {sub.taskGroupTitle} are approved — {sub.internName} is
                eligible for a certificate.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={issueCertificate}
                disabled={busy}
              >
                Issue certificate
              </button>
            </div>
          )}
        </div>
      )}

      {msg && !issued && (
        <p className="mt-2 text-sm font-medium text-red-600">{msg}</p>
      )}
    </div>
  );
}
