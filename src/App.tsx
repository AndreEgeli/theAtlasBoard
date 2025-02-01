import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { AppLayout } from "./components/layout/AppLayout";
import { BoardWrapper } from "./components/board/BoardWrapper";
import { BoardIndex } from "./components/board/BoardIndex";
import { TeamManagement } from "./components/organization/TeamManagement";
import { OrganizationSettings } from "./components/organization/OrganizationSettings";
import { UserProfile } from "./components/profile/UserProfile";
import { PostSignupFlow } from "./pages/PostSignup";
import { Login } from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Create a protected route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Create an organization-protected route wrapper
function OrganizationRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OrganizationProvider>{children}</OrganizationProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected but pre-organization routes */}
            <Route
              path="/post-signup"
              element={
                <ProtectedRoute>
                  <PostSignupFlow />
                </ProtectedRoute>
              }
            />

            {/* Organization required routes */}
            <Route
              path="/board/:boardId/*"
              element={
                <OrganizationRoute>
                  <BoardWrapper />
                </OrganizationRoute>
              }
            />

            {/* Protected routes under AppLayout */}
            <Route
              element={
                <OrganizationRoute>
                  <AppLayout />
                </OrganizationRoute>
              }
            >
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
