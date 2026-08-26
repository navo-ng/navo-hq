import {
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const stats = [
  {
    label: "Open Tasks",
    value: "0",
    icon: CheckSquare,
    color: "text-navo-blue",
    bg: "bg-navo-light",
  },
  {
    label: "Active Projects",
    value: "0",
    icon: FolderKanban,
    color: "text-navo-deep",
    bg: "bg-blue-50",
  },
  {
    label: "Overdue Tasks",
    value: "0",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    label: "Completed This Week",
    value: "0",
    icon: CheckCircle,
    color: "text-navo-green",
    bg: "bg-navo-green-light",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          One team. One source of truth.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            My Tasks
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tasks assigned yet. Create your first task to get started.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Team Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No activity yet. Start building to see updates here.
          </p>
        </div>
      </div>
    </div>
  );
}
