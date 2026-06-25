"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, FilterChips } from "@/components/dashboard/primitives";
import type {
  AdminApplication,
  ApplicationStatus,
  AssignableTask,
} from "@/lib/admin-types";

const FILTERS: { label: string; value: ApplicationStatus | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("pending");
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter === "all" ? "" : `?status=${filter}`;
    const data = await fetch(`/api/admin/applications${qs}`).then((r) => r.json());
    setApps(data.applications ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Applications
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Approve an intern and assign specific tasks, or reject with a note.
        </p>
      </div>

      <FilterChips
        options={FILTERS.map((f) => f.label)}
        selected={FILTERS.find((f) => f.value === filter)!.label}
        onSelect={(label) =>
          setFilter(FILTERS.find((f) => f.label === label)!.value)
        }
      />

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : apps.length === 0 ? (
        <EmptyState
          title="No applications"
          description="Nothing matches this filter right now."
        />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <ApplicationRow key={app.id} app={app} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({
  app,
  onChanged,
}: {
  app: AdminApplication;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<AssignableTask[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openApprove() {
    setExpanded(true);
    setLoadingTasks(true);
    const data = await fetch(`/api/admin/applications/${app.id}`).then((r) =>
      r.json()
    );
    setTasks(data.assignableTasks ?? []);
    setLoadingTasks(false);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approve() {
    if (selected.size === 0) {
      setError("Select at least one task to assign.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${app.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: Array.from(selected) }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to approve.");
      return;
    }
    onChanged();
  }

  async function reject() {
    const note = window.prompt("Optional note for the intern (why rejected)?") ?? "";
    setBusy(true);
    const res = await fetch(`/api/admin/applications/${app.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setBusy(false);
    if (res.ok) onChanged();
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0a0a0a]">{app.internName}</p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[app.status]}`}
            >
              {app.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">{app.internCollege}</p>
          <p className="mt-1 text-sm text-zinc-600">
            Applied to <span className="font-medium">{app.taskGroupTitle}</span> ·{" "}
            {app.taskGroupField}
          </p>
          {app.rejectionNote && (
            <p className="mt-1 text-sm text-red-600">Note: {app.rejectionNote}</p>
          )}
        </div>

        {app.status === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={openApprove}
              disabled={busy}
            >
              Approve & assign
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={reject}
              disabled={busy}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {expanded && app.status === "pending" && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <p className="mb-2 text-sm font-semibold text-[#0a0a0a]">
            Assign tasks
          </p>
          {loadingTasks ? (
            <p className="text-sm text-zinc-400">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No unassigned tasks left in this group.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id}>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                    />
                    {t.title}
                    {t.taskSubgroupId ? (
                      <span className="text-xs text-zinc-400">(subgroup)</span>
                    ) : null}
                  </label>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={approve}
              disabled={busy || tasks.length === 0}
            >
              {busy ? "Approving…" : `Approve with ${selected.size} task(s)`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
