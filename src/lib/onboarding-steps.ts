import type { OnboardingState } from "@/lib/types";

export const ONBOARDING_STEPS = [
  { id: "password", label: "Password" },
  { id: "resume", label: "Resume" },
  { id: "parsing", label: "Parse" },
  { id: "profile", label: "Profile" },
] as const;

export type StepId = (typeof ONBOARDING_STEPS)[number]["id"];

export function getSuggestedStep(state: OnboardingState): StepId {
  if (!state.hasPassword) return "password";
  if (state.resumeParseStatus === "not_uploaded") return "resume";
  if (
    state.resumeParseStatus === "pending" ||
    state.resumeParseStatus === "processing" ||
    state.resumeParseStatus === "failed"
  ) {
    return "parsing";
  }
  return "profile";
}

export function getMaxUnlockedStepIndex(state: OnboardingState): number {
  if (!state.hasPassword) return 0;

  let max = 1;

  if (state.resumeUrl && state.resumeParseStatus !== "not_uploaded") {
    max = 2;
  }

  if (state.resumeParseStatus === "done") {
    max = 3;
  }

  return max;
}

export function canNavigateToStep(
  state: OnboardingState,
  stepId: StepId
): boolean {
  const index = ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 && index <= getMaxUnlockedStepIndex(state);
}
