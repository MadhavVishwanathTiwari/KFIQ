"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthEntry } from "@/components/auth/AuthEntry";
import type { OnboardingState } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  function routeForIntern(intern: OnboardingState) {
    if (intern.onboardingCompletedAt) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }

  // If a valid session already exists, skip the login screen.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();
          if (active && data.intern) {
            routeForIntern(data.intern);
            return;
          }
        }
      } catch {
        // fall through to the login screen
      }
      if (active) setChecking(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading…</span>
      </main>
    );
  }

  return <AuthEntry onAuthenticated={routeForIntern} />;
}
