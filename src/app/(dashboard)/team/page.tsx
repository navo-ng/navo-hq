"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { TeamEmptyState } from "@/components/team/TeamEmptyState";
import { TeamMember, TeamRole } from "@/types/team";
import { createClient } from "@/lib/supabase/client";
import { fetchTeam, fetchRoles } from "@/lib/data/team";

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#8B5CF6",
  member: "#10B981",
  viewer: "#6B7280",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [memberData, roleData] = await Promise.all([
        fetchTeam(supabase),
        fetchRoles(supabase),
      ]);
      if (!cancelled) {
        setMembers(memberData);
        setRoles(roleData);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (roleFilter !== "all") {
      result = result.filter((m) => m.role_id === roleFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role?.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [members, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = members.filter((m) => m.is_active).length;
    const byRole: Record<string, number> = {};
    for (const m of members) {
      if (m.role?.name) {
        byRole[m.role.name] = (byRole[m.role.name] || 0) + 1;
      }
    }
    return { total: members.length, active, byRole };
  }, [members]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your team members and roles
            </p>
          </div>
          <Link href="/team/invite">
            <Button className="shrink-0" disabled>
              <UserPlus size={16} />
              Invite Member
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your team members and roles
          </p>
        </div>
        <Link href="/team/invite">
          <Button className="shrink-0">
            <UserPlus size={16} />
            Invite Member
          </Button>
        </Link>
      </div>

      {members.length === 0 ? (
        <TeamEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-navo-green">
                {stats.active}
              </p>
            </div>
            {Object.entries(stats.byRole).slice(0, 2).map(([role, count]) => (
              <div
                key={role}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
                <p className="text-2xl font-bold text-navo-blue">{count}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || roleFilter !== "all"
                  ? "No members match your filters."
                  : "No team members yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Link key={member.id} href={`/team/${member.id}`}>
                  <div className="relative">
                    <TeamMemberCard member={member} />
                    {member.role && (
                      <div className="absolute right-3 top-3">
                        <Badge
                          color={
                            ROLE_BADGE_COLORS[member.role.name] || "#6B7280"
                          }
                        >
                          {member.role.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
