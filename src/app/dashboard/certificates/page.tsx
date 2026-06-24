"use client";

import { EmptyState } from "@/components/dashboard/primitives";
import { getDashboardData } from "@/lib/mock/dashboard";

export default function CertificatesPage() {
  const { certificates } = getDashboardData();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Certificates
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Verifiable certificates you earn by completing task groups.
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Finish all your assigned tasks in a group to earn its certificate."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <div key={c.id} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">🎓</span>
                <span className="badge badge-manual">Verified</span>
              </div>
              <p className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
                {c.taskGroupTitle}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Issued {new Date(c.issuedAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                  QR
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">Verification ID</p>
                  <p className="truncate font-mono text-xs text-zinc-600">
                    {c.verifyUuid}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
