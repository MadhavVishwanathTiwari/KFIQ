"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/primitives";
import type {
  AdminApplication,
  AdminCertificate,
  AdminSubmission,
  TaskGroupListItem,
} from "@/lib/admin-types";

export default function AdminOverviewPage() {
  const [groups, setGroups] = useState<TaskGroupListItem[]>([]);
  const [pending, setPending] = useState<AdminApplication[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [certs, setCerts] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [g, a, s, c] = await Promise.all([
          fetch("/api/admin/task-groups").then((r) => r.json()),
          fetch("/api/admin/applications?status=pending").then((r) => r.json()),
          fetch("/api/admin/submissions").then((r) => r.json()),
          fetch("/api/admin/certificates").then((r) => r.json()),
        ]);
        setGroups(g.taskGroups ?? []);
        setPending(a.applications ?? []);
        setSubmissions(s.submissions ?? []);
        setCerts(c.certificates ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const awaitingReview = submissions.filter(
    (s) => s.reviewStatus === "pending"
  ).length;
  const openGroups = groups.filter((g) => g.isOpen).length;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Overview
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Manage task groups, review applications, and issue certificates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open groups"
          value={loading ? "—" : openGroups}
          hint={`${groups.length} total`}
        />
        <StatCard
          label="Pending applications"
          value={loading ? "—" : pending.length}
        />
        <StatCard
          label="Awaiting review"
          value={loading ? "—" : awaitingReview}
        />
        <StatCard label="Certificates issued" value={loading ? "—" : certs.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/task-groups" className="card p-5 hover:shadow-lg transition-shadow">
          <p className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
            Task groups →
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Create groups, subgroups, and tasks.
          </p>
        </Link>
        <Link href="/admin/applications" className="card p-5 hover:shadow-lg transition-shadow">
          <p className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
            Applications →
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Approve and assign tasks, or reject.
          </p>
        </Link>
        <Link href="/admin/submissions" className="card p-5 hover:shadow-lg transition-shadow">
          <p className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
            Submissions →
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Review work, give feedback, issue certs.
          </p>
        </Link>
      </div>
    </div>
  );
}
