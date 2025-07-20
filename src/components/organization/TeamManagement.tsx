import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useOrganizationTeams,
  useOrganizationMembers,
  useCreateTeam,
  useInviteMember,
} from "@/api/hooks/useOrganization";
import { Team, TeamRole } from "../../types";
import { useAuth } from "@/hooks/useAuth";
import { RoleManagement } from "./RoleManagement";
import { RoleHelpText } from "./RoleHelpText";
import { useTeamPermissions } from "@/hooks/permissions/usePermissions";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";
import { supabase } from "@/lib/supabase";

// Create repository instance
const teamMemberRepository = new TeamMemberRepository(supabase);

export function TeamManagement() {
  const { currentOrganization, user } = useAuth();
  const { data: teams = [] } = useOrganizationTeams();
  const { data: members = [] } = useOrganizationMembers();
  const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam();
  const { mutate: inviteMember, isPending: isInvitingMember } =
    useInviteMember();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Get current user's permissions for the selected team
  const { permissions: userPermissions } = useTeamPermissions(selectedTeam?.id);

  // Fetch team members using React Query
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["teamMembers", selectedTeam?.id],
    queryFn: () => teamMemberRepository.findByTeam(selectedTeam!.id),
    enabled: !!selectedTeam && !selectedTeam.is_org_wide,
  });

  if (!currentOrganization) return null;

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || isCreatingTeam) return;
    try {
      createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || isInvitingMember) return;
    try {
      inviteMember({ email: inviteEmail.trim() });
      setInviteEmail("");
    } catch (error) {
      console.error("Error creating invite:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Team Management</h2>

      <div className="grid grid-cols-3 gap-8">
        {/* Teams List */}
        <div className="col-span-1 bg-white rounded-lg shadow p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Teams</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleCreateTeam}
                disabled={isCreatingTeam || !newTeamName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors ${
                    selectedTeam?.id === team.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Users size={20} />
                  <span className="text-sm font-medium">{team.name}</span>
                  {team.is_org_wide && (
                    <span className="text-xs text-gray-500">(All Members)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">
                    {selectedTeam.name} Members
                  </h3>
                  <RoleHelpText />
                </div>
                {!selectedTeam.is_org_wide && (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Invite by email..."
                      className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleInviteMember}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Invite
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    Loading team members...
                  </div>
                ) : selectedTeam.is_org_wide ? (
                  // Show organization members for org-wide teams
                  members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-gray-500" />
                        <div>
                          <div className="font-medium">
                            {member.users?.name ||
                              member.users?.email ||
                              "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.users?.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))
                ) : (
                  // Show team-specific members with role management
                  teamMembers.map((member) => {
                    const canManageRoles =
                      userPermissions?.canEditBoards || false;
                    const isCurrentUser = member.user_id === user?.id;

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Users size={20} className="text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {member.users?.name ||
                                member.users?.email ||
                                "Unknown User"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.users?.email}
                            </div>
                          </div>
                        </div>

                        <RoleManagement
                          teamId={selectedTeam.id}
                          userId={member.user_id}
                          currentRole={member.role as TeamRole}
                          userName={member.users?.name || ""}
                          userEmail={member.users?.email || ""}
                          canManageRoles={canManageRoles && !isCurrentUser}
                          onRoleChange={() => {
                            // React Query will automatically refetch when the mutation succeeds
                            // No need for manual state updates
                          }}
                        />
                      </div>
                    );
                  })
                )}

                {!loadingMembers &&
                  !selectedTeam.is_org_wide &&
                  teamMembers.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      No team members yet. Invite someone to get started!
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select a team to manage members
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
