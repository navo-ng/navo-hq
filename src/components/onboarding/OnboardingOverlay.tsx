"use client";
import { useOnboarding } from "./OnboardingProvider";

const STEPS = [
  { title: "Welcome to NAVO HQ", description: "Your team's command center. Let's take a quick tour." },
  { title: "Dashboard", description: "See your tasks, upcoming deadlines, and recent activity at a glance." },
  { title: "Tasks", description: "Create and manage tasks. Drag to reorder, click to edit, assign to team members." },
  { title: "Projects", description: "Organize work into projects. Add team members and track progress." },
  { title: "Decisions", description: "Track team decisions. Start polls to vote on important topics." },
  { title: "Calendar", description: "View events and deadlines. Export to your calendar app." },
  { title: "You're all set!", description: "Start by creating your first task or project. Press ? for keyboard shortcuts." },
];

export function OnboardingOverlay() {
  const ctx = useOnboarding();
  if (!ctx?.showOnboarding) return null;

  const current = STEPS[ctx.step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 text-xs font-medium text-navo-blue">
          Step {ctx.step + 1} of {STEPS.length}
        </div>
        <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
          {current.title}
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {current.description}
        </p>
        
        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-navo-blue transition-all"
            style={{ width: `${((ctx.step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={ctx.prevStep}
            disabled={ctx.step === 0}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={ctx.completeOnboarding}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Skip
            </button>
            <button
              onClick={ctx.nextStep}
              className="rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep"
            >
              {ctx.step === STEPS.length - 1 ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}