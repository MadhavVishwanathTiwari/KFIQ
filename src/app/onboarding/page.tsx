// src/app/onboarding/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepPassword } from "@/components/onboarding/StepPassword";
import { StepResume } from "@/components/onboarding/StepResume";
import { StepParsing } from "@/components/onboarding/StepParsing";
import { StepProfile } from "@/components/onboarding/StepProfile";
import {
  canNavigateToStep,
  getSuggestedStep,
  ONBOARDING_STEPS,
  type StepId,
} from "@/lib/onboarding-steps";
import type { OnboardingState, ProfileData } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("password");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/onboarding/status");
    if (!res.ok) {
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      throw new Error("Failed to load onboarding status");
    }
    const data = await res.json();
    setState(data.intern);
    setProfile(data.profile);
    return data.intern as OnboardingState;
  }, [router]);

  // Auth guard + initial load. No valid session → back to the login screen.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const intern = await refreshStatus();
        if (active && intern) setActiveStep(getSuggestedStep(intern));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshStatus]);

  const currentStepIndex = useMemo(
    () => ONBOARDING_STEPS.findIndex((step) => step.id === activeStep),
    [activeStep]
  );

  function handleStepClick(stepId: StepId) {
    if (!state || !canNavigateToStep(state, stepId)) return;
    setActiveStep(stepId);
  }

  async function handleFinish() {
    setFinishing(true);
    setFinishError(null);
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not finish onboarding");
      router.push("/dashboard");
    } catch (err) {
      setFinishError(
        err instanceof Error ? err.message : "Could not finish onboarding"
      );
      setFinishing(false);
    }
  }

  if (loading || !state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading…</span>
      </main>
    );
  }

  const firstName = state.fullName.split(" ")[0];
  const alreadyComplete = Boolean(state.onboardingCompletedAt);

  return (
    <main className="relative min-h-screen">
      {/* Top ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10">
        <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-10 pb-20">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a0a0a] text-white text-[10px] font-bold tracking-widest">
                K
              </span>
              <span className="text-xs font-semibold text-zinc-400 tracking-widest uppercase">
                Intern onboarding
              </span>
            </div>
            {alreadyComplete && (
              <button
                type="button"
                className="text-sm font-semibold text-zinc-500 hover:text-[#0a0a0a] transition-colors"
                onClick={() => router.push("/dashboard")}
              >
                Back to dashboard →
              </button>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
            Hi {firstName}, let&apos;s finish your registration.
          </h1>
          <p className="mt-2.5 text-sm text-zinc-500">
            {state.college} · {state.courseType} · {state.fieldOfInterest}
          </p>
        </header>

        {/* Step navigation */}
        <nav
          aria-label="Onboarding steps"
          className="mb-8 grid gap-2 sm:grid-cols-4"
        >
          {ONBOARDING_STEPS.map((step, index) => {
            const isActive = step.id === activeStep;
            const isComplete = index < currentStepIndex;
            const isClickable = canNavigateToStep(state, step.id);

            return (
              <button
                key={step.id}
                type="button"
                className={`step-nav ${
                  isActive
                    ? "step-nav-active"
                    : isComplete
                    ? "step-nav-complete"
                    : ""
                }`}
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="mr-2 opacity-50 text-xs">{index + 1}</span>
                {step.label}
              </button>
            );
          })}
        </nav>

        {/* Step content */}
        <div className="card p-7 sm:p-10">
          {activeStep === "password" && (
            <StepPassword
              hasPassword={state.hasPassword}
              onComplete={async () => {
                const intern = await refreshStatus();
                if (intern) setActiveStep(getSuggestedStep(intern));
              }}
            />
          )}
          {activeStep === "resume" && (
            <StepResume
              intern={state}
              onUploaded={async () => {
                const intern = await refreshStatus();
                if (intern) setActiveStep("parsing");
              }}
            />
          )}
          {activeStep === "parsing" && profile && (
            <StepParsing
              intern={state}
              profile={profile}
              onComplete={async () => {
                await refreshStatus();
                setActiveStep("profile");
              }}
              onRetry={async () => {
                await refreshStatus();
              }}
            />
          )}
          {activeStep === "profile" && profile && (
            <StepProfile
              profile={profile}
              onChange={async () => {
                await refreshStatus();
              }}
            />
          )}
        </div>

        {/* Finish → dashboard. Available once a password is set; resume/profile
            are optional enrichments the intern can return to later. */}
        {activeStep === "profile" && (
          <div className="mt-6 flex flex-col items-end gap-2">
            {finishError && (
              <p className="text-sm text-red-600">{finishError}</p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={finishing || !state.hasPassword}
            >
              {finishing
                ? "Finishing…"
                : alreadyComplete
                ? "Go to dashboard →"
                : "Finish & go to dashboard →"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
