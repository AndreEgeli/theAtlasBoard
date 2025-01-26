import React, { useState } from "react";
import { Tag } from "lucide-react";
import { useTags } from "../../hooks/useTags";
import type { Tag as TagType } from "../../types";

const colorOptions = {
  "Light Blue": "#D1E2FF",
  "Light Green": "#D1FFE2",
  "Light Yellow": "#FFF2D1",
  "Light Pink": "#FFD1E2",
  "Light Purple": "#E2D1FF",
};

export function TagManagement() {
  const { tags, createTag, deleteTag, isCreating, isDeleting } = useTags();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#D1E2FF");

  const handleAddTag = () => {
    if (newTagName.trim() && !isCreating) {
      createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName("");
    }
  };

  const handleRemoveTag = (id: string) => {
    if (!isDeleting) {
      deleteTag(id);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Tags</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-12 h-9 p-1 border border-gray-300 rounded cursor-pointer"
            />
            <button
              onClick={handleAddTag}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Tag size={18} />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
            {Object.entries(colorOptions).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setNewTagColor(color)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                  newTagColor === color
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : ""
                }`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: `${tag.color}80`,
                color: "black",
                fontSize: "12px",
              }} // Increased opacity for better visibility
            >
              <span className="font-semibold">{tag.name}</span>{" "}
              {/* Made the text bold for better visibility */}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:opacity-75"
                aria-label={`Remove tag ${tag.name}`} // Added aria-label for accessibility
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
