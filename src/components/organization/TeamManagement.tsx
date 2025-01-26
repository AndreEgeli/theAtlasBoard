import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useOrganization } from "../../contexts/OrganizationContext";
import { Team, OrganizationMember } from "../../types";
import { supabase } from "../../lib/supabase";

export function TeamManagement() {
  const { currentOrganization, teams, members } = useOrganization();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  if (!currentOrganization) return null;

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || isCreatingTeam) return;
    setIsCreatingTeam(true);

    try {
      const { data: team, error } = await supabase
        .from("teams")
        .insert({
          name: newTeamName.trim(),
          organization_id: currentOrganization?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setNewTeamName("");
      setSelectedTeam(team);
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const { data: invite, error } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: currentOrganization?.id,
          email: inviteEmail.trim(),
          token: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      setInviteEmail("");

      // Generate and copy invite link
      const inviteLink = `${window.location.origin}/invite/${invite.token}`;
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard!");
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
                <h3 className="text-lg font-medium">
                  {selectedTeam.name} Members
                </h3>
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
                {members
                  .filter((member) => {
                    if (selectedTeam.is_org_wide) return true;
                    // TODO: Add team_members filtering once implemented
                    return true;
                  })
                  .map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-gray-500" />
                        <span>{member.user_id}</span>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
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
