import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Organization, Team, OrganizationMember } from "../types";
import { organizationApi } from "../api/organizations";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  teams: Team[];
  members: OrganizationMember[];
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  console.log("user", user);

  const navigate = useNavigate();
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get current organization
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select(
            `
            *,
            organization_members!inner (
              user_id,
              organization_id,
              role
            )
          `
          )
          .eq("organization_members.user_id", user.id)
          .single();

        if (orgError) throw orgError;

        setCurrentOrganization(org);

        // Load teams and members in parallel
        const [teamsData, membersData] = await Promise.all([
          organizationApi.getTeams(org.id),
          organizationApi.getMembers(org.id),
        ]);

        setTeams(teamsData);
        setMembers(membersData);
      } catch (error) {
        console.error("Error loading organization:", error);
        navigate("/post-signup");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  // If no organization and not loading, the user will be redirected in the useEffect
  if (!currentOrganization) {
    return null;
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        teams,
        members,
        setCurrentOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};
