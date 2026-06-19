"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [loading, setLoading] = useState(Boolean(emailFromUrl));
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("password");
  const hasInitializedStep = useRef(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/onboarding/status");
    if (!res.ok) {
      if (res.status === 401) {
        setState(null);
        setProfile(null);
        hasInitializedStep.current = false;
        return;
      }
      throw new Error("Failed to load onboarding status");
    }
    const data = await res.json();
    setState(data.intern);
    setProfile(data.profile);
    return data.intern as OnboardingState;
  }, []);

  const startSession = useCallback(
    async (targetEmail: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Could not start session");
        }
        setState(data.intern);
        hasInitializedStep.current = false;
        const intern = await refreshStatus();
        if (intern) {
          setActiveStep(getSuggestedStep(intern));
          hasInitializedStep.current = true;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [refreshStatus]
  );

  useEffect(() => {
    if (emailFromUrl) {
      void startSession(emailFromUrl);
      return;
    }
    void refreshStatus()
      .then((intern) => {
        if (intern && !hasInitializedStep.current) {
          setActiveStep(getSuggestedStep(intern));
          hasInitializedStep.current = true;
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [emailFromUrl, refreshStatus, startSession]);

  const currentStepIndex = useMemo(
    () => ONBOARDING_STEPS.findIndex((step) => step.id === activeStep),
    [activeStep]
  );

  function handleStepClick(stepId: StepId) {
    if (!state || !canNavigateToStep(state, stepId)) return;
    setActiveStep(stepId);
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    await startSession(email.trim());
  }

  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
        <div className="card w-full p-8">
          <h1 className="mb-2 text-2xl font-bold">Welcome to KFIQ</h1>
          <p className="mb-6 text-slate-600">
            Enter the email you used on the landing page to continue registration.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Intern onboarding
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Hi {state.fullName.split(" ")[0]}, let&apos;s complete your profile
        </h1>
        <p className="mt-2 text-slate-600">
          {state.college} · {state.courseType} · {state.fieldOfInterest}
        </p>
      </header>

      <nav aria-label="Onboarding steps" className="mb-8 grid gap-3 sm:grid-cols-4">
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
              <span className="mr-2 opacity-70">{index + 1}.</span>
              {step.label}
            </button>
          );
        })}
      </nav>

      <div className="card p-6 sm:p-8">
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
    </main>
  );
}
