import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useOrganization } from "../../contexts/OrganizationContext";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export function OrganizationSettings() {
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [name, setName] = useState(currentOrganization?.name ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  if (!currentOrganization) return null;

  const handleUpdateOrg = async () => {
    if (!name.trim() || isUpdating) return;
    setIsUpdating(true);

    try {
      const { data: org, error } = await supabase
        .from("organizations")
        .update({ name: name.trim() })
        .eq("id", currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentOrganization(org);
    } catch (error) {
      console.error("Error updating organization:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", currentOrganization.id);

      if (error) throw error;
      setCurrentOrganization(null);
      navigate("/");
    } catch (error) {
      console.error("Error deleting organization:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Organization Settings
      </h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleUpdateOrg}
            disabled={isUpdating || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <Save size={16} />
            Save Changes
          </button>

          <button
            onClick={handleDeleteOrg}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
}
