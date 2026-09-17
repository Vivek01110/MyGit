import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GitFork,
  Compass,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const profileUrl = user?.username ? `/profile/${user.username}` : "/profile";

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/repositories",
      label: "Explore Repos",
      icon: Compass,
    },
    {
      to: profileUrl,
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-border bg-canvas-subtle transition-transform duration-200 lg:sticky lg:top-14 lg:z-30 lg:h-[calc(100vh-3.5rem)] ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="text-fg-muted transition-colors hover:text-fg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-md border px-3 py-2",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "border-border bg-canvas text-fg"
                      : "border-transparent text-fg-muted hover:bg-canvas hover:text-fg",
                  ].join(" ")
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-fg-subtle">DevHub v1.0</p>
          <p className="mt-1 text-xs text-fg-subtle">
            A GitHub-inspired platform
          </p>
        </div>
      </aside>
    </>
  );
}