# NAVO HQ — Project Handover

## What Is This?

NAVO HQ is an internal team management web app for the NAVO startup team (5 people: Ayomide, Daniel, Widom, Samuel, Pelumi). It handles tasks, projects, decisions, documents, calendar, team management, notifications, and activity tracking.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3.2 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| State | Zustand (available but minimal use) |
| Theme | next-themes (dark/light mode) |
| Icons | lucide-react |
| Deployment | Vercel (auto-deploys on push to main) |
| Git remote | `git@github.com-navo:navo-ng/navo-hq.git` |

---

## Project Structure

```
navo-hq/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx          # Login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # Dashboard layout (sidebar + header + search + notifications)
│   │   │   ├── dashboard/page.tsx         # Dashboard with charts, stats, task list
│   │   │   ├── tasks/page.tsx             # Task management
│   │   │   ├── projects/page.tsx          # Projects list
│   │   │   ├── projects/[id]/page.tsx     # Project detail
│   │   │   ├── decisions/page.tsx         # Decision log
│   │   │   ├── documents/page.tsx         # Document hub
│   │   │   ├── calendar/page.tsx          # Calendar (grid + list view)
│   │   │   ├── team/page.tsx              # Team directory
│   │   │   ├── activity/page.tsx          # Activity feed
│   │   │   ├── settings/page.tsx          # Settings
│   │   │   └── settings/tags/page.tsx     # Tag management
│   │   ├── auth/callback/route.ts         # OAuth callback
│   │   ├── not-found.tsx                  # 404 page
│   │   ├── error.tsx                      # Error boundary
│   │   ├── global-error.tsx               # Root error boundary
│   │   ├── layout.tsx                     # Root layout
│   │   └── globals.css                    # NAVO brand colors + theme tokens
│   ├── components/
│   │   ├── layout/                        # Sidebar, Header, ThemeProvider
│   │   ├── ui/                            # Button, Input, Select, Badge, Dialog, Drawer, Toast
│   │   ├── tasks/                         # TaskCard, TaskFilters, CreateTaskDialog, TaskDetailDrawer, DeleteTaskDialog, TaskDependencySection, TaskSearchSelect
│   │   ├── projects/                      # ProjectCard, ProjectFilters, CreateProjectDialog, EditProjectDialog, DeleteProjectDialog, ProjectMembers, ProjectTasks, ProjectEmptyState
│   │   ├── decisions/                     # DecisionCard, DecisionFilters, CreateDecisionDialog, EditDecisionDialog, DeleteDecisionDialog
│   │   ├── documents/                     # DocumentCard, DocumentFilters, CreateDocumentDialog, EditDocumentDialog, DeleteDocumentDialog
│   │   ├── calendar/                      # CalendarEventCard, CreateEventDialog
│   │   ├── team/                          # TeamMemberCard, TeamEmptyState
│   │   ├── comments/                      # CommentThread
│   │   ├── dashboard/                     # TaskStatusChart, TaskPriorityChart, ProjectProgressList
│   │   ├── notifications/                 # NotificationBell, NotificationToast
│   │   └── search/                        # SearchPalette, SearchResults
│   ├── lib/
│   │   ├── supabase/client.ts             # Browser Supabase client
│   │   ├── supabase/server.ts             # Server Supabase client
│   │   ├── supabase/middleware.ts         # Auth middleware helper
│   │   ├── data/                          # Data access layer (tasks, projects, decisions, documents, calendar, team, settings, notifications, comments, dependencies, tags, activities, log-activity, create-notification)
│   │   ├── hooks/                         # useCurrentUser, useRealtimeNotifications, useToast
│   │   └── utils/                         # relative-time helper
│   ├── types/                             # TypeScript types for all entities
│   └── middleware.ts                      # Next.js auth middleware
├── supabase/
│   ├── migrations/                        # 28 SQL migration files (00001-00028)
│   └── MIGRATION_PLAN.md                  # Full database architecture spec
└── .env.local                             # Supabase credentials (gitignored)
```

---

## Database

**Supabase project:** `puovsawpnqfczwsgvmkq`
**URL:** `https://puovsawpnqfczwsgvmkq.supabase.co`

### Tables (26)

