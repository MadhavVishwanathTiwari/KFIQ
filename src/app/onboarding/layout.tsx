import { Suspense } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
          <p className="text-slate-600">Loading onboarding…</p>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
