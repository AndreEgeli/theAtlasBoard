import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { AppLayout } from "./components/layout/AppLayout";
import { CreateOrganization } from "./components/organization/CreateOrganization";
import { BoardWrapper } from "./components/board/BoardWrapper";
import { BoardIndex } from "./components/board/BoardIndex";
import { TeamManagement } from "./components/organization/TeamManagement";
import { OrganizationSettings } from "./components/organization/OrganizationSettings";
import { UserProfile } from "./components/profile/UserProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              {/* Public routes */}
              <Route
                path="/create-organization"
                element={<CreateOrganization />}
              />

              {/* Board routes */}
              <Route path="/board/:boardId/*" element={<BoardWrapper />} />

              {/* Protected routes under AppLayout */}
              <Route element={<AppLayout />}>
                <Route index element={<BoardIndex />} />
                <Route path="organization">
                  <Route index element={<OrganizationSettings />} />
                  <Route path="teams" element={<TeamManagement />} />
                </Route>
                <Route path="settings" element={<UserProfile />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
