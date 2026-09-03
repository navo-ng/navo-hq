export interface SubTask {
  title: string;
  priority: "low" | "medium" | "high";
  estimated_hours: number;
  description: string;
}

export interface ActionItem {
  title: string;
  assignee_hint: string;
  priority: "low" | "medium" | "high";
}

const COMMON_PATTERNS: Record<string, { title: string; priority: "low" | "medium" | "high"; hours: number; desc: string }[]> = {
  "launch": [
    { title: "Define launch goals and success metrics", priority: "high", hours: 2, desc: "Clarify what success looks like" },
    { title: "Create launch checklist", priority: "high", hours: 1, desc: "List all tasks needed for launch" },
    { title: "Set up monitoring and analytics", priority: "medium", hours: 2, desc: "Track key metrics from day one" },
    { title: "Prepare launch announcement", priority: "medium", hours: 2, desc: "Draft messaging for users" },
    { title: "Run final QA and testing", priority: "high", hours: 3, desc: "Test all critical paths" },
    { title: "Deploy to production", priority: "high", hours: 1, desc: "Execute deployment plan" },
  ],
  "design": [
    { title: "Gather requirements and constraints", priority: "high", hours: 2, desc: "Understand what needs to be designed and why" },
    { title: "Create wireframes", priority: "high", hours: 3, desc: "Low-fidelity layout exploration" },
    { title: "Design high-fidelity mockups", priority: "medium", hours: 4, desc: "Polished visual designs" },
    { title: "Get feedback and iterate", priority: "medium", hours: 2, desc: "Review with stakeholders" },
    { title: "Prepare design specs for development", priority: "low", hours: 1, desc: "Export assets and document decisions" },
  ],
  "research": [
    { title: "Define research questions", priority: "high", hours: 1, desc: "What exactly do we need to learn?" },
    { title: "Gather existing data and resources", priority: "medium", hours: 2, desc: "Check what's already known" },
    { title: "Conduct research/interviews", priority: "high", hours: 4, desc: "Collect new data" },
    { title: "Analyze findings", priority: "medium", hours: 2, desc: "Identify patterns and insights" },
    { title: "Document and share results", priority: "low", hours: 1, desc: "Write up recommendations" },
  ],
  "migrate": [
    { title: "Audit current state", priority: "high", hours: 2, desc: "Document what exists and dependencies" },
    { title: "Create migration plan", priority: "high", hours: 2, desc: "Step-by-step migration strategy" },
    { title: "Set up new environment", priority: "medium", hours: 3, desc: "Prepare the target system" },
    { title: "Execute data migration", priority: "high", hours: 4, desc: "Move the data" },
    { title: "Validate and test", priority: "high", hours: 2, desc: "Verify everything works" },
    { title: "Update documentation", priority: "low", hours: 1, desc: "Reflect the new setup" },
  ],
  "fix": [
    { title: "Reproduce the issue", priority: "high", hours: 1, desc: "Understand exactly what's broken" },
    { title: "Identify root cause", priority: "high", hours: 2, desc: "Find the source of the problem" },
    { title: "Implement fix", priority: "high", hours: 2, desc: "Write the solution" },
    { title: "Test the fix", priority: "medium", hours: 1, desc: "Verify the fix works and doesn't break anything" },
    { title: "Deploy and monitor", priority: "low", hours: 1, desc: "Ship and watch for regressions" },
  ],
  "build": [
    { title: "Define requirements and scope", priority: "high", hours: 2, desc: "Clarify what needs to be built" },
    { title: "Set up project structure", priority: "high", hours: 2, desc: "Scaffold the codebase" },
    { title: "Implement core functionality", priority: "high", hours: 6, desc: "Build the main features" },
    { title: "Add error handling", priority: "medium", hours: 2, desc: "Handle edge cases and failures" },
    { title: "Write tests", priority: "medium", hours: 3, desc: "Cover critical paths" },
    { title: "Review and refine", priority: "low", hours: 1, desc: "Polish before shipping" },
  ],
  "deploy": [
    { title: "Prepare deployment environment", priority: "high", hours: 1, desc: "Ensure staging/prod are ready" },
    { title: "Run final checks", priority: "high", hours: 1, desc: "Verify all tests pass" },
    { title: "Execute deployment", priority: "high", hours: 1, desc: "Ship to production" },
    { title: "Monitor post-deployment", priority: "medium", hours: 2, desc: "Watch for issues" },
    { title: "Rollback plan", priority: "low", hours: 1, desc: "Prepare fallback if needed" },
  ],
};

export function generateBreakdown(goal: string, context?: string): SubTask[] {
  const lower = goal.toLowerCase();

  for (const [keyword, tasks] of Object.entries(COMMON_PATTERNS)) {
    if (lower.includes(keyword)) {
      return tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        estimated_hours: t.hours,
        description: t.desc,
      }));
    }
  }

  return [
    { title: "Clarify requirements and scope", priority: "high", estimated_hours: 2, description: "Define what needs to be done and acceptance criteria" },
    { title: "Plan the approach", priority: "high", estimated_hours: 1, description: "Decide on the best way to tackle this" },
    { title: "Break into smaller tasks", priority: "medium", estimated_hours: 1, description: "Identify individual work items" },
    { title: "Execute the work", priority: "high", estimated_hours: 4, description: "Do the actual implementation" },
    { title: "Review and refine", priority: "medium", estimated_hours: 2, description: "Check quality and make improvements" },
    { title: "Finalize and document", priority: "low", estimated_hours: 1, description: "Wrap up and share results" },
  ];
}

export function extractActionItems(notes: string): ActionItem[] {
  const lines = notes.split("\n").filter((l) => l.trim());
  const actions: ActionItem[] = [];

  const actionPatterns = [
    /^(?:TODO|Action|Task|Follow[\s-]?up|Decided|Agreed|Will do|Need to|Should|Must|Gonna|Going to)[:\s]+(.+)/i,
    /^[-*]\s+(?:TODO|Action|Task|Follow[\s-]?up)[:\s]+(.+)/i,
    /^[-*]\s+(.+)/,
    /^(\d+)[.)]\s+(.+)/,
  ];

  for (const line of lines) {
    for (const pattern of actionPatterns) {
      const match = line.trim().match(pattern);
      if (match) {
        const title = match[match.length - 1].trim();
        if (title.length > 5 && title.length < 200) {
          const assigneeHint = extractAssignee(line);
          const priority = detectPriority(line);
          actions.push({ title, assignee_hint: assigneeHint, priority });
        }
        break;
      }
    }
  }

  return actions.length > 0 ? actions : [{ title: "Review meeting notes and add action items", assignee_hint: "", priority: "medium" }];
}

function extractAssignee(text: string): string {
  const match = text.match(/@(?:\w+\s?\w*)/);
  return match ? match[0].replace("@", "").trim() : "";
}

function detectPriority(text: string): "low" | "medium" | "high" {
  const lower = text.toLowerCase();
  if (lower.includes("urgent") || lower.includes("asap") || lower.includes("critical")) return "high";
  if (lower.includes("low priority") || lower.includes("nice to have")) return "low";
  return "medium";
}
