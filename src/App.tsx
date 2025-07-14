import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout";
import { BoardWrapper } from "./components/board/BoardWrapper";
import { BoardIndex } from "./components/board/BoardIndex";
import { TeamManagement } from "./components/organization/TeamManagement";
import { OrganizationSettings } from "./components/organization/OrganizationSettings";
import { UserProfile } from "./components/profile/UserProfile";
import { PostSignupFlow } from "./pages/PostSignup";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/post-signup"
            element={
              <ProtectedRoute>
                <PostSignupFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/board/:boardId/*"
            element={
              <ProtectedRoute>
                <BoardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BoardIndex />} />
            <Route path="organization">
              <Route index element={<OrganizationSettings />} />
              <Route path="teams" element={<TeamManagement />} />
            </Route>
            <Route path="settings" element={<UserProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
