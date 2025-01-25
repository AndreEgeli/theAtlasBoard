import { useBoards } from "../hooks/useBoards";
import { Layout, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function BoardIndex() {
  const { boards, createBoard, isCreating } = useBoards();
  const [newBoardName, setNewBoardName] = useState("");
  const navigate = useNavigate();

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      const newBoard = await createBoard({ name: newBoardName.trim() });
      setNewBoardName("");
      navigate(`/board/${newBoard.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Boards</h1>
        <p className="mt-2 text-gray-600">
          Select a board to view or create a new one
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Board Card */}
        <div className="bg-white p-6 rounded-lg shadow border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors">
          <div className="space-y-4">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateBoard();
                }
              }}
            />
            <button
              onClick={handleCreateBoard}
              disabled={isCreating || !newBoardName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              Create New Board
            </button>
          </div>
        </div>

        {/* Existing Boards */}
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Layout className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {board.name}
                </h2>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created {new Date(board.created_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => navigate(`/board/${board.id}`)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Open Board</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
