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
  const [loading, setLoading] = useState(Boolean(emailFromUrl));
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("password");
  
  const hasInitializedStep = useRef(false);

  // Phone verification states
  const [phoneInfo, setPhoneInfo] = useState<{ hasPhone: boolean; maskedPhone: string | null }>({
    hasPhone: false,
    maskedPhone: null,
  });
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");

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

  const onSessionEstablished = useCallback(
    async (intern: OnboardingState) => {
      setState(intern);
      hasInitializedStep.current = false;
      const refreshed = await refreshStatus();
      if (refreshed) {
        setActiveStep(getSuggestedStep(refreshed));
        hasInitializedStep.current = true;
      }
    },
    [refreshStatus]
  );

  const sendOtp = useCallback(async (targetEmail: string, method: "email" | "sms") => {
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
      if (!res.ok) throw new Error(data.error ?? "Could not send verification code");
      
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
  }, []);

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
        if (!res.ok) throw new Error(data.error ?? "Could not find that account");

        setPhoneInfo({ hasPhone: data.hasPhone, maskedPhone: data.maskedPhone });

        if (data.hasPassword) {
          setEntryStage("password");
          setLoading(false);
        } else if (data.hasPhone) {
          setEntryStage("choose-method");
          setLoading(false);
        } else {
          // If no phone is attached, fallback entirely to email flow immediately
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
      // Chain a finally to clear initializing state
      checkEmail(emailFromUrl).finally(() => setIsInitializing(false));
      return;
    }
    
    refreshStatus()
      .then((intern) => {
        if (intern && !hasInitializedStep.current) {
          setActiveStep(getSuggestedStep(intern));
          hasInitializedStep.current = true;
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setLoading(false);
        setIsInitializing(false); // Add this line
      });
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
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim(), method: otpMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      await onSessionEstablished(data.session?.user ? data.intern || state : data.intern);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16">
        <div className="card w-full p-8">
          {entryStage === "email" && (
            <>
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
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {entryStage === "password" && (
            <>
              <h1 className="mb-2 text-2xl font-bold">Welcome back</h1>
              <p className="mb-6 text-slate-600">
                Enter your password for <strong>{email}</strong>.
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
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
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
              <h1 className="mb-2 text-2xl font-bold">Verification Method</h1>
              <p className="mb-6 text-slate-600">
                How would you like to receive your one-time verification code?
              </p>
              
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={() => sendOtp(email, "sms")}
                  disabled={loading}
                >
                  {loading && otpMethod === "sms" ? "Sending..." : `Send SMS Code to ${phoneInfo.maskedPhone}`}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => sendOtp(email, "email")}
                  disabled={loading}
                >
                  {loading && otpMethod === "email" ? "Sending..." : "Send Code via Email"}
                </button>
              </div>

              {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700"
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
              <h1 className="mb-2 text-2xl font-bold">Verify your identity</h1>
              <p className="mb-6 text-slate-600">
                {otpNotice ?? `We sent a verification code to ${email}.`} Enter it below to continue
                setting up your account.
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
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & continue"}
                </button>
                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    className="font-semibold text-indigo-600"
                    onClick={() => void sendOtp(email, otpMethod)}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    className="text-slate-500"
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
                isActive ? "step-nav-active" : isComplete ? "step-nav-complete" : ""
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
          <StepProfile profile={profile} onChange={async () => { await refreshStatus(); }} />
        )}
      </div>
    </main>
  );
}