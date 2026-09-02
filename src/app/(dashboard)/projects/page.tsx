"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectStats } from "@/components/projects/ProjectStats";
import { ProjectEmptyState } from "@/components/projects/ProjectEmptyState";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { Project, ProjectUser, ProjectStatusConfig } from "@/types/project";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProjects,
  fetchProjectStatuses,
  fetchAllUsers,
  fetchAllTags,
  createProject,
} from "@/lib/data/projects";
import { useRealtimeEntity } from "@/lib/hooks/useRealtimeEntity";
import { ErrorState } from "@/components/ui/error-state";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatusConfig[]>([]);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const supabase = createClient();

  const refetchProjects = useCallback(async () => {
    try {
      const data = await fetchProjects(supabase, { sort: "newest" });
      setProjects(data);
      setError(null);
    } catch {
      setError("Failed to load projects. Please try again.");
    }
  }, [supabase]);

  useRealtimeEntity("projects", null, () => refetchProjects(), () => refetchProjects(), () => refetchProjects());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [projectData, statusData, userData, tagData] = await Promise.all([
          fetchProjects(supabase, { sort: "newest" }),
          fetchProjectStatuses(supabase),
          fetchAllUsers(supabase),
          fetchAllTags(supabase),
        ]);
        if (!cancelled) {
          setProjects(projectData);
          setStatuses(statusData);
          setUsers(userData);
          setTags(tagData);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load projects. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status_id === statusFilter);
    }

    if (ownerFilter !== "all") {
      result = result.filter((p) => p.owner_id === ownerFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.owner?.name.toLowerCase().includes(q)
      );
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "most_tasks") {
      result.sort(
        (a, b) => (b.task_stats?.total || 0) - (a.task_stats?.total || 0)
      );
    } else if (sort === "deadline") {
      result.sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return (
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        );
      });
    }

    return result;
  }, [projects, statusFilter, ownerFilter, searchQuery, sort]);

  const stats = useMemo(() => {
    const countByStatus = (name: string) =>
      projects.filter(
        (p) => p.status?.name?.toLowerCase() === name.toLowerCase()
      ).length;

    return {
      total: projects.length,
      active: countByStatus("Active"),
      planning: countByStatus("Planning"),
      onHold: countByStatus("On Hold"),
      completed: countByStatus("Completed"),
    };
  }, [projects]);

  const owners = useMemo(() => {
    const seen = new Set<string>();
    const result: ProjectUser[] = [];
    for (const p of projects) {
      if (p.owner && !seen.has(p.owner.id)) {
        seen.add(p.owner.id);
        result.push(p.owner);
      }
    }
    return result;
  }, [projects]);

  const handleProjectDeleted = async () => {
    const projectData = await fetchProjects(supabase, { sort: "newest" });
    setProjects(projectData);
  };

  const handleCreateProject = async (input: {
    name: string;
    description: string;
    owner_id: string;
    status_id: string;
    start_date: string;
    target_date: string;
    member_ids: string[];
    tag_ids: string[];
  }) => {
    const project = await createProject(supabase, input);
    if (project) {
      setProjects((prev) => [project, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track major initiatives and workstreams
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track major initiatives and workstreams</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); refetchProjects().finally(() => setIsLoading(false)); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track major initiatives and workstreams
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <ProjectEmptyState onCreateClick={() => setCreateDialogOpen(true)} />
      ) : (
        <>
          <ProjectStats
            total={stats.total}
            active={stats.active}
            planning={stats.planning}
            onHold={stats.onHold}
            completed={stats.completed}
          />

          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            ownerFilter={ownerFilter}
            onOwnerFilterChange={setOwnerFilter}
            sort={sort}
            onSortChange={setSort}
            statuses={statuses}
            owners={owners}
          />

          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || ownerFilter !== "all"
                  ? "No projects match your filters."
                  : "No projects yet. Create your first project to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={(p) => {
                    setProjectToDelete({ id: p.id, name: p.name });
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateProject}
        users={users}
        statuses={statuses}
        tags={tags}
      />

      {projectToDelete && (
        <DeleteProjectDialog
          project={projectToDelete}
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
          }}
          onDeleted={handleProjectDeleted}
        />
      )}
    </div>
  );
}
