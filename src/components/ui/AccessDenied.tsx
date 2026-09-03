"use client";

import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  message?: string;
  requiredRole?: string;
  backUrl?: string;
}

export function AccessDenied({
  message,
  requiredRole,
  backUrl = "/",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <Lock size={28} className="text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Access Denied
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {message ||
          (requiredRole
            ? `You need ${requiredRole} access to view this page.`
            : "You don't have permission to access this page.")}
      </p>
      <Link
        href={backUrl}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <ArrowLeft size={14} />
        Go Back
      </Link>
    </div>
  );
}
