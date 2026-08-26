"use client";

import { Users } from "lucide-react";

export function TeamEmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navo-light dark:bg-navo-blue/10">
        <Users size={24} className="text-navo-blue" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        No team members yet
      </h3>
      <p className="mb-6 mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Your team members will appear here once they sign up and are added to
        your organization.
      </p>
    </div>
  );
}
