"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-navo-navy dark:text-white">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-gray-500 dark:text-gray-400">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navo-deep focus:outline-none focus:ring-2 focus:ring-navo-blue focus:ring-offset-2 dark:focus:ring-offset-gray-950"
      >
        Try again
      </button>
    </div>
  );
}
