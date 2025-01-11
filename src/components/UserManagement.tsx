import React, { useState, useRef } from 'react';
import { UserPlus, X, Upload } from 'lucide-react';
import type { User } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (name: string, avatar?: string) => void;
  onRemoveUser: (id: string) => void;
}

export function UserManagement({ users, onAddUser, onRemoveUser }: UserManagementProps) {
  const [newUserName, setNewUserName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUser = () => {
    if (newUserName.trim()) {
      onAddUser(newUserName.trim(), previewUrl || undefined);
      setNewUserName('');
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Team Members</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter team member name..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddUser();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Upload size={16} />
                Upload Avatar
              </button>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
            </div>
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <UserPlus size={18} />
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <span>{user.name}</span>
              <button
                onClick={() => onRemoveUser(user.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}