import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import {
  Loader,
  LogOutIcon,
  TagIcon,
  UserIcon,
  Archive,
  ArrowLeft,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Board } from "./components/Board";
import { UserManagement } from "./components/UserManagement";
import { TagManagement } from "./components/TagManagement";
import { TaskModal } from "./components/TaskModal";
import { Popover } from "./components/Popover";
import { useBoardDetails } from "./hooks/useBoards";
import { useUsers } from "./hooks/useUsers";
import { useTags } from "./hooks/useTags";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FilterPopover } from "./components/FilterPopover";
import { useFiltering } from "./hooks/useFiltering";
import { ArchiveBoard } from "./components/ArchiveBoard";
import { BoardIndex } from "./components/BoardIndex";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { boardId } = useParams();
  const {
    board,
    isLoading: boardLoading,
    updateBoard,
    deleteBoard,
  } = useBoardDetails(boardId ?? "");
  const { users } = useUsers();
  const { tags } = useTags();
  const { signOut } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { filters, setFilters, filterTasks, hasActiveFilters, clearFilters } =
    useFiltering();
  const location = useLocation();
  const navigate = useNavigate();

  const handleTaskCreated = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (boardLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  // if (!boardId || !board) {
  //   return <Navigate to="/" />;
  // }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {location.pathname.endsWith("/archive") && (
                <button
                  onClick={() => navigate(`/board/${boardId}`)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Board</span>
                </button>
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {location.pathname.endsWith("/archive")
                  ? "Archive"
                  : "Task Planning Board"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <UserIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Team</span>
                  </button>
                }
                align="end"
                content={<UserManagement />}
              />
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <TagIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Tags</span>
                  </button>
                }
                align="end"
                content={<TagManagement />}
              />
              {!location.pathname.endsWith("/archive") && (
                <>
                  <FilterPopover
                    users={users}
                    tags={tags}
                    filters={filters}
                    onFilterChange={setFilters}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                  <button
                    onClick={() => navigate(`/board/${boardId}/archive`)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Archive className="h-5 w-5" />
                    <span className="text-sm font-medium">Archive</span>
                  </button>
                </>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOutIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {boardId &&
          (location.pathname.endsWith("/archive") ? (
            <ArchiveBoard
              boardId={boardId}
              users={users}
              tags={tags}
              onTaskClick={setSelectedTaskId}
            />
          ) : (
            <Board
              boardId={boardId}
              users={users}
              tags={tags}
              onTaskClick={setSelectedTaskId}
              onTaskCreated={handleTaskCreated}
              filterTasks={filterTasks}
            />
          ))}
      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          users={users}
          tags={tags}
          boardId={boardId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <BoardIndex />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:boardId"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:boardId/archive"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </Router>
  );
}

export default App;
