"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DashboardSessionProvider } from "@/components/dashboard/session";
import { getDashboardData } from "@/lib/mock/dashboard";
import type { OnboardingState } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/browse", label: "Browse & apply", exact: false },
  { href: "/dashboard/tasks", label: "My tasks", exact: false },
];

const SECONDARY_NAV = [
  { href: "/onboarding", label: "Profile" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<OnboardingState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        const data = await res.json();
        const intern: OnboardingState | undefined = data.intern;
        if (!intern) {
          router.replace("/");
          return;
        }
        // Gate: dashboard unlocks only after onboarding is finished.
        if (!intern.onboardingCompletedAt) {
          router.replace("/onboarding");
          return;
        }
        if (active) {
          setSession(intern);
          setReady(true);
        }
      } catch {
        if (active) router.replace("/");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // best-effort; redirect regardless
    }
    router.push("/");
  }

  if (!ready || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading…</span>
      </main>
    );
  }

  const cohort = getDashboardData().intern.cohort;
  const firstName = session.fullName.split(" ")[0];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <DashboardSessionProvider value={session}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-zinc-200 lg:w-64 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 px-5 py-5 lg:flex-col lg:items-stretch lg:gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white text-xs font-bold tracking-widest">
                K
              </span>
              <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">
                KFIQ
              </span>
            </Link>

            <nav className="flex items-center gap-1 lg:flex-col lg:items-stretch lg:gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive(item.href, item.exact)
                      ? "bg-[#0a0a0a] text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-[#0a0a0a]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="hidden lg:my-2 lg:block lg:h-px lg:bg-zinc-200" />
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href, false)
                      ? "bg-zinc-100 text-[#0a0a0a]"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-[#0a0a0a]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0a0a0a]">
                {session.fullName}
              </p>
              <p className="text-xs text-zinc-400">Cohort · {cohort}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
            >
              Sign out
            </button>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
            {/* firstName kept available to children via context; greeting lives
                on the Overview page. */}
            <span className="sr-only">Signed in as {firstName}</span>
            {children}
          </main>
        </div>
      </div>
    </DashboardSessionProvider>
  );
}
