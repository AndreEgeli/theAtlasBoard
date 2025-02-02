import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { PendingInvite } from "@/types";
import { useOrganization } from "@/api/hooks/useOrganization";

export function PostSignupFlow() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pendingInvites, acceptInvite, createOrganization } =
    useOrganization();

  const handleAcceptInvite = async (token: string) => {
    try {
      await acceptInvite(token);
      navigate(`/`);
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      await createOrganization(orgName.trim());
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization"
      );
      console.error("Error creating organization:", err);
    } finally {
      setCreating(false);
    }
  };

  // Show loading state while either auth or invites are loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Create Organization Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your organization
          </h2>
          {error && (
            <div className="mt-2 text-center text-sm text-red-600">{error}</div>
          )}
          <form className="mt-8 space-y-6" onSubmit={handleCreateOrganization}>
            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-gray-700"
              >
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Organization"}
            </button>
          </form>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full mx-auto">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Or join an organization
            </h2>
            <div className="mt-8 space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <h3 className="text-lg font-medium">
                    {invite.organization_name}
                  </h3>
                  <p className="text-sm text-gray-500">Role: {invite.role}</p>
                  <button
                    onClick={() => handleAcceptInvite(invite.token)}
                    className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Accept Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
