"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface OnboardingContextValue {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  step: number;
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STEPS = [
  {
    title: "Welcome to NAVO HQ",
    description: "Your team's command center. Let's take a quick tour.",
    target: "dashboard",
  },
  {
    title: "Dashboard",
    description: "See your tasks, upcoming deadlines, and recent activity at a glance.",
    target: "dashboard",
  },
  {
    title: "Tasks",
    description: "Create and manage tasks. Drag to reorder, click to edit, assign to team members.",
    target: "tasks",
  },
  {
    title: "Projects",
    description: "Organize work into projects. Add team members and track progress.",
    target: "projects",
  },
  {
    title: "Decisions",
    description: "Track team decisions. Start polls to vote on important topics.",
    target: "decisions",
  },
  {
    title: "Calendar",
    description: "View events and deadlines. Export to your calendar app.",
    target: "calendar",
  },
  {
    title: "You're all set!",
    description: "Start by creating your first task or project. Press ? anytime for keyboard shortcuts.",
    target: "dashboard",
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", userData.user.id)
        .eq("key", "onboarding_completed")
        .single();

      if (!data) {
        setShowOnboarding(true);
      }
    }
    check();
  }, [supabase]);

  const completeOnboarding = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("user_settings").upsert({
        user_id: userData.user.id,
        key: "onboarding_completed",
        value: { completed: true },
      });
    }
    setShowOnboarding(false);
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else completeOnboarding();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <OnboardingContext.Provider value={{ showOnboarding, completeOnboarding, step, nextStep, prevStep }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}