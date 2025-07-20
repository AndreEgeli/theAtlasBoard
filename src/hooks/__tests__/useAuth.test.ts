import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { supabase } from "@/lib/supabase";

// Mock the services
jest.mock("@/lib/supabase");
jest.mock("@/api/services/OrganizationService");
jest.mock("@/api/services/UserService");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return needsOrganization true when user has no valid org", async () => {
    // Mock authenticated user but no valid org
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should indicate user needs organization setup
    expect(result.current.needsOrganization).toBe(true);
  });

  it("should return needsOrganization false when user has valid org", async () => {
    // Mock authenticated user with valid org
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not need organization setup
    expect(result.current.needsOrganization).toBe(false);
  });
});
