import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { OrganizationService } from "@/api/services/OrganizationService";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Organization } from "@/types";

const organizationService = new OrganizationService();

export function useOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current organization
  const {
    data: currentOrganization,
    isLoading: isLoadingOrg,
    error: orgError,
  } = useQuery({
    queryKey: ["currentOrganization"],
    queryFn: () => organizationService.getCurrentOrganization(user?.id!),
    enabled: !!user?.id,
  });

  // Get all user's organizations
  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.getUserOrganizations(user?.id!),
    enabled: !!user?.id,
  });

  // Get teams for current organization
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", currentOrganization?.id],
    queryFn: () => organizationService.getTeams(currentOrganization!.id),
    enabled: !!currentOrganization,
  });

  // Get members for current organization
  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ["members", currentOrganization?.id],
    queryFn: () => organizationService.getMembers(currentOrganization!.id),
    enabled: !!currentOrganization,
  });

  // Create organization mutation
  const createOrganization = useMutation({
    mutationFn: (name: string) =>
      organizationService.createOrganization(name, user?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  // Create team mutation
  const createTeam = useMutation({
    mutationFn: ({ name, isOrgWide }: { name: string; isOrgWide?: boolean }) =>
      organizationService.createTeam(
        currentOrganization!.id,
        name,
        user?.id!,
        isOrgWide
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teams", currentOrganization?.id],
      });
    },
  });

  // Invite member mutation
  const inviteMember = useMutation({
    mutationFn: ({
      email,
      role,
    }: {
      email: string;
      role?: "admin" | "member";
    }) =>
      organizationService.inviteMember(
        currentOrganization!.id,
        email,
        role,
        user?.id!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", currentOrganization?.id],
      });
    },
  });

  // Get pending invites
  const { data: pendingInvites = [], isLoading: isLoadingPendingInvites } =
    useQuery({
      queryKey: ["pendingInvites", user?.email],
      queryFn: () => organizationService.getPendingInvites(user?.email!),
      enabled: !!user?.email,
    });

  // Accept invite mutation
  const acceptInvite = useMutation({
    mutationFn: (token: string) =>
      organizationService.acceptInvite(token, user?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pendingInvites", user?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentOrganization"],
      });
    },
  });

  // Switch organization mutation
  const switchOrganization = useMutation({
    mutationFn: (organizationId: string) =>
      organizationService.setActiveOrganization(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
    },
  });

  // Add organization member mutation
  const addMember = useMutation({
    mutationFn: ({
      userId,
      role = "member",
    }: {
      userId: string;
      role?: "admin" | "member";
    }) => organizationService.addMember(currentOrganization!.id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", currentOrganization?.id],
      });
    },
  });

  // Remove organization member mutation
  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      organizationService.removeMember(currentOrganization!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", currentOrganization?.id],
      });
    },
  });

  // Update organization mutation
  const updateOrganization = useMutation({
    mutationFn: (updates: Partial<Organization>) =>
      organizationService.updateOrganization(currentOrganization!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentOrganization"],
      });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (currentOrganization) {
      const channels = [
        supabase
          .channel("org-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "organizations",
              filter: `id=eq.${currentOrganization.id}`,
            },
            () => {
              queryClient.invalidateQueries({
                queryKey: ["currentOrganization"],
              });
            }
          )
          .on(
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
          )
          .on(
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
          )
          .subscribe(),
      ];

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
    createOrganization: createOrganization.mutate,
    createTeam: createTeam.mutate,
    inviteMember: inviteMember.mutate,
    switchOrganization: switchOrganization.mutate,
    addMember: addMember.mutate,
    removeMember: removeMember.mutate,
    updateOrganization: updateOrganization.mutate,
    isLoading,
    error,
    isCreating: createOrganization.isPending,
    isCreatingTeam: createTeam.isPending,
    isInviting: inviteMember.isPending,
    isSwitchingOrg: switchOrganization.isPending,
    isAddingMember: addMember.isPending,
    isRemovingMember: removeMember.isPending,
    isUpdating: updateOrganization.isPending,
    isAcceptingInvite: acceptInvite.isPending,
    pendingInvites,
    isLoadingPendingInvites,
    acceptInvite: acceptInvite.mutate,
  };
}
