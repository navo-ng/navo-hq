import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
      {icon ? <div className="mb-3 flex justify-center">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
