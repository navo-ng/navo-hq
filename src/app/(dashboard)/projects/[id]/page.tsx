"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit3,
  Archive,
  Trash2,
  Plus,
  LayoutGrid,
  GanttChart as GanttChartIcon,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectMembers } from "@/components/projects/ProjectMembers";
import { ProjectTasks } from "@/components/projects/ProjectTasks";
import { GanttChart } from "@/components/projects/GanttChart";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import {
  Project,
  ProjectUser,
  ProjectStatusConfig,
} from "@/types/project";
import { TaskStatusConfig, TaskPriorityConfig, TaskTag, Task } from "@/types/task";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProjectById,
  fetchProjectStatuses,
  fetchAllUsers,
  fetchAllTags,
  updateProject,
  archiveProject,
  addProjectMember,
  removeProjectMember,
  fetchProjectTasks,
} from "@/lib/data/projects";
import { fetchTaskStatuses, fetchTaskPriorities, createTask } from "@/lib/data/tasks";
import { printProjectReport } from "@/lib/utils/pdf-export";
import { ProjectMembersDialog } from "@/components/projects/ProjectMembersDialog";
import { getUserProjectRole, ProjectRole } from "@/lib/data/project-permissions";

type TabId = "overview" | "tasks";

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<
    {
      id: string;
      title: string;
      status_id: string;
      priority_id: string;
      owner_id: string | null;
      start_date: string | null;
      due_date: string | null;
      completed_at: string | null;
      status: { id: string; name: string; color: string } | null;
      priority: { id: string; name: string; color: string } | null;
      owner: { id: string; name: string; avatar_url: string | null } | null;
    }[]
  >([]);
  const [allUsers, setAllUsers] = useState<ProjectUser[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatusConfig[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusConfig[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriorityConfig[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<"table" | "gantt">("table");
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [projectData, statusData, userData, tagData, taskStatusData, taskPriorityData] =
        await Promise.all([
          fetchProjectById(supabase, projectId),
          fetchProjectStatuses(supabase),
          fetchAllUsers(supabase),
          fetchAllTags(supabase),
          fetchTaskStatuses(supabase),
          fetchTaskPriorities(supabase),
        ]);
      if (!cancelled) {
        setProject(projectData);
        setStatuses(statusData);
        setAllUsers(userData);
        setTags(tagData);
        setTaskStatuses(taskStatusData);
        setTaskPriorities(taskPriorityData);

        if (projectData) {
          const tasks = await fetchProjectTasks(supabase, projectId);
          if (!cancelled) setProjectTasks(tasks);

          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const role = await getUserProjectRole(supabase, projectId, userData.user.id);
            if (!cancelled) setCurrentUserRole(role);
          }
        }

        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, projectId]);

  const handleSaveProject = async (input: {
    name: string;
    description: string;
    owner_id: string;
    status_id: string;
    start_date: string;
    target_date: string;
  }) => {
    const updated = await updateProject(supabase, projectId, input);
    if (updated) setProject(updated);
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this project?")) return;
    await archiveProject(supabase, projectId);
    router.push("/projects");
  };

  const handleAddMember = async (userId: string) => {
    await addProjectMember(supabase, projectId, userId);
    const updated = await fetchProjectById(supabase, projectId);
    if (updated) setProject(updated);
  };

  const handleRemoveMember = async (userId: string) => {
    await removeProjectMember(supabase, projectId, userId);
    const updated = await fetchProjectById(supabase, projectId);
    if (updated) setProject(updated);
  };

  const handleCreateTask = async (input: {
    title: string;
    description: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    priority_id: string;
    due_date: string;
    tag_ids: string[];
  }) => {
    const task = await createTask(supabase, {
      ...input,
      project_id: projectId,
    });
    if (task) {
      const updatedTasks = await fetchProjectTasks(supabase, projectId);
      setProjectTasks(updatedTasks);
      const updatedProject = await fetchProjectById(supabase, projectId);
      if (updatedProject) setProject(updatedProject);
    }
  };

  const handleMembersChanged = async () => {
    const updated = await fetchProjectById(supabase, projectId);
    if (updated) setProject(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-gray-500 dark:text-gray-400">
          Project not found.
        </p>
        <Link
          href="/projects"
          className="text-sm font-medium text-navo-blue hover:underline"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const stats = project.task_stats || { total: 0, done: 0, in_progress: 0, blocked: 0, overdue: 0 };
  const progressPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const memberCount = project.members?.length || 0;
  const isOverdue =
    project.target_date &&
    new Date(project.target_date) < new Date() &&
    project.status?.name !== "Completed";

  const isOwnerOrAdmin = currentUserRole === "admin" || currentUserRole === null;
  const isEditorOrAbove = currentUserRole === "editor" || currentUserRole === "admin" || currentUserRole === null;

  const overviewStats = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: CheckCircle,
      color: "text-gray-900 dark:text-white",
    },
    {
      label: "Completed",
      value: stats.done,
      icon: CheckCircle,
      color: "text-navo-green",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      label: "Team Members",
      value: memberCount,
      icon: Users,
      color: "text-navo-blue",
    },
  ];

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} />
        Projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {project.status && (
              <Badge color={project.status.color}>{project.status.name}</Badge>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            {project.owner && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: "#0064F0" }}
                >
                  {project.owner.name.charAt(0).toUpperCase()}
                </span>
                Owned by {project.owner.name}
              </span>
            )}
            {project.target_date && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue ? "font-medium text-red-500" : ""
                }`}
              >
                <Calendar size={12} />
                Target:{" "}
                {new Date(project.target_date).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => printProjectReport(project, projectTasks as Task[])}
          >
            <Printer size={16} />
            Export
          </Button>
          {isEditorOrAbove && (
            <Button
              variant="secondary"
              onClick={() => setCreateTaskDialogOpen(true)}
            >
              <Plus size={16} />
              Add Task
            </Button>
          )}
          {isOwnerOrAdmin && (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowActions(!showActions)}
              >
                <MoreHorizontal size={16} />
              </Button>
              {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActions(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <button
                      onClick={() => {
                        setEditDialogOpen(true);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleArchive();
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        setDeleteDialogOpen(true);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-navo-blue text-navo-blue"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {overviewStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {stats.total > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Overall Progress
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {progressPct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-navo-green transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {stats.done} of {stats.total} tasks completed
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProjectMembers
              members={project.members || []}
              allUsers={allUsers}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              canManage={currentUserRole === "admin" || currentUserRole === null}
              onManageClick={() => setMembersDialogOpen(true)}
            />

            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
              {projectTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tasks yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {projectTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          {task.priority && (
                            <Badge color={task.priority.color}>
                              {task.priority.name}
                            </Badge>
                          )}
                          {task.status && (
                            <Badge color={task.status.color}>
                              {task.status.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-800">
              <button
                onClick={() => setTaskViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  taskViewMode === "table"
                    ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <LayoutGrid size={14} />
                Table
              </button>
              <button
                onClick={() => setTaskViewMode("gantt")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  taskViewMode === "gantt"
                    ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <GanttChartIcon size={14} />
                Gantt
              </button>
            </div>
            {taskViewMode === "table" && isEditorOrAbove && (
              <button
                onClick={() => setCreateTaskDialogOpen(true)}
                className="text-xs font-medium text-navo-blue hover:underline"
              >
                + Add task
              </button>
            )}
          </div>

          {taskViewMode === "table" ? (
            <ProjectTasks
              tasks={projectTasks}
              onAddTask={() => setCreateTaskDialogOpen(true)}
            />
          ) : (
            <GanttChart
              tasks={projectTasks.map((t) => ({
                id: t.id,
                title: t.title,
                start_date: t.start_date,
                due_date: t.due_date,
                status: t.status?.name || "Unknown",
                status_color: t.status?.color || "#9CA3AF",
                owner: t.owner?.name,
              }))}
            />
          )}
        </div>
      )}

      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        project={project}
        onSave={handleSaveProject}
        users={allUsers}
        statuses={statuses}
      />

      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        onCreate={handleCreateTask}
        users={allUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url }))}
        projects={[{ id: project.id, name: project.name }]}
        tags={tags}
        statuses={taskStatuses}
        priorities={taskPriorities}
      />

      <DeleteProjectDialog
        project={project}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={() => router.push("/projects")}
      />

      <ProjectMembersDialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        projectId={projectId}
        members={project.members || []}
        allUsers={allUsers}
        supabase={supabase}
        onMembersChanged={handleMembersChanged}
      />
    </div>
  );
}
