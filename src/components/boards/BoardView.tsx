import React from "react";
import { Board } from "@/types";
import {
  BoardPermissionProvider,
  useBoardPermissionsContext,
} from "./BoardPermissionProvider";
import { BoardHeader } from "./BoardHeader";
import { ReadOnlyWrapper } from "@/components/permissions";

interface BoardViewProps {
  board: Board;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
  onAddTask?: () => void;
  children: React.ReactNode;
}

/**
 * Inner component that uses the board permissions context
 */
function BoardViewInner({
  board,
  onEditBoard,
  onDeleteBoard,
  onAddTask,
  children,
}: BoardViewProps) {
  const { isViewer, isLoading } = useBoardPermissionsContext();

  // If permissions are still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="animate-pulse bg-gray-200 h-16 mb-4"></div>
        <div className="flex-1 animate-pulse bg-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <BoardHeader
        board={board}
        onEditBoard={onEditBoard}
        onDeleteBoard={onDeleteBoard}
        onAddTask={onAddTask}
      />

      <div className="flex-1 overflow-auto">
        {/* Apply read-only wrapper if user is a viewer */}
        <ReadOnlyWrapper
          isReadOnly={isViewer}
          tooltipText="You have view-only access to this board"
        >
          {children}
        </ReadOnlyWrapper>
      </div>
    </div>
  );
}

/**
 * Board view component that provides permission context and respects user permissions
 */
export function BoardView(props: BoardViewProps) {
  return (
    <BoardPermissionProvider boardId={props.board.id}>
      <BoardViewInner {...props} />
    </BoardPermissionProvider>
  );
}