| Table | Purpose |
|-------|---------|
| profiles | User profiles (id, email, name, avatar_url, role_id) |
| roles | User roles (owner, admin, member, viewer) |
| tasks | Task management with status, priority, owner, creator, project |
| task_statuses | Task status options (Not Started, In Progress, Review, Done) |
| task_priorities | Task priority levels (Low, Medium, High, Critical) |
| projects | Project management with status, owner |
| project_statuses | Project status options |
| decisions | Decision log with status, owner, project |
| decision_statuses | Decision status options |
| documents | Document hub with version, category, status |
| document_statuses | Document status options |
| calendar_events | Calendar events with date, time, type |
| activities | Activity feed (entity_type, entity_id, action, metadata, user_id) |
| notifications | User notifications (type, title, message, entity refs, is_read) |
| comments | Polymorphic comments (entity_type + entity_id) |
| task_dependencies | Task blocking relationships (blocked_task_id, blocking_task_id) |
| tags | Tags with name, color, category |
| entity_tags | Many-to-many: tags ↔ entities |
| project_members | Many-to-many: users ↔ projects |
| team_settings | Team-wide settings (key-value) |
| user_settings | Per-user settings (key-value) |

### Key Constraints

- FK names on tasks: `tasks_creator_id_fkey`, `tasks_owner_id_fkey`, `tasks_status_id_fkey`, `tasks_priority_id_fkey`, `fk_tasks_project`
- `handle_new_user()` trigger: SECURITY DEFINER, creates profile on signup, ON CONFLICT DO NOTHING
- `assign_first_user_owner()` trigger: Only assigns owner to FIRST profile
- RLS enabled on all tables with policies for authenticated users

---

## Test Users

| Email | Password | Role |
|-------|----------|------|
| ayomide@navo.ng | NAVOteam2025! | Owner |
| daniel@navo.ng | NAVOteam2025! | Member |
| widom@navo.ng | NAVOteam2025! | Member |
| samuel@navo.ng | NAVOteam2025! | Member |
| pelumi@navo.ng | NAVOteam2025! | Member |

**Note:** Seed migration `00028_seed_team_members.sql` must be run in Supabase SQL Editor to create Daniel, Samuel, and Pelumi accounts.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://puovsawpnqfczwsgvmkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:Rubberduck54321$@db.puovsawpnqfczwsgvmkq.supabase.co:5432/postgres
```

Both are set on Vercel. `.env.local` is gitignored.

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#0064F0` | Buttons, links, active states |
| Deep Blue | `#003CB4` | Hover states |
| Green Accent | `#32C56A` | Success, completed states |
| Dark Navy | `#0B2B63` | Sidebar, dark elements |
| Light | `#EAF2FF` | Light backgrounds |
| Green Light | `#EAF9F0` | Green backgrounds |

Tailwind theme tokens: `navo-blue`, `navo-deep`, `navo-green`, `navo-navy`, `navo-light`, `navo-green-light` (defined in `globals.css` via `@theme inline`).

---

## Features Built

### Auth
- Email/password login
- Google OAuth
- Auth middleware (protects all routes except /login and /auth/callback)
- Profile auto-created on signup via database trigger

### Dashboard
- Stat cards (total tasks, active projects, completed, overdue)
- Task status bar chart (pure CSS/Tailwind)
- Task priority bar chart
- Project progress list with progress bars
- "My Tasks" quick list
- Overdue tasks alert
- Due today tasks

### Tasks
- Full CRUD with Supabase
- Filters: status, priority, search
- Task detail drawer with metadata
- Comments system (threaded, optimistic UI)
- Task dependencies (blocked-by/blocking)
- Status change buttons
- Delete with confirmation dialog

### Projects
- Full CRUD with Supabase
- Filters: status, search
- Project detail page with tabs (Overview, Tasks, Members, Tags)
- Task count and progress tracking
- Delete with confirmation dialog

### Decisions
- Full CRUD with Supabase
- Filters: status, search
- Edit/delete with kebab menu on cards
- Contributors and tags support

### Documents
- Full CRUD with Supabase
- Filters: category, status, search
- Edit/delete with kebab menu on cards
- Version tracking

### Calendar
- Monthly grid view
- List view (auto-activates on mobile)
- Grid/list toggle buttons
- Event creation with date/time
- Event type badges

### Team
- Member directory with role filters
- Member stats

### Activity
- Full activity timeline
- Entity type filter
- User info with avatars

### Settings
- Team settings (key-value)
- User preferences
- Tag management (CRUD with color picker)

### Notifications
- Real-time via Supabase channels
- Toast popups on new notifications
- Bell icon with unread count
- Mark as read / mark all read
- Created on: task assignment, status change, comments, dependency additions

