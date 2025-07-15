import React, { useState } from "react";
import {
  HelpCircle,
  X,
  Shield,
  Users,
  Eye,
  Check,
  X as XIcon,
} from "lucide-react";
import { TeamRole } from "@/types";

interface RoleHelpTextProps {
  className?: string;
}

const rolePermissions = {
  owner: {
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    permissions: [
      "Manage team members and roles",
      "Create, edit, and delete boards",
      "Create, edit, and delete tasks",
      "Create, edit, and toggle todos",
      "Assign and unassign users to tasks",
      "Add and remove task tags",
      "View all team content",
    ],
    restrictions: [],
  },
  editor: {
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    permissions: [
      "Create, edit, and delete boards",
      "Create, edit, and delete tasks",
      "Create, edit, and toggle todos",
      "Assign and unassign users to tasks",
      "Add and remove task tags",
      "View all team content",
    ],
    restrictions: ["Cannot manage team members or change roles"],
  },
  viewer: {
    icon: Eye,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    permissions: [
      "View boards and their content",
      "View tasks and their details",
      "View todos and their status",
      "View task assignees and tags",
    ],
    restrictions: [
      "Cannot create, edit, or delete any content",
      "Cannot change task status or move tasks",
      "Cannot assign users or manage tags",
      "Cannot toggle todos or modify them",
      "Cannot manage team members",
    ],
  },
};

export function RoleHelpText({ className = "" }: RoleHelpTextProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
        Understanding Team Roles
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Team Role Permissions Guide
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-gray-600">
                  Team roles determine what actions members can perform within
                  your team's boards and tasks. Choose the appropriate role
                  based on the level of access each member needs.
                </p>

                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                  {(
                    Object.entries(rolePermissions) as [
                      TeamRole,
                      typeof rolePermissions.owner
                    ][]
                  ).map(([role, config]) => {
                    const Icon = config.icon;

                    return (
                      <div
                        key={role}
                        className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <h3
                            className={`font-semibold capitalize ${config.color}`}
                          >
                            {role}
                          </h3>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Can Do:
                            </h4>
                            <ul className="space-y-1">
                              {config.permissions.map((permission, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                  <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{permission}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {config.restrictions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Cannot Do:
                              </h4>
                              <ul className="space-y-1">
                                {config.restrictions.map(
                                  (restriction, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-sm text-gray-600"
                                    >
                                      <XIcon className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                      <span>{restriction}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    💡 Best Practices
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>
                      • Use <strong>Owner</strong> role sparingly - only for
                      team leads who need full control
                    </li>
                    <li>
                      • Give <strong>Editor</strong> role to active contributors
                      who create and manage content
                    </li>
                    <li>
                      • Use <strong>Viewer</strong> role for stakeholders who
                      need visibility but shouldn't edit
                    </li>
                    <li>
                      • Role changes take effect immediately - no need to
                      refresh the page
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
