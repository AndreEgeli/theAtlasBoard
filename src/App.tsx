import React, { useState } from 'react';
import { PlusCircle, Trash2, Users, Tags, Layout } from 'lucide-react';
import { Board } from './components/Board';
import { UserManagement } from './components/UserManagement';
import { TagManagement } from './components/TagManagement';
import { TaskModal } from './components/TaskModal';
import { Popover } from './components/Popover';
import { Task, CellPosition, User, Tag, Board as BoardType } from './types';

function App() {
  const [boards, setBoards] = useState<BoardType[]>([
    { id: '1', name: 'Main Board', tasks: [] }
  ]);
  const [currentBoardId, setCurrentBoardId] = useState('1');
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const currentBoard = boards.find(b => b.id === currentBoardId)!;
  const tasks = currentBoard.tasks;

  const handleAddUser = (name: string, avatar?: string) => {
    setUsers([...users, { id: Date.now().toString(), name, avatar }]);
  };

  const handleRemoveUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task => 
        task.assignee === users.find(u => u.id === id)?.name
          ? { ...task, assignee: undefined }
          : task
      )
    })));
  };

  const handleAddTag = (tagData: Omit<Tag, 'id'>) => {
    setTags([...tags, { ...tagData, id: Date.now().toString() }]);
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id));
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task => ({
        ...task,
        tags: task.tags.filter(tagId => tagId !== id)
      }))
    })));
  };

  const handleAddTask = (position: CellPosition) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: '',
      tags: [],
      importance: position.importance,
      timeframe: position.timeframe,
      status: 'pending',
      todos: [],
      order: tasks.filter(
        t => t.importance === position.importance && t.timeframe === position.timeframe
      ).length,
    };
    
    setBoards(boards.map(board => 
      board.id === currentBoardId
        ? { ...board, tasks: [...board.tasks, newTask] }
        : board
    ));
    
    setSelectedTaskId(newTask.id);
  };

  const handleTaskMove = (taskId: string, position: CellPosition) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...position }
          : task
      )
    })));
  };

  const handleTaskDelete = (taskId: string) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.filter(task => task.id !== taskId)
    })));
  };

  const handleTaskAssigneeChange = (taskId: string, assignee: string) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId
          ? { ...task, assignee }
          : task
      )
    })));
  };

  const handleTaskAddTag = (taskId: string, tagId: string) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId && !task.tags.includes(tagId)
          ? { ...task, tags: [...task.tags, tagId] }
          : task
      )
    })));
  };

  const handleTaskRemoveTag = (taskId: string, tagId: string) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId
          ? { ...task, tags: task.tags.filter(id => id !== tagId) }
          : task
      )
    })));
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId
          ? { ...task, status }
          : task
      )
    })));
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )
    })));
  };

  const handleClearCompleted = () => {
    setBoards(boards.map(board => ({
      ...board,
      tasks: board.tasks.filter(task => task.status !== 'completed')
    })));
  };

  const handleAddBoard = () => {
    if (newBoardName.trim()) {
      setBoards([
        ...boards,
        {
          id: Date.now().toString(),
          name: newBoardName.trim(),
          tasks: []
        }
      ]);
      setNewBoardName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Task Planning Board</h1>
            <div className="flex items-center gap-4">
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Users size={20} />
                    <span className="text-sm font-medium">Team</span>
                    {users.length > 0 && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {users.length}
                      </span>
                    )}
                  </button>
                }
                align="end"
                content={
                  <UserManagement
                    users={users}
                    onAddUser={handleAddUser}
                    onRemoveUser={handleRemoveUser}
                  />
                }
              />
              <Popover
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Tags size={20} />
                    <span className="text-sm font-medium">Tags</span>
                    {tags.length > 0 && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {tags.length}
                      </span>
                    )}
                  </button>
                }
                content={
                  <TagManagement
                    tags={tags}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                  />
                }
                align="end"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={currentBoardId}
              onChange={(e) => setCurrentBoardId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {boards.map(board => (
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
                  if (e.key === 'Enter') {
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
            <button
              onClick={handleClearCompleted}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors ml-auto"
            >
              <Trash2 size={20} />
              Clear Completed
            </button>
          </div>
        </div>

        <div className="pl-24">
          <Board
            tasks={tasks}
            users={users}
            tags={tags}
            onTaskMove={handleTaskMove}
            onTaskDelete={handleTaskDelete}
            onTaskAssigneeChange={handleTaskAssigneeChange}
            onTaskAddTag={handleTaskAddTag}
            onTaskRemoveTag={handleTaskRemoveTag}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskClick={setSelectedTaskId}
            onAddTask={handleAddTask}
          />
        </div>
      </div>

      {selectedTaskId && (
        <TaskModal
          task={tasks.find(t => t.id === selectedTaskId)!}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={() => {
            handleTaskDelete(selectedTaskId);
            setSelectedTaskId(null);
          }}
          users={users}
          tags={tags}
          onAssigneeChange={(assignee) => handleTaskAssigneeChange(selectedTaskId, assignee)}
          onAddTag={(tagId) => handleTaskAddTag(selectedTaskId, tagId)}
          onRemoveTag={(tagId) => handleTaskRemoveTag(selectedTaskId, tagId)}
        />
      )}
    </div>
  );
}

export default App;