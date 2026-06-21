// src/app/onboarding/page.tsx
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

type EntryStage = "email" | "password" | "choose-method" | "otp";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [entryStage, setEntryStage] = useState<EntryStage>("email");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const [state, setState] = useState<OnboardingState | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("password");

  const [phoneInfo, setPhoneInfo] = useState<{
    hasPhone: boolean;
    maskedPhone: string | null;
  }>({ hasPhone: false, maskedPhone: null });
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/onboarding/status");
    if (!res.ok) {
      if (res.status === 401) {
        setState(null);
        setProfile(null);
        return;
      }
      throw new Error("Failed to load onboarding status");
    }
    const data = await res.json();
    setState(data.intern);
    setProfile(data.profile);
    return data.intern as OnboardingState;
  }, []);

  const onSessionEstablished = useCallback(
    async (intern: OnboardingState) => {
      setState(intern);
      const refreshed = await refreshStatus();
      if (refreshed) setActiveStep(getSuggestedStep(refreshed));
    },
    [refreshStatus]
  );

  const sendOtp = useCallback(
    async (targetEmail: string, method: "email" | "sms") => {
      setLoading(true);
      setError(null);
      setOtpNotice(null);
      setOtpMethod(method);

      try {
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail, method }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error ?? "Could not send verification code");

        setEntryStage("otp");
        setOtpNotice(
          method === "sms"
            ? `We sent a verification code to your phone.`
            : `We sent a verification code to ${targetEmail}.`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkEmail = useCallback(
    async (targetEmail: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error ?? "Could not find that account");

        setPhoneInfo({ hasPhone: data.hasPhone, maskedPhone: data.maskedPhone });

        if (data.hasPassword) {
          setEntryStage("password");
          setLoading(false);
        } else if (data.hasPhone) {
          setEntryStage("choose-method");
          setLoading(false);
        } else {
          await sendOtp(targetEmail, "email");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    },
    [sendOtp]
  );

  useEffect(() => {
    if (emailFromUrl) {
      void checkEmail(emailFromUrl);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    await checkEmail(email.trim());
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Incorrect password");
      await onSessionEstablished(data.intern);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: otpCode.trim(),
          method: otpMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      await onSessionEstablished(
        data.session?.user ? data.intern || state : data.intern
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Auth screens                                                         */
  /* ------------------------------------------------------------------ */
  if (!state) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-5 py-16 overflow-hidden">
        {/* Ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-dot-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="animate-aurora absolute -left-32 -top-32 size-[28rem] rounded-full bg-zinc-200/60 blur-3xl" />
          <div className="animate-float-slow absolute -right-24 top-8 size-[22rem] rounded-full bg-zinc-300/40 blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          {/* Logo mark */}
          <div className="mb-8 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white text-xs font-bold tracking-widest">
              K
            </span>
            <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">
              KFIQ
            </span>
          </div>

          <div className="card w-full p-8">
            {entryStage === "email" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
                  Continue registration
                </h1>
                <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                  Enter the email you used when you applied to pick up where you
                  left off.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="field">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      required
                      autoFocus
                    />
                  </div>
                  {error && <ErrorBanner>{error}</ErrorBanner>}
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? "Checking…" : "Continue →"}
                  </button>
                </form>
              </>
            )}

            {entryStage === "password" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
                  Welcome back
                </h1>
                <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                  Sign in to{" "}
                  <span className="font-medium text-zinc-700">{email}</span>
                </p>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="field">
                    <label htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  {error && <ErrorBanner>{error}</ErrorBanner>}
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Sign in →"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={() => {
                      setEntryStage("email");
                      setPassword("");
                      setError(null);
                    }}
                  >
                    Use a different email
                  </button>
                </form>
              </>
            )}

            {entryStage === "choose-method" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
                  Verify your identity
                </h1>
                <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                  Choose how you want to receive a one-time code.
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={() => sendOtp(email, "sms")}
                    disabled={loading}
                  >
                    {loading && otpMethod === "sms"
                      ? "Sending…"
                      : `Text me at ${phoneInfo.maskedPhone}`}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={() => sendOtp(email, "email")}
                    disabled={loading}
                  >
                    {loading && otpMethod === "email"
                      ? "Sending…"
                      : "Email me a code"}
                  </button>
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                    onClick={() => {
                      setEntryStage("email");
                      setError(null);
                    }}
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}

            {entryStage === "otp" && (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
                  Enter your code
                </h1>
                <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                  {otpNotice ?? `We sent a code to ${email}.`} It expires in
                  10 minutes.
                </p>
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="field">
                    <label htmlFor="otp">6-digit code</label>
                    <input
                      id="otp"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123456"
                      required
                      autoFocus
                      className="text-center text-xl tracking-[0.4em] font-mono"
                    />
                  </div>
                  {error && <ErrorBanner>{error}</ErrorBanner>}
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? "Verifying…" : "Verify & continue →"}
                  </button>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      className="font-semibold text-[#0a0a0a] hover:underline"
                      onClick={() => void sendOtp(email, otpMethod)}
                      disabled={loading}
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      onClick={() => {
                        if (phoneInfo.hasPhone) {
                          setEntryStage("choose-method");
                        } else {
                          setEntryStage("email");
                        }
                        setOtpCode("");
                        setError(null);
                      }}
                    >
                      {phoneInfo.hasPhone ? "Change method" : "Use a different email"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-zinc-400">
            Free forever. Your data is only seen by reviewers.
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Main onboarding UI                                                   */
  /* ------------------------------------------------------------------ */
  const firstName = state.fullName.split(" ")[0];

  return (
    <main className="relative min-h-screen">
      {/* Top ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10">
        <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-10 pb-20">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a0a0a] text-white text-[10px] font-bold tracking-widest">
              K
            </span>
            <span className="text-xs font-semibold text-zinc-400 tracking-widest uppercase">
              Intern onboarding
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
            Hi {firstName}, let&apos;s finish your profile.
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
      </div>
    </main>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  );
}