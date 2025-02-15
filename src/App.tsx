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
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrganization } from "./contexts/OrganizationContext";

export const queryClient = new QueryClient({
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

// Create an organization-protected route wrapper
function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  // Don't even try to load organization context if auth is loading or no user
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <OrganizationProvider>
      <OrganizationRouteGuard>{children}</OrganizationRouteGuard>
    </OrganizationProvider>
  );
}

// Separate component to handle organization checks
function OrganizationRouteGuard({ children }: { children: React.ReactNode }) {
  const { currentOrganization, isLoading } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !isLoading &&
      !currentOrganization &&
      location.pathname !== "/post-signup"
    ) {
      navigate("/post-signup");
    }
  }, [currentOrganization, isLoading, location.pathname, navigate]);

  // Show loading state while organization data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  // If we're not loading and have no org, but we're not on post-signup, return null
  // The useEffect above will handle the navigation
  if (!currentOrganization && location.pathname !== "/post-signup") {
    return null;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

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
