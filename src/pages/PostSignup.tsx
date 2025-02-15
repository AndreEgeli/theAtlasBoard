import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/api/hooks/useOrganization";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PostSignupFlow() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pendingInvites, acceptInvite, createOrganization, isCreating } =
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

    setError(null);

    try {
      await createOrganization(orgName.trim());
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization"
      );
      console.error("Error creating organization:", err);
    }
  };

  // Show loading state while either auth or invites are loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center px-4 py-16">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome to Atlasboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything in Atlasboard revolves around your organization and
            teams. Create your organization to get started, or join an existing
            one through an invitation.
          </p>
        </div>

        <div
          className={cn("grid gap-8", {
            "md:grid-cols-2": pendingInvites.length > 0,
            "max-w-md mx-auto w-full": pendingInvites.length === 0,
          })}
        >
          {/* Create Organization Card */}
          <Card
            className={cn("shadow-lg", {
              "md:col-span-2": pendingInvites.length === 0,
            })}
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Create Organization
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {pendingInvites.length === 0
                  ? "Get started by creating your organization workspace"
                  : "Set up your own organization and start inviting team members"}
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateOrganization}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="orgName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Organization Name
                    </label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCreating ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Pending Invites Card */}
          {pendingInvites.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Join Organization
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Accept an invitation to join an existing organization
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInvites.map((invite) => (
                    <Card key={invite.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">
                          {invite.organizations?.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Role: {invite.role}
                        </p>
                        <Button
                          onClick={() => handleAcceptInvite(invite.token)}
                          variant="secondary"
                          className="w-full"
                        >
                          Accept Invite
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Organizations</h3>
              <p className="text-sm text-gray-600">
                Create and manage your company's workspace, invite team members,
                and set up permissions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Teams</h3>
              <p className="text-sm text-gray-600">
                Organize your members into teams for better collaboration and
                project management.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Collaboration</h3>
              <p className="text-sm text-gray-600">
                Work together seamlessly with your team members on projects and
                tasks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
