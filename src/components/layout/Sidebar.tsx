"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Scale,
  FileText,
  Calendar,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  BarChart3,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useState, useEffect, createContext, useContext } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/standup", label: "Standup", icon: ClipboardList },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users },
  { href: "/decisions", label: "Decisions", icon: Scale },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/reports/time", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] },
];

const SidebarContext = createContext<{
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}>({ mobileOpen: false, setMobileOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { role } = useCurrentUser();

  return (
    <nav className="flex-1 space-y-1 p-2">
      {navItems
        .filter((item) => !item.roles || (role && item.roles.includes(role)))
        .map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-navo-blue focus-visible:outline-offset-2 ${
                isActive
                  ? "bg-navo-blue/10 text-navo-blue"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { role, userId, fullName } = useCurrentUser();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, setMobileOpen]);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <>
      <aside
        className={`hidden md:flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-navo-dark dark:text-white">
                NAVO
              </h1>
              <p className="text-[10px] text-gray-400">Moving made simple.</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-navo-blue focus-visible:outline-offset-2 ${
                  isActive
                    ? "bg-navo-blue/10 text-navo-blue"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-2 dark:border-gray-800">
          <button
            onClick={cycleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title={collapsed ? `Theme: ${theme}` : undefined}
          >
            <ThemeIcon size={18} />
            {!collapsed && <span className="capitalize">{theme}</span>}
          </button>
        </div>

        <div className="border-t border-gray-200 p-2 dark:border-gray-800">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navo-blue text-xs font-medium text-white shrink-0">
              {fullName?.charAt(0).toUpperCase() || "?"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fullName || "User"}</p>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
              <div>
                <h1 className="text-lg font-bold text-navo-dark dark:text-white">
                  NAVO
                </h1>
                <p className="text-[10px] text-gray-400">
                  Moving made simple.
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />

            <div className="border-t border-gray-200 p-2 dark:border-gray-800">
              <button
                onClick={cycleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <ThemeIcon size={18} />
                <span className="capitalize">{theme}</span>
              </button>
            </div>

            <div className="border-t border-gray-200 p-2 dark:border-gray-800">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navo-blue text-xs font-medium text-white shrink-0">
                  {fullName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fullName || "User"}</p>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400">Sign out</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
