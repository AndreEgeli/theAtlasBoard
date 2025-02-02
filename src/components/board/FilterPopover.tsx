import { Filter, X, Search } from "lucide-react";
import { Popover } from "./Popover";
import type { Task, User, Tag } from "../../types";
import { TASK_STATUSES } from "../../utils/taskStatus";
import { useState } from "react";

interface FilterSection {
  title: string;
  searchValue: string;
}

interface FilterPopoverProps {
  tags: Tag[];
  filters: {
    assignees: string[];
    statuses: Task["status"][];
    tags: string[];
    showArchived: boolean;
  };
  onFilterChange: (filters: {
    assignees: string[];
    statuses: Task["status"][];
    tags: string[];
    showArchived: boolean;
  }) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FilterPopover({
  tags,
  filters,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
}: FilterPopoverProps) {
  const [searchState, setSearchState] = useState<Record<string, string>>({
    status: "",
    tags: "",
  });

  const handleSearch = (section: string, value: string) => {
    setSearchState((prev) => ({ ...prev, [section]: value }));
  };

  const filteredStatuses = Object.entries(TASK_STATUSES).filter(([status]) =>
    status.toLowerCase().includes(searchState.status.toLowerCase())
  );

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchState.tags.toLowerCase())
  );

  const handleToggleAssignee = (name: string) => {
    const newAssignees = filters.assignees.includes(name)
      ? filters.assignees.filter((a) => a !== name)
      : [...filters.assignees, name];
    onFilterChange({ ...filters, assignees: newAssignees });
  };

  const handleToggleStatus = (status: Task["status"]) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleToggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onFilterChange({ ...filters, tags: newTags });
  };

  const FilterSection = ({
    title,
    searchPlaceholder,
    searchKey,
    children,
  }: {
    title: string;
    searchPlaceholder: string;
    searchKey: string;
    children: React.ReactNode;
  }) => (
    <div className="flex-1 min-w-[200px] max-w-[300px]">
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="relative mb-2">
        <input
          type="text"
          value={searchState[searchKey]}
          onChange={(e) => handleSearch(searchKey, e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
      </div>
      <div className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Popover
        align="end"
        trigger={
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              hasActiveFilters
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Filter size={20} />
            <span className="text-sm font-medium">Filter</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 rounded-full">
                {filters.assignees.length +
                  filters.statuses.length +
                  filters.tags.length +
                  (filters.showArchived ? 1 : 0)}
              </span>
            )}
          </button>
        }
        content={
          <div className="w-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <FilterSection
                title="Status"
                searchPlaceholder="Search status..."
                searchKey="status"
              >
                {filteredStatuses.map(([status, config]) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(
                        status as Task["status"]
                      )}
                      onChange={() =>
                        handleToggleStatus(status as Task["status"])
                      }
                      className="rounded text-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <config.icon
                        size={16}
                        className={`text-${config.color}-500`}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  </label>
                ))}
              </FilterSection>

              <FilterSection
                title="Tags"
                searchPlaceholder="Search tags..."
                searchKey="tags"
              >
                {filteredTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      className="rounded text-blue-500"
                    />
                    <span
                      className="px-2 py-1 rounded text-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </FilterSection>
            </div>

            <div className="mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showArchived}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      showArchived: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500"
                />
                Show archived tasks
              </label>
            </div>
          </div>
        }
      />
    </div>
  );
}
