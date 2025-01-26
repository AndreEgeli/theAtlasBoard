import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useOrganization } from "../../contexts/OrganizationContext";
import { organizationApi } from "../../api/organizations";

export function CreateOrganization() {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { setCurrentOrganization } = useOrganization();

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create default org-wide team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: "All Members",
          organization_id: org.id,
          is_org_wide: true,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner and team member
      await Promise.all([
        supabase.from("organization_members").insert({
          organization_id: org.id,
          role: "owner",
        }),
        supabase.from("team_members").insert({
          team_id: team.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }),
        organizationApi.updateCurrentOrganization(org.id),
      ]);

      setCurrentOrganization(org);
      navigate("/");
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Create Organization</h1>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <button
          onClick={handleCreate}
          disabled={isCreating || !name.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Plus size={20} />
          Create Organization
        </button>
      </div>
    </div>
  );
}
