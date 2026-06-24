"use client";

import { useCallback, useEffect, useState } from "react";
import type { OnboardingState } from "@/lib/types";

type EntryStage = "email" | "password" | "choose-method" | "otp" | "signup";

// Client-safe copy of the course_type enum (avoids importing the Drizzle
// schema, which would pull server-only code into the client bundle).
const COURSE_TYPES = [
  "B.Tech",
  "B.Sc",
  "B.Com",
  "BBA",
  "BA",
  "M.Tech",
  "M.Sc",
  "MBA",
  "MCA",
  "PhD",
  "Diploma",
  "Other",
] as const;

type Props = {
  initialEmail?: string;
  onAuthenticated: (intern: OnboardingState) => void;
};

export function AuthEntry({ initialEmail = "", onAuthenticated }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [entryStage, setEntryStage] = useState<EntryStage>("email");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [courseType, setCourseType] =
    useState<(typeof COURSE_TYPES)[number]>("B.Tech");
  const [fieldOfInterest, setFieldOfInterest] = useState("");
  const [goal, setGoal] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [phoneInfo, setPhoneInfo] = useState<{
    hasPhone: boolean;
    maskedPhone: string | null;
  }>({ hasPhone: false, maskedPhone: null });
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");

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
          throw new Error(data.error ?? "Could not check that email");

        // Unknown email → seamlessly continue into in-app signup.
        if (!data.exists) {
          setEntryStage("signup");
          setLoading(false);
          return;
        }

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

  // Auto-advance if an email was provided up front (e.g. ?email= in the URL).
  useEffect(() => {
    if (initialEmail) void checkEmail(initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      onAuthenticated(data.intern);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      onAuthenticated(data.intern);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleSignupSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          college: college.trim(),
          courseType,
          fieldOfInterest: fieldOfInterest.trim(),
          goal: goal.trim(),
          referralCode: referralCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Could not create your account";
        throw new Error(message);
      }
      onAuthenticated(data.intern);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function resetToEmail() {
    setEntryStage("email");
    setPassword("");
    setOtpCode("");
    setError(null);
  }

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
                Sign in to KFIQ
              </h1>
              <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                Enter your email to sign in or pick up where you left off.
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

              <p className="mt-6 text-center text-sm text-zinc-500">
                New to KFIQ?{" "}
                <button
                  type="button"
                  className="font-semibold text-[#0a0a0a] hover:underline"
                  onClick={() => {
                    setError(null);
                    setEntryStage("signup");
                  }}
                >
                  Create your account
                </button>
              </p>
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
                  onClick={resetToEmail}
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
                  onClick={resetToEmail}
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
                {otpNotice ?? `We sent a code to ${email}.`} It expires in 10
                minutes.
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

          {entryStage === "signup" && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
                Create your account
              </h1>
              <p className="mt-2 mb-7 text-sm text-zinc-500 leading-relaxed">
                Tell us a bit about yourself. You&apos;ll set a password and add
                your resume on the next step.
              </p>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="field">
                  <label htmlFor="signup-email">Email address</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    autoFocus={!email}
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-name">Full name</label>
                  <input
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aanya Sharma"
                    required
                    autoFocus={Boolean(email)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-college">College</label>
                  <input
                    id="signup-college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="IIT Bombay"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-course">Course</label>
                  <select
                    id="signup-course"
                    value={courseType}
                    onChange={(e) =>
                      setCourseType(
                        e.target.value as (typeof COURSE_TYPES)[number]
                      )
                    }
                  >
                    {COURSE_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="signup-field">Field of interest</label>
                  <input
                    id="signup-field"
                    value={fieldOfInterest}
                    onChange={(e) => setFieldOfInterest(e.target.value)}
                    placeholder="Web Development"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-goal">Your goal</label>
                  <textarea
                    id="signup-goal"
                    rows={2}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="What do you want to get out of this internship?"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-referral">
                    Referral code{" "}
                    <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <input
                    id="signup-referral"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="From a campus ambassador"
                  />
                </div>
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create account →"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={resetToEmail}
                >
                  Already have an account? Sign in
                </button>
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

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  );
}
