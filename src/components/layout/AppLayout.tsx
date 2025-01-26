import { useState } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useOrganization } from "../../contexts/OrganizationContext";
import {
  LayoutGrid,
  Users,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

export function AppLayout() {
  const { currentOrganization } = useOrganization();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentOrganization) {
    return <Navigate to="/create-organization" replace />;
  }

  const navItems = [
    { icon: LayoutGrid, label: "Boards", path: "/" },
    {
      icon: Building2,
      label: "Organization",
      path: "/organization",
      isActive: location.pathname === "/organization",
    },
    {
      icon: Users,
      label: "Teams",
      path: "/organization/teams",
      isActive: location.pathname === "/organization/teams",
    },
    {
      icon: UserCircle,
      label: "Profile",
      path: "/settings",
      isActive: location.pathname === "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidenav */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="font-semibold text-gray-900 truncate">
              {currentOrganization.name}
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2 transition-colors ${
                item.isActive ?? location.pathname === item.path
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
