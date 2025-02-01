import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Organization, Team, OrganizationMember } from "../types";
import { useOrganizations } from "../hooks/useOrganizations";
import { useAuth } from "./AuthContext";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  teams: Team[];
  members: OrganizationMember[];
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const { teams, members, isLoading, organizations } = useOrganizations();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If we have organizations but no current one selected, select the first one
    if (!isLoading && organizations?.length > 0 && !currentOrganization) {
      setCurrentOrganization(organizations[0]);
    }

    // If we have no organizations after loading, redirect to post-signup
    if (!isLoading && organizations?.length === 0) {
      navigate("/post-signup", { replace: true });
    }
  }, [isLoading, organizations, currentOrganization, navigate]);

  // Show loading state while we determine organization status
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Don't render children until we have an organization
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
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
