import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  LogOut,
  User,
  LogIn
} from "lucide-react";
import VGitLogo from "../common/VGitLogo";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const displayName = user?.name || user?.username || "Developer";
  const username = user?.username || "developer";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=238636&color=fff&size=64`;
  const avatarUrl = user?.avatar || defaultAvatar;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-canvas-subtle px-4">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="text-fg-muted transition-colors hover:text-fg lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex shrink-0 items-center gap-2.5 group"
      >
        <VGitLogo size={28} className="group-hover:scale-105" />

        <span className="hidden text-lg font-bold text-fg sm:block tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          VGit
        </span>
      </Link>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (navSearch.trim()) {
            navigate(`/repositories?search=${encodeURIComponent(navSearch.trim())}`);
          }
        }}
        className="max-w-xl flex-1"
      >
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />

          <input
            type="search"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search repositories, issues, users..."
            aria-label="Search repositories, issues, and users"
            className="input-field pl-9"
          />
        </div>
      </form>

      {/* Right side actions */}
      <div className="flex shrink-0 items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative text-fg-muted transition-colors hover:text-fg"
            >
              <Bell size={20} />
              <span
                aria-hidden="true"
                className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent-green"
              />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="Open profile menu"
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <img
                  src={avatarUrl}
                  alt={username}
                  className="h-8 w-8 rounded-full border border-border"
                />
              </button>

              {menuOpen && (
                <>
                  {/* Click-away overlay */}
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 h-full w-full cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />

                  {/* Dropdown */}
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-canvas-subtle py-1 shadow-xl">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold text-fg truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-fg-muted truncate">
                        @{username} &bull; {user?.email}
                      </p>
                    </div>

                    <Link
                      to={`/profile/${username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-canvas hover:text-fg"
                    >
                      <User size={16} />
                      Your Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-canvas hover:text-fg"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-md bg-accent-green px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-green-hover"
          >
            <LogIn size={16} />
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}