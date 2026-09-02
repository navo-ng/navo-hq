"use client";

import { TeamMember } from "@/types/team";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface TeamMemberCardProps {
  member: TeamMember;
}

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "#0064F0" }}
        >
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            member.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {member.email}
          </p>
        </div>
        {member.role && (
          <Badge color="#0064F0">{member.role.name}</Badge>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
        <Calendar size={12} />
        Joined {formatJoinDate(member.created_at)}
      </div>
    </div>
  );
}
