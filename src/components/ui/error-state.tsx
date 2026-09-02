"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <AlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-4">
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}
