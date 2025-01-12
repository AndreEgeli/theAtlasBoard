import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Layout } from "lucide-react";
import { Board } from "./components/Board";
import { UserManagement } from "./components/UserManagement";
import { TagManagement } from "./components/TagManagement";
import { TaskModal } from "./components/TaskModal";
import { Popover } from "./components/Popover";
import { useBoards } from "./hooks/useBoards";
import { useUsers } from "./hooks/useUsers";
import { useTags } from "./hooks/useTags";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
  const { boards, createBoard, isLoading: boardsLoading } = useBoards();
  const { users } = useUsers();
  const { tags } = useTags();
  const [currentBoardId, setCurrentBoardId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    if (boards.length > 0 && !currentBoardId) {
      setCurrentBoardId(boards[0].id);
    }
  }, [boards, currentBoardId]);

  const handleAddBoard = async () => {
    if (newBoardName.trim()) {
      const newBoard = await createBoard(newBoardName.trim());
      setNewBoardName("");
      setCurrentBoardId(newBoard.id);
    }
  };

  const handleTaskCreated = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (boardsLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Task Planning Board
            </h1>
            <div className="flex items-center gap-4">
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className="text-sm font-medium">Team</span>
                  </button>
                }
                align="end"
                content={<UserManagement />}
              />
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className="text-sm font-medium">Tags</span>
                  </button>
                }
                align="end"
                content={<TagManagement />}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={currentBoardId}
              onChange={(e) => setCurrentBoardId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="New board name..."
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddBoard();
                  }
                }}
              />
              <button
                onClick={handleAddBoard}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Layout size={18} />
                Add Board
              </button>
            </div>
          </div>
        </div>

        {currentBoardId && (
          <div className="pl-24">
            <Board
              boardId={currentBoardId}
              users={users}
              tags={tags}
              onTaskClick={setSelectedTaskId}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          users={users}
          tags={tags}
          boardId={currentBoardId}
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
              path="/*"
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
