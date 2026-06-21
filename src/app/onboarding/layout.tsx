import { Suspense } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-pulse" />
            Loading…
          </div>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}