"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/task-groups", label: "Task groups", exact: false },
  { href: "/admin/applications", label: "Applications", exact: false },
  { href: "/admin/submissions", label: "Submissions", exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/session");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (active) {
          setEmail(data.admin?.email ?? null);
          setReady(true);
        }
      } catch {
        if (active) router.replace("/admin/login");
      }
    })();
    return () => {
      active = false;
    };
  }, [router, isLogin, pathname]);

  // The login page renders standalone — no admin chrome.
  if (isLogin) return <>{children}</>;

  async function signOut() {
    try {
      await fetch("/api/admin/auth/session", { method: "DELETE" });
    } catch {
      // best-effort; redirect regardless
    }
    router.push("/admin/login");
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading…</span>
      </main>
    );
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-zinc-200 lg:w-64 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-5 py-5 lg:flex-col lg:items-stretch lg:gap-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white text-xs font-bold tracking-widest">
              K
            </span>
            <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">
              KFIQ Admin
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
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-8">
          <p className="truncate text-sm font-semibold text-[#0a0a0a]">
            {email ?? "Admin"}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
          >
            Sign out
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
