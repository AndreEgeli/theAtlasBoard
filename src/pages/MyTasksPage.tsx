import { useState } from "react";
import { UserTaskView } from "@/components/tasks/UserTaskView";
import { StandaloneTaskModal } from "@/components/tasks/StandaloneTaskModal";
import { TaskWithContext } from "@/types";

/**
 * My Tasks page that displays all tasks assigned to the current user
 * and allows viewing task details in a modal
 */
export function MyTasksPage() {
  const [selectedTask, setSelectedTask] = useState<TaskWithContext | null>(
    null
  );

  const handleTaskClick = (task: TaskWithContext) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  const handleTaskStatusUpdate = (taskId: string, status: any) => {
    // The UserTaskView component will handle the status update internally
    // This callback is just for any additional handling if needed
    console.log(`Task ${taskId} status updated to ${status}`);
  };

  return (
    <>
      <UserTaskView
        onTaskClick={handleTaskClick}
        onTaskStatusUpdate={handleTaskStatusUpdate}
      />

      {selectedTask && (
        <StandaloneTaskModal
          boardId={selectedTask.boardId}
          taskId={selectedTask.id}
          tags={selectedTask.task_tags || []}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
