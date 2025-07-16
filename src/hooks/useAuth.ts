import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { OrganizationService } from "@/api/services/OrganizationService";
import { UserService } from "@/api/services/UserService";
import { User } from "@/types";
import { AuthUser } from "@supabase/supabase-js";

const organizationService = new OrganizationService();
const userService = new UserService();

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get user session
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  // Get user profile - only load when specifically needed
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes - profiles don't change often
  });

  // Check if user has valid organization access
  const { data: hasValidOrg, isLoading: isLoadingOrgCheck } = useQuery({
    queryKey: ["hasValidOrg", user?.id],
    queryFn: () => userService.hasValidOrganization(user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - check more frequently
  });

  // Get current organization - only if user has valid org access
  const { data: currentOrganization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["currentOrganization", user?.id],
    queryFn: () => organizationService.getCurrentOrganization(user?.id!),
    enabled: !!user && hasValidOrg === true,
    staleTime: 1000 * 60 * 5, // 5 minutes - organization changes are less frequent
    retry: 1, // Don't retry too much on failure
  });

  // Sign in mutation
  const signIn = useMutation({
    mutationFn: ({ email, password }: any) =>
      supabase.auth.signInWithPassword({ email, password }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      if (data.data.user) {
        navigate("/");
      }
    },
  });

  // Sign up mutation
  const signUp = useMutation({
    mutationFn: ({ email, password, name }: any) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/post-signup");
    },
  });

  // Sign out mutation
  const signOut = useMutation({
    mutationFn: () => supabase.auth.signOut(),
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });

  // Create organization mutation
  const createOrganization = useMutation({
    mutationFn: (name: string) =>
      organizationService.createOrganization(name, user?.id!),
    onSuccess: async (organizationData) => {
      // Set the organization data directly in cache
      queryClient.setQueryData(
        ["currentOrganization", user?.id],
        organizationData
      );
      // Also invalidate to ensure consistency
      await queryClient.invalidateQueries({
        queryKey: ["currentOrganization"],
      });
      // Small delay to ensure queries are updated
      setTimeout(() => navigate("/"), 100);
    },
  });

  // Get pending invites
  const { data: pendingInvites, isLoading: isLoadingPendingInvites } = useQuery(
    {
      queryKey: ["pendingInvites", user?.email],
      queryFn: () => organizationService.getPendingInvites(user?.email!),
      enabled: !!user?.email,
    }
  );

  // Accept invite mutation
  const acceptInvite = useMutation({
    mutationFn: (token: string) =>
      organizationService.acceptInvite(token, user?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      navigate("/");
    },
  });

  const isLoading =
    isLoadingUser ||
    isLoadingProfile ||
    isLoadingOrg ||
    isLoadingOrgCheck ||
    isLoadingPendingInvites;

  // Helper to determine if user needs to go to post-signup
  const needsOrganization = user && hasValidOrg === false;

  return {
    user,
    profile,
    currentOrganization,
    hasValidOrg,
    needsOrganization,
    signIn: signIn.mutate,
    signUp: signUp.mutate,
    signOut: signOut.mutate,
    createOrganization: createOrganization.mutate,
    pendingInvites,
    acceptInvite: acceptInvite.mutate,
    isLoading,
    isSigningIn: signIn.isPending,
    isSigningUp: signUp.isPending,
    isCreatingOrg: createOrganization.isPending,
    isAcceptingInvite: acceptInvite.isPending,
  };
}
