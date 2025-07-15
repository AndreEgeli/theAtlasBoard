import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Loader, HomeIcon, ArrowLeft } from "lucide-react";
import { Board } from "./Board";
import { ArchiveBoard } from "./ArchiveBoard";
import { TaskModal } from "./TaskModal";
import { FilterPopover } from "./FilterPopover";
import { TagManagement } from "./TagManagement";
import { BoardProvider, useBoardContext } from "@/contexts/BoardContext";
import { useTags } from "@/api/hooks/useTags";
import { useFiltering } from "@/api/hooks/useFiltering";

const BoardContent = () => {
  const { board, isLoadingBoard } = useBoardContext();
  const { tags } = useTags();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { filters, setFilters, filterTasks, hasActiveFilters, clearFilters } =
    useFiltering();
  const location = useLocation();
  const navigate = useNavigate();

  const handleTaskCreated = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (isLoadingBoard) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!board) {
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
                  onClick={() => navigate(`/board/${board.id}`)}
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
          <ArchiveBoard boardId={board.id} onTaskClick={setSelectedTaskId} />
        ) : (
          <Board
            boardId={board.id}
            onTaskClick={setSelectedTaskId}
            onTaskCreated={handleTaskCreated}
            filterTasks={filterTasks}
          />
        )}
      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          tags={tags}
          boardId={board.id}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
};

export const BoardWrapper = () => {
  const { boardId } = useParams();

  if (!boardId) {
    return null;
  }

  return (
    <BoardProvider boardId={boardId}>
      <BoardContent />
    </BoardProvider>
  );
};
