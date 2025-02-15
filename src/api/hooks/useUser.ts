import { UserService } from "@/api/services/UserService";
import { useQuery } from "@tanstack/react-query";

const userService = new UserService();

export function useUser(userId: string | undefined) {
  const { data: hasOrg, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.checkUserOrganizations(userId),
    enabled: !!userId,
  });

  return { hasOrg, isLoadingOrg };
}
