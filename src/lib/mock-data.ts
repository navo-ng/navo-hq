import { Task, TaskUser, TaskProject, TaskTag } from "@/types/task";

const MOCK_USERS: TaskUser[] = [
  { id: "user-1", name: "Ayomide", email: "ayomide@navo.ng", avatar_url: null },
  { id: "user-2", name: "Daniel", email: "daniel@navo.ng", avatar_url: null },
  { id: "user-3", name: "Widom", email: "widom@navo.ng", avatar_url: null },
  { id: "user-4", name: "Samuel", email: "samuel@navo.ng", avatar_url: null },
  { id: "user-5", name: "Pelumi", email: "pelumi@navo.ng", avatar_url: null },
];

const MOCK_PROJECTS: TaskProject[] = [
  { id: "proj-1", name: "NAVO App" },
  { id: "proj-2", name: "NAVO Brand Kit" },
  { id: "proj-3", name: "Social Media Launch" },
];

const MOCK_TAGS: TaskTag[] = [
  { id: "tag-1", name: "Product", color: "#0064F0" },
  { id: "tag-2", name: "Design", color: "#8B5CF6" },
  { id: "tag-3", name: "Engineering", color: "#10B981" },
  { id: "tag-4", name: "Marketing", color: "#F59E0B" },
  { id: "tag-5", name: "Brand", color: "#EC4899" },
];

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Finalize NAVO logo vector files",
    description:
      "The current logo direction needs to be refined into production-ready vector format. Export SVG files with proper clear space and minimum size specifications.",
    creator_id: "user-1",
    owner_id: "user-2",
    project_id: "proj-2",
    status_id: "in_progress",
    priority_id: "high",
    start_date: daysAgo(3),
    due_date: daysFromNow(2),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
    owner: MOCK_USERS[1],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[1],
    tags: [MOCK_TAGS[1], MOCK_TAGS[4]],
  },
  {
    id: "task-2",
    title: "Set up Supabase database schema",
    description:
      "Apply the approved database migration plan. Create all 26 tables, RLS policies, triggers, and seed data.",
    creator_id: "user-1",
    owner_id: "user-1",
    project_id: "proj-1",
    status_id: "todo",
    priority_id: "urgent",
    start_date: null,
    due_date: daysFromNow(1),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    owner: MOCK_USERS[0],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[0],
    tags: [MOCK_TAGS[2]],
  },
  {
    id: "task-3",
    title: "Create Instagram content calendar",
    description:
      "Plan the first 30 days of Instagram content. Include customer, driver, and brand content pillars.",
    creator_id: "user-1",
    owner_id: "user-3",
    project_id: "proj-3",
    status_id: "todo",
    priority_id: "medium",
    start_date: null,
    due_date: daysFromNow(5),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    owner: MOCK_USERS[2],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[2],
    tags: [MOCK_TAGS[3]],
  },
  {
    id: "task-4",
    title: "Design social media post templates",
    description:
      "Create reusable templates for Instagram carousels, Reels covers, and Facebook posts following the NAVO brand system.",
    creator_id: "user-3",
    owner_id: "user-2",
    project_id: "proj-3",
    status_id: "backlog",
    priority_id: "medium",
    start_date: null,
    due_date: daysFromNow(10),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    owner: MOCK_USERS[1],
    creator: MOCK_USERS[2],
    project: MOCK_PROJECTS[2],
    tags: [MOCK_TAGS[1], MOCK_TAGS[3]],
  },
  {
    id: "task-5",
    title: "Implement task management UI",
    description:
      "Build the /tasks page with filters, create dialog, task detail drawer, and responsive design.",
    creator_id: "user-1",
    owner_id: "user-1",
    project_id: "proj-1",
    status_id: "in_progress",
    priority_id: "high",
    start_date: daysAgo(1),
    due_date: daysFromNow(3),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(3),
    updated_at: daysAgo(0),
    owner: MOCK_USERS[0],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[0],
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
  },
  {
    id: "task-6",
    title: "Write brand voice guidelines",
    description:
      "Document the NAVO brand voice, tone, words to use, words to avoid, and examples for customer and driver communication.",
    creator_id: "user-1",
    owner_id: "user-4",
    project_id: "proj-2",
    status_id: "review",
    priority_id: "medium",
    start_date: daysAgo(5),
    due_date: daysAgo(1),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(7),
    updated_at: daysAgo(2),
    owner: MOCK_USERS[3],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[1],
    tags: [MOCK_TAGS[4]],
  },
  {
    id: "task-7",
    title: "Research driver onboarding flow",
    description:
      "Study how other Nigerian transport platforms handle driver onboarding. Identify best practices for KYC and verification.",
    creator_id: "user-1",
    owner_id: "user-5",
    project_id: "proj-1",
    status_id: "done",
    priority_id: "low",
    start_date: daysAgo(14),
    due_date: daysAgo(5),
    completed_at: daysAgo(5),
    is_archived: false,
    created_at: daysAgo(20),
    updated_at: daysAgo(5),
    owner: MOCK_USERS[4],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[0],
    tags: [MOCK_TAGS[0]],
  },
  {
    id: "task-8",
    title: "Blocked: Payment integration testing",
    description:
      "Cannot proceed until Paystack test account credentials are provided. Waiting for team setup.",
    creator_id: "user-2",
    owner_id: "user-4",
    project_id: "proj-1",
    status_id: "blocked",
    priority_id: "high",
    start_date: daysAgo(3),
    due_date: daysFromNow(4),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(5),
    updated_at: daysAgo(2),
    owner: MOCK_USERS[3],
    creator: MOCK_USERS[1],
    project: MOCK_PROJECTS[0],
    tags: [MOCK_TAGS[2]],
  },
  {
    id: "task-9",
    title: "Prepare launch announcement copy",
    description:
      "Write the official NAVO launch announcement for social media, email, and press.",
    creator_id: "user-3",
    owner_id: "user-3",
    project_id: "proj-3",
    status_id: "backlog",
    priority_id: "low",
    start_date: null,
    due_date: daysFromNow(14),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    owner: MOCK_USERS[2],
    creator: MOCK_USERS[3],
    project: MOCK_PROJECTS[2],
    tags: [MOCK_TAGS[3], MOCK_TAGS[4]],
  },
  {
    id: "task-10",
    title: "Overdue: Update color system documentation",
    description:
      "The color palette documentation needs to be updated with the final approved values and accessibility notes.",
    creator_id: "user-1",
    owner_id: "user-2",
    project_id: "proj-2",
    status_id: "todo",
    priority_id: "medium",
    start_date: null,
    due_date: daysAgo(3),
    completed_at: null,
    is_archived: false,
    created_at: daysAgo(10),
    updated_at: daysAgo(3),
    owner: MOCK_USERS[1],
    creator: MOCK_USERS[0],
    project: MOCK_PROJECTS[1],
    tags: [MOCK_TAGS[1], MOCK_TAGS[4]],
  },
];

export function getMockTasks(): Task[] {
  return MOCK_TASKS;
}

export function getMockUsers(): TaskUser[] {
  return MOCK_USERS;
}

export function getMockProjects(): TaskProject[] {
  return MOCK_PROJECTS;
}

export function getMockTags(): TaskTag[] {
  return MOCK_TAGS;
}
