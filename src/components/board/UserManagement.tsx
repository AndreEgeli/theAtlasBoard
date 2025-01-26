import React, { useRef, useState } from "react";
import { UserPlus, X, Upload } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../hooks/useUsers";

export function UserManagement() {
  const { users, createUser, deleteUser, isCreating, isDeleting } = useUsers();
  const [newUserName, setNewUserName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAddUser = async () => {
    if (!newUserName.trim() || isCreating) return;

    try {
      const file = fileInputRef.current?.files?.[0];
      await createUser({
        name: newUserName.trim(),
        avatarFile: file,
      });
      setNewUserName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleRemoveUser = async (id: string) => {
    if (!isDeleting) {
      try {
        await deleteUser(id);
      } catch (error) {
        console.error("Error removing user:", error);
      }
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
              disabled={isCreating}
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                disabled={isCreating}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                disabled={isCreating}
              >
                <Upload size={16} />
                Upload Avatar
              </button>
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-10 h-10 rounded-full border border-gray-300"
                />
              )}
            </div>
          </div>
          <button
            onClick={handleAddUser}
            disabled={isCreating}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <UserPlus size={18} />
            {isCreating ? "Adding..." : "Add"}
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
                onClick={() => handleRemoveUser(user.id)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
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
