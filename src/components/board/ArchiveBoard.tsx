import { useTasks } from "@/api/hooks/useTasks";
import { Tag } from "@/types";
import { TaskCard } from "./TaskCard";
import { Trash2, Archive } from "lucide-react";

interface ArchiveBoardProps {
  boardId: string;
  tags: Tag[];
  onTaskClick: (taskId: string) => void;
}

export function ArchiveBoard({
  boardId,
  tags,
  onTaskClick,
}: ArchiveBoardProps) {
  const { tasks, deleteTask } = useTasks(boardId);
  const archivedTasks = tasks.filter((task) => task.status === "archived");

  const handleClearArchive = async () => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete all archived tasks?"
      )
    ) {
      // Delete all archived tasks
      await Promise.all(archivedTasks.map((task) => deleteTask(task.id)));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Archive className="text-gray-500" size={24} />
          <h2 className="text-xl font-semibold">Archive</h2>
          <span className="text-sm text-gray-500">
            ({archivedTasks.length} tasks)
          </span>
        </div>
        {archivedTasks.length > 0 && (
          <button
            onClick={handleClearArchive}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            <span className="text-sm font-medium">Clear Archive</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archivedTasks.map((task) => (
          <TaskCard
            key={task.id}
            taskId={task.id}
            tags={tags}
            boardId={boardId}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
