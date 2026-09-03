"use client";

import { Task, TaskStatusConfig } from "@/types/task";
import { Project } from "@/types/project";
import { ActivityWithUser } from "@/types/activity";
import { DashboardWidget } from "@/lib/data/dashboard-widgets";
import StatCards from "@/components/dashboard/StatCards";
import MyTasks from "@/components/dashboard/MyTasks";
import ProjectProgressList from "@/components/dashboard/ProjectProgressList";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import TaskPriorityChart from "@/components/dashboard/TaskPriorityChart";
import { WorkloadView } from "@/components/dashboard/WorkloadView";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import OverdueTasks from "@/components/dashboard/OverdueTasks";
import DueToday from "@/components/dashboard/DueToday";

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  tasks: Task[];
  statuses: TaskStatusConfig[];
  projects: Project[];
  activities: ActivityWithUser[];
  members: { id: string; name: string; avatar_url: string | null }[];
  userId?: string;
}

export function DashboardWidgetRenderer({
  widget,
  tasks,
  statuses,
  projects,
  activities,
  members,
  userId,
}: DashboardWidgetRendererProps) {
  if (!widget.is_visible) return null;

  switch (widget.widget_type) {
    case "stats":
      return <StatCards tasks={tasks} statuses={statuses} projects={projects} />;
    case "my_tasks":
      return <MyTasks tasks={tasks} statuses={statuses} userId={userId} />;
    case "project_progress":
      return <ProjectProgressList projects={projects} />;
    case "status_chart":
      return <TaskStatusChart tasks={tasks} />;
    case "priority_chart":
      return <TaskPriorityChart tasks={tasks} />;
    case "workload":
      return <WorkloadView tasks={tasks} members={members} statuses={statuses} />;
    case "recent_activity":
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <ActivityFeed activities={activities} />
        </div>
      );
    case "overdue":
      return <OverdueTasks tasks={tasks} statuses={statuses} />;
    case "due_today":
      return <DueToday tasks={tasks} statuses={statuses} />;
    default:
      return null;
  }
}
