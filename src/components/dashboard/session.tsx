"use client";

import { createContext, useContext } from "react";
import type { OnboardingState } from "@/lib/types";

const DashboardSessionContext = createContext<OnboardingState | null>(null);

export function DashboardSessionProvider({
  value,
  children,
}: {
  value: OnboardingState;
  children: React.ReactNode;
}) {
  return (
    <DashboardSessionContext.Provider value={value}>
      {children}
    </DashboardSessionContext.Provider>
  );
}

export function useDashboardSession(): OnboardingState {
  const value = useContext(DashboardSessionContext);
  if (!value) {
    throw new Error(
      "useDashboardSession must be used within a DashboardSessionProvider"
    );
  }
  return value;
}
