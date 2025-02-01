import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { organizationApi } from "../api/organizations";
import { Organization, Team, OrganizationMember } from "../types";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useOrganizations() {
  const queryClient = useQueryClient();

  // Get current organization
  const {
    data: currentOrganization,
    isLoading: isLoadingOrg,
    error: orgError,
  } = useQuery({
    queryKey: ["currentOrganization"],
    queryFn: organizationApi.getCurrentOrganization,
  });

  // Get all user's organizations
  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.getUserOrganizations,
  });

  // Get teams for current organization
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

  // Get members for current organization
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

  // Mutation for switching organizations
  const switchOrganization = useMutation({
    mutationFn: organizationApi.switchOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (currentOrganization) {
      const channels = [
        // Teams changes
        supabase.channel("teams").on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "teams",
            filter: `organization_id=eq.${currentOrganization.id}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["teams", currentOrganization.id],
            });
          }
        ),
        // Organization members changes
        supabase.channel("org_members").on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "organization_members",
            filter: `organization_id=eq.${currentOrganization.id}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["members", currentOrganization.id],
            });
          }
        ),
      ];

      channels.forEach((channel) => channel.subscribe());

      return () => {
        channels.forEach((channel) => channel.unsubscribe());
      };
    }
  }, [currentOrganization, queryClient]);

  const isLoading =
    isLoadingOrg || isLoadingTeams || isLoadingMembers || isLoadingOrgs;
  const error = orgError || teamsError || membersError;

  return {
    currentOrganization,
    organizations,
    teams,
    members,
    switchOrganization: switchOrganization.mutate,
    isLoading,
    error,
  };
}
