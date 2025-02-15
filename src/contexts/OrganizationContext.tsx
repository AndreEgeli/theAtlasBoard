import { createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Organization, Team, OrganizationMember } from "../types";
import { useAuth } from "./AuthContext";
import { useOrganization as useOrganizationHook } from "@/api/hooks/useOrganization";
import { OrganizationWithMembers } from "@/api/repositories/OrganizationRepository";
import { useEffect } from "react";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: OrganizationWithMembers[];
  teams: Team[];
  members: OrganizationMember[];
  isLoading: boolean;
  error: Error | null;
  createOrganization: (name: string) => void;
  createTeam: (params: { name: string; isOrgWide?: boolean }) => void;
  inviteMember: (params: { email: string; role?: "admin" | "member" }) => void;
  switchOrganization: (organizationId: string) => void;
  isCreating: boolean;
  isCreatingTeam: boolean;
  isInviting: boolean;
  isSwitchingOrg: boolean;
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
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentOrganization,
    organizations,
    teams,
    members,
    createOrganization,
    createTeam,
    inviteMember,
    switchOrganization,
    isLoading,
    error,
    isCreating,
    isCreatingTeam,
    isInviting,
    isSwitchingOrg,
  } = useOrganizationHook();

  useEffect(() => {
    if (
      !isLoading &&
      !currentOrganization &&
      user &&
      location.pathname !== "/post-signup"
    ) {
      console.log("No organization found, redirecting to post-signup");
      navigate("/post-signup", { replace: true });
    }
  }, [isLoading, currentOrganization, user, navigate, location.pathname]);

  if (isLoading && location.pathname !== "/post-signup") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization: currentOrganization || null,
        organizations,
        teams,
        members,
        isLoading,
        error,
        createOrganization,
        createTeam,
        inviteMember,
        switchOrganization,
        isCreating,
        isCreatingTeam,
        isInviting,
        isSwitchingOrg,
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
