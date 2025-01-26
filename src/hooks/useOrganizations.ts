import { useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "../api/organizations";
import { Organization, Team, OrganizationMember } from "../types";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useOrganizations() {
  const queryClient = useQueryClient();

  const {
    data: currentOrganization,
    isLoading: isLoadingOrg,
    error: orgError,
  } = useQuery({
    queryKey: ["organization"],
    queryFn: organizationApi.getFirstOrganization,
  });

  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", currentOrganization?.id],
    queryFn: () =>
      currentOrganization
        ? organizationApi.getTeams(currentOrganization.id)
        : Promise.resolve([]),
    enabled: !!currentOrganization,
  });

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ["members", currentOrganization?.id],
    queryFn: () =>
      currentOrganization
        ? organizationApi.getMembers(currentOrganization.id)
        : Promise.resolve([]),
    enabled: !!currentOrganization,
  });

  // Subscribe to realtime changes when the component mounts
  useEffect(() => {
    if (currentOrganization) {
      const teamsSubscription = supabase
        .channel("teams")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "teams",
            filter: `organization_id=eq.${currentOrganization.id}`,
          },
          (payload) => {
            // Invalidate and refetch teams query
            queryClient.invalidateQueries({
              queryKey: ["teams", currentOrganization.id],
            });
          }
        )
        .subscribe();

      return () => {
        teamsSubscription.unsubscribe();
      };
    }
  }, [currentOrganization, queryClient]);

  const isLoading = isLoadingOrg || isLoadingTeams || isLoadingMembers;
  const error = orgError || teamsError || membersError;

  return {
    currentOrganization,
    teams,
    members,
    isLoading,
    error,
  };
}
