import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getPendingInvites,
  acceptInvite,
  createOrganization,
} from "../lib/auth";
import type { PendingInvite } from "../lib/auth";

export function PostSignupFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadInvites();
    }
  }, [user?.email]);

  const loadInvites = async () => {
    if (!user?.email) return;
    try {
      const pendingInvites = await getPendingInvites(user.email);
      setInvites(pendingInvites);
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      const { organizationId } = await acceptInvite(token);
      navigate(`/org/${organizationId}`);
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || creating) return;

    setCreating(true);
    try {
      const { organizationId } = await createOrganization(orgName.trim());
      navigate(`/org/${organizationId}`);
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Create Organization Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your organization
          </h2>
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
