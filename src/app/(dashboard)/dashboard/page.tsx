"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchTasks, fetchTaskStatuses } from "@/lib/data/tasks";
import { fetchProjects } from "@/lib/data/projects";
import { fetchActivities } from "@/lib/data/activities";
import { fetchWidgets, DashboardWidget } from "@/lib/data/dashboard-widgets";
import { Task, TaskStatusConfig } from "@/types/task";
import { Project } from "@/types/project";
import { ActivityWithUser } from "@/types/activity";
import { DashboardWidgetRenderer } from "@/components/dashboard/DashboardWidget";
import { StakeholderView } from "@/components/dashboard/StakeholderView";
import { WidgetCustomizer } from "@/components/dashboard/WidgetCustomizer";
import { ErrorState } from "@/components/ui/error-state";
import { fetchAllUsers } from "@/lib/data/users";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

function makeWidget(type: string, position: number): DashboardWidget {
  return {
    id: `default-${type}`,
    user_id: "",
    widget_type: type,
    position,
    is_visible: true,
    config: {},
  };
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusConfig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [stakeholderPreview, setStakeholderPreview] = useState(false);
  const { role } = useCurrentUser();
  const isViewer = role === "viewer";
  const showStakeholder = isViewer || stakeholderPreview;

  const supabase = createClient();

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
      const [taskData, statusData, projectData, activityData, memberData, widgetData] = await Promise.all([
        fetchTasks(supabase),
        fetchTaskStatuses(supabase),
        fetchProjects(supabase),
        fetchActivities(supabase, { limit: 10 }),
        fetchAllUsers(supabase),
        fetchWidgets(supabase),
      ]);
      setTasks(taskData);
      setStatuses(statusData);
      setProjects(projectData);
      setActivities(activityData);
      setMembers(memberData.map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url })));
      setWidgets(widgetData);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [supabase]);

  const widgetProps = { tasks, statuses, projects, activities, members, userId };

  if (isLoading) {
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">One team. One source of truth.</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); loadDashboard(); }} />
      </div>
    );
  }

  const useCustomLayout = widgets.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {showStakeholder ? "Overview" : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showStakeholder
              ? "Executive summary — status at a glance."
              : "One team. One source of truth."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isViewer && (
            <button
              onClick={() => setStakeholderPreview((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              title={stakeholderPreview ? "Back to operational dashboard" : "Preview the viewer (stakeholder) dashboard"}
            >
              {stakeholderPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {stakeholderPreview ? "Exit stakeholder view" : "View as Stakeholder"}
            </button>
          )}
          {!showStakeholder && (
            <button
              onClick={() => setCustomizerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Settings size={16} />
              Customize
            </button>
          )}
        </div>
      </div>

      {showStakeholder ? (
        <StakeholderView
          tasks={tasks}
          statuses={statuses}
          projects={projects}
          activities={activities}
          members={members}
        />
      ) : useCustomLayout ? (
        <div className="space-y-6">
          {widgets
            .filter((w) => w.is_visible)
            .sort((a, b) => a.position - b.position)
            .map((widget) => (
              <DashboardWidgetRenderer
                key={widget.id}
                widget={widget}
                {...widgetProps}
              />
            ))}
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardWidgetRenderer
            widget={makeWidget("stats", 0)}
            {...widgetProps}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardWidgetRenderer
              widget={makeWidget("my_tasks", 1)}
              {...widgetProps}
            />
            <DashboardWidgetRenderer
              widget={makeWidget("project_progress", 2)}
              {...widgetProps}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardWidgetRenderer
              widget={makeWidget("status_chart", 3)}
              {...widgetProps}
            />
            <DashboardWidgetRenderer
              widget={makeWidget("priority_chart", 4)}
              {...widgetProps}
            />
          </div>

          <DashboardWidgetRenderer
            widget={makeWidget("workload", 5)}
            {...widgetProps}
          />

          <DashboardWidgetRenderer
            widget={makeWidget("capacity", 6)}
            {...widgetProps}
          />

          <DashboardWidgetRenderer
            widget={makeWidget("recent_activity", 7)}
            {...widgetProps}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardWidgetRenderer
              widget={makeWidget("overdue", 8)}
              {...widgetProps}
            />
            <DashboardWidgetRenderer
              widget={makeWidget("due_today", 9)}
              {...widgetProps}
            />
          </div>
        </div>
      )}

      {!showStakeholder && (
        <WidgetCustomizer
          open={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          onSaved={loadDashboard}
        />
      )}
    </div>
  );
}
