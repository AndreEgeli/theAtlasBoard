import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import type { Tag as TagType } from '../types';

interface TagManagementProps {
  tags: TagType[];
  onAddTag: (tag: Omit<TagType, 'id'>) => void;
  onRemoveTag: (id: string) => void;
}

export interface ColorOptions {
  [key: string]: string;
}

export const colorOptions: ColorOptions = {
  darkBlue: '#D1E2FF',
  lightBlue: '#C4ECFF',
  turquoise: '#C1F5F0',
  green: '#CFF5D1',
  yellow: '#FFEAB6',
  orange: '#FFE0CC',
  red: '#FFD4E0',
  pink: '#FAD2FC',
  purple: '#E0DAFD',
  gray: '#E5E9F0',
};

export function TagManagement({ tags, onAddTag, onRemoveTag }: TagManagementProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#D1E2FF');

  const handleAddTag = () => {
    if (newTagName.trim()) {
      onAddTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName('');
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
                  newTagColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
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
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              <span>{tag.name}</span>
              <button
                onClick={() => onRemoveTag(tag.id)}
                className="hover:opacity-75"
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