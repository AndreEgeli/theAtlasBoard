import { createContext, useContext, useState } from "react";
import { Organization, Team, OrganizationMember } from "../types";
import { useOrganizations } from "../hooks/useOrganizations";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  teams: Team[];
  members: OrganizationMember[];
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const { teams, members, isLoading } = useOrganizations();

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
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