### Global Search
- Cmd+K / Ctrl+K command palette
- Searches across tasks, projects, decisions, documents
- Keyboard navigation (arrow keys, Enter, Escape)
- Recent searches (localStorage)
- Debounced queries (300ms)

### Activity Logging
- 24 fire-and-forget log points across all CRUD operations
- Logs to activities table with entity_type, entity_id, action, metadata

### UI/UX
- Mobile responsive (sidebar overlay, stacking grids, touch targets)
- Dark/light mode
- Toast feedback on all operations
- 404 page
- Error boundaries (route-level + root-level)
- Role-based sidebar (Team & Settings hidden for members)

---

## Key Patterns

### Data Access Layer
Every entity has a data access file in `src/lib/data/` that exports async functions. Each function:
- Takes a `SupabaseClient` as first arg
- Returns typed data
- Handles errors with console.error
- Uses `.select()` with joins for related data

### Activity Logging
```ts
import { logActivity } from "@/lib/data/log-activity";
logActivity({ supabase, action: "create", entityType: "task", entityId: id, entityName: title });
```
Fire-and-forget — no await needed.

### Notification Creation
```ts
import { createNotification } from "@/lib/data/create-notification";
createNotification({ supabase, userId: recipientId, type: "info", title: "New task assigned", message: "...", entityType: "task", entityId: id });
```
Fire-and-forget. Skips self-notifications.

### Toast Feedback
```ts
import { useToast } from "@/lib/hooks/useToast";
const { showToast } = useToast();
showToast({ title: "Task created", type: "success" });
```

### Current User
```ts
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
const { userId, role, fullName, loading } = useCurrentUser();
```

---

## Known Issues / Tech Debt

1. **ESLint:** Next.js 16 flagged `middleware` as deprecated (use `proxy`) — low priority
2. **psql connection:** Unstable on free tier (pool saturation)
3. **Email rate limit:** Supabase free tier rate-limits rapid API signups
4. **Seed migration:** Must be run manually in Supabase SQL Editor
5. **No test suite:** No unit/integration tests yet
6. **No CI/CD linting:** Vercel builds but doesn't run lint separately

---

## How to Continue Building

### To add a new feature:
1. Add types in `src/types/`
2. Add data access functions in `src/lib/data/`
3. Add UI components in `src/components/`
4. Add page in `src/app/(dashboard)/`
5. Wire activity logging with `logActivity()`
6. Wire notifications with `createNotification()` if applicable
7. Add toast feedback with `useToast()`
8. Run `npx tsc --noEmit` and `npm run lint`
9. Commit and push

### To add a new table:
1. Create migration in `supabase/migrations/`
2. Add types in `src/types/database.ts`
3. Add entity types in `src/types/`
4. Run migration in Supabase SQL Editor
5. Reload schema cache: `NOTIFY pgrst, 'reload schema';`

### To debug Supabase:
- Check RLS policies: Make sure INSERT/UPDATE/DELETE policies exist for authenticated role
- Check FK constraints: Names must match exactly
- Schema cache: After psql changes, reload with `NOTIFY pgrst, 'reload schema';`

---

## Commit History

```
568375c feat: toast feedback, 404 page, error boundaries, task/project delete
407254c feat: notification triggers, role-based sidebar, seed data, calendar list view
1d47d06 feat: mobile responsiveness, global search, comments, dependencies, charts, real-time notifications, edit/delete flows
77b147d feat: build all remaining features — team, decisions, documents, calendar, activity, settings, notifications, comments, dependencies, tags
bcfef2a feat: build projects management experience
dc37eab feat: apply audited DB schema and wire Task UI to Supabase
8deec59 feat: add task management UI with responsive sidebar
896ef14 fix: resolve 6 pre-migration audit findings in database plan
da89ce2 docs: add database migration plan for Phase 2
9ac653e fix: add OAuth callback route and fix Header hydration lint error
96c3f8b feat: add root redirect and NAVO metadata
0f8f167 feat: add NAVO brand colors and theme system
597532f feat: add dashboard layout with sidebar, header, and dark mode
f8ed11d feat: add login page with email/password and Google OAuth
af0f3d2 feat: add auth middleware for session management
93d584b chore: add supabase, lucide-react, next-themes dependencies
f5f728f Initial commit - NAVO HQ scaffold
```

---

## Quick Start (New Machine)

```bash
git clone git@github.com-navo:navo-ng/navo-hq.git
cd navo-hq
npm install
# Create .env.local with Supabase credentials (see Environment Variables section)
npm run dev
```

---

*Last updated: August 2026*
*Built with: opencode (mimo-v2-free)*
