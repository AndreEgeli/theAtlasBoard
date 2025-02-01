import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Loader, HomeIcon, ArrowLeft } from "lucide-react";
import { Board } from "./Board";
import { ArchiveBoard } from "./ArchiveBoard";
import { TaskModal } from "./TaskModal";
import { FilterPopover } from "./FilterPopover";
import { TagManagement } from "./TagManagement";
import { useBoardDetails } from "../../hooks/useBoards";
import { useUsers } from "../../hooks/useUsers";
import { useTags } from "../../hooks/useTags";
import { useFiltering } from "../../hooks/useFiltering";

export const BoardWrapper = () => {
  const { boardId } = useParams();
  const {
    board,
    isLoading: boardLoading,
    updateBoard,
    deleteBoard,
  } = useBoardDetails(boardId ?? "");
  const { users } = useUsers();
  const { tags } = useTags();
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

  if (!boardId || !board) {
    return navigate("/");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <HomeIcon
                onClick={() => navigate("/")}
                className="cursor-pointer"
              />
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
                  : board?.name ?? "Planning Board"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <TagManagement />
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
                </>
              )}
            </div>
          </div>
        </div>

        {location.pathname.endsWith("/archive") ? (
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
        )}
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
};
