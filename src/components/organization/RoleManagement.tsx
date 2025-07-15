import React, { useState } from "react";
import { ChevronDown, Info, Users, Shield, Eye } from "lucide-react";
import { TeamRole } from "@/types";
import { RoleBadge } from "@/components/permissions/RoleBadge";
import { useToast } from "@/components/ui/toast";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";
import { supabase } from "@/lib/supabase";

interface RoleManagementProps {
  teamId: string;
  userId: string;
  currentRole: TeamRole;
  userName: string;
  userEmail: string;
  canManageRoles: boolean;
  onRoleChange?: (newRole: TeamRole) => void;
}

const roleDescriptions: Record<TeamRole, string> = {
  owner: "Full control including team management and role changes",
  editor: "Can create, edit, and delete boards, tasks, and todos",
  viewer: "Can only view boards and tasks - no editing permissions",
};

const roleIcons: Record<
  TeamRole,
  React.ComponentType<{ className?: string }>
> = {
  owner: Shield,
  editor: Users,
  viewer: Eye,
};

export function RoleManagement({
  teamId,
  userId,
  currentRole,
  userName,
  userEmail,
  canManageRoles,
  onRoleChange,
}: RoleManagementProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addToast } = useToast();

  const teamMemberRepo = new TeamMemberRepository(supabase);

  const handleRoleChange = async (newRole: TeamRole) => {
    if (newRole === currentRole || !canManageRoles) return;

    setIsUpdating(true);
    setIsDropdownOpen(false);

    try {
      await teamMemberRepo.updateMemberRole(teamId, userId, newRole);

      // Success notification
      addToast({
        type: "success",
        title: "Role Updated Successfully",
        description: `${userName || userEmail} is now a team ${newRole}`,
        duration: 4000,
      });

      // Role change explanation
      addToast({
        type: "info",
        title: "Permission Changes Applied",
        description: roleDescriptions[newRole],
        duration: 6000,
      });

      onRoleChange?.(newRole);
    } catch (error) {
      console.error("Error updating role:", error);
      addToast({
        type: "error",
        title: "Failed to Update Role",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="flex items-center gap-2">
        <RoleBadge role={currentRole} />
        <div className="text-xs text-gray-500">
          {roleDescriptions[currentRole]}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isUpdating}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
      >
        <RoleBadge role={currentRole} />
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Info className="h-4 w-4" />
                Change Role for {userName || userEmail}
              </div>
            </div>

            <div className="p-2">
              {(["owner", "editor", "viewer"] as TeamRole[]).map((role) => {
                const Icon = roleIcons[role];
                const isCurrentRole = role === currentRole;

                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    disabled={isCurrentRole || isUpdating}
                    className={`w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors ${
                      isCurrentRole
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50"
                    } disabled:cursor-not-allowed`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        isCurrentRole ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-medium capitalize ${
                            isCurrentRole ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {role}
                        </span>
                        {isCurrentRole && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm ${
                          isCurrentRole ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {roleDescriptions[role]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-600">
                <strong>Note:</strong> Role changes take effect immediately. The
                user will see updated permissions on their next action.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
