import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { OrganizationService } from "@/api/services/OrganizationService";
import { UserService } from "@/api/services/UserService";
import { useAuth } from "@/hooks/useAuth";
import { Organization } from "@/types";

const organizationService = new OrganizationService();
const userService = new UserService();

// Query Hooks
export function useUserOrganizations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: () => organizationService.getUserOrganizations(user?.id!),
    enabled: !!user?.id,
  });
}

export function useOrganizationTeams() {
  const { currentOrganization } = useAuth();
  return useQuery({
    queryKey: ["teams", currentOrganization?.id],
    queryFn: () => organizationService.getTeams(currentOrganization!.id),
    enabled: !!currentOrganization,
  });
}

export function useOrganizationMembers() {
  const { currentOrganization } = useAuth();
  return useQuery({
    queryKey: ["members", currentOrganization?.id],
    queryFn: () => organizationService.getMembers(currentOrganization!.id),
    enabled: !!currentOrganization,
  });
}

// Mutation Hooks
export function useCreateTeam() {
  const { user, currentOrganization } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, isOrgWide }: { name: string; isOrgWide?: boolean }) =>
      organizationService.createTeam(
        currentOrganization!.id,
        name,
        user?.id!,
        isOrgWide
      ),
    onSuccess: (newTeam) => {
      // Optimistically update the cache with the new team
      queryClient.setQueryData(
        ["teams", currentOrganization?.id],
        (oldTeams: any[] = []) => [...oldTeams, newTeam]
      );
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["teams", currentOrganization?.id],
      });
    },
  });
}

export function useInviteMember() {
  const { user, currentOrganization } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
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
}

export function useSwitchOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) =>
      userService.setActiveOrganization(user!.id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateOrganization() {
  const { currentOrganization } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Organization>) =>
      organizationService.updateOrganization(currentOrganization!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
