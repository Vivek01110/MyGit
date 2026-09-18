import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GitCommit,
  Activity as ActivityIcon,
  Loader2,
  GitFork,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileStats from "../../components/profile/ProfileStats";
import ProfileRepositories from "../../components/profile/ProfileRepositories";
import ContributionGraph from "../../components/profile/ContributionGraph";
import ProfileEditModal from "../../components/profile/ProfileEditModal";
import RepositoryList from "../../components/repository/RepositoryList";
import Button from "../../components/common/Button";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { recentActivity } from "../../data/users";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, updateUser: updateAuthUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'repositories' | 'activity'
  const [successToast, setSuccessToast] = useState("");

  const effectiveUsername = username || authUser?.username;
  const isOwner = Boolean(
    authUser &&
    profileUser &&
    (authUser.id === profileUser.id || authUser.username === profileUser.username)
  );

  useEffect(() => {
    fetchProfile();
  }, [username, authUser]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      if (!username && authUser) {
        // Logged in user profile
        const res = await api.users.getMe();
        setProfileUser(res.user);
        setRepositories(res.repositories || []);
      } else if (username) {
        // Specified username
        const res = await api.users.getByUsername(username);
        setProfileUser(res.user);
        setRepositories(res.repositories || []);
      } else {
        // Not logged in and no username provided
        navigate("/login");
        return;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "User profile not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (updatedData) => {
    const res = await api.users.updateProfile(updatedData);
    if (res?.user) {
      setProfileUser(res.user);
      updateAuthUser(res.user);
      setSuccessToast("Profile updated successfully!");
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-fg-muted">
          <Loader2 size={32} className="animate-spin text-accent-green" />
          <p className="text-sm">Loading profile details...</p>
        </div>
      </PageLayout>
    );
  }

  if (error || !profileUser) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="card-surface p-8 max-w-md text-center rounded-2xl border border-border">
            <AlertCircle size={40} className="mx-auto mb-3 text-amber-500" />
            <h1 className="text-xl font-semibold text-fg">User Not Found</h1>
            <p className="mt-2 text-sm text-fg-muted">
              {error || `The user "@${username}" does not exist or could not be loaded.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" size="sm" to="/dashboard">
                Back to Dashboard
              </Button>
              <Button size="sm" to="/repositories">
                Explore Repositories
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalStars = repositories.reduce((acc, r) => acc + (r.stars || 0), 0);
  const totalForks = repositories.reduce((acc, r) => acc + (r.forks || 0), 0);
  const pinnedRepos = repositories.slice(0, 4);

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Success toast notification */}
        {successToast && (
          <div className="flex items-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/30 p-3.5 text-sm text-accent-green animate-fadeIn shadow-lg">
            <CheckCircle2 size={18} />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* 1. Header with Avatar, Details & Edit Trigger */}
        <ProfileHeader
          user={profileUser}
          isOwner={isOwner}
          onEditClick={() => setIsEditModalOpen(true)}
        />

        {/* 2. Quick Metrics Row */}
        <ProfileStats
          repoCount={repositories.length}
          totalStars={totalStars}
          totalForks={totalForks}
        />

        {/* 3. Navigation Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-accent-green text-fg"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <BookOpen size={16} />
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("repositories")}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "repositories"
                  ? "border-accent-green text-fg"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <GitFork size={16} />
              Repositories
              <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-fg-muted border border-border">
                {repositories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "border-accent-green text-fg"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <ActivityIcon size={16} />
              Activity
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4. Contribution Heat Map (Moved from Dashboard) */}
            <section>
              <ContributionGraph username={profileUser.username} />
            </section>

            {/* Pinned / Recent Repositories */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-fg">
                  Popular Repositories
                </h2>
                {repositories.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("repositories")}
                    className="text-xs text-accent-blue hover:underline"
                  >
                    View all ({repositories.length})
                  </button>
                )}
              </div>

              {pinnedRepos.length === 0 ? (
                <div className="card-surface p-6 text-center rounded-xl border border-border">
                  <p className="text-sm text-fg-muted">No repositories yet.</p>
                </div>
              ) : (
                <RepositoryList repositories={pinnedRepos} />
              )}
            </section>

            {/* Activity Summary */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-fg">
                Recent Contributions & Activity
              </h2>
              <div className="card-surface p-5 rounded-xl border border-border">
                <ul className="space-y-4">
                  {recentActivity.map((act) => (
                    <li key={act.id} className="flex items-start gap-3 text-sm">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas border border-border text-fg-muted">
                        <GitCommit size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-fg">
                          <span className="font-medium text-accent-blue">
                            {profileUser.name || profileUser.username}
                          </span>{" "}
                          {act.text}{" "}
                          <span className="font-medium text-fg">
                            {act.target}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-fg-subtle">
                          {act.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}

        {activeTab === "repositories" && (
          <div className="animate-fadeIn">
            <ProfileRepositories
              repositories={repositories}
              isOwner={isOwner}
            />
          </div>
        )}

        {activeTab === "activity" && (
          <div className="card-surface p-6 rounded-xl border border-border animate-fadeIn">
            <h2 className="text-base font-semibold text-fg mb-4">
              Contribution Activity
            </h2>
            <ul className="space-y-4 divide-y divide-border">
              {recentActivity.concat([
                {
                  id: 3,
                  type: "create",
                  text: "created new repository",
                  target: "MyDevProject",
                  time: "3 days ago"
                },
                {
                  id: 4,
                  type: "issue",
                  text: "opened an issue in",
                  target: "VGit-core",
                  time: "Last week"
                }
              ]).map((act) => (
                <li key={act.id} className="pt-3 first:pt-0 flex items-start gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas border border-border text-accent-green">
                    <GitCommit size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-fg">
                      <span className="font-medium text-accent-blue">
                        {profileUser.name || profileUser.username}
                      </span>{" "}
                      {act.text}{" "}
                      <span className="font-semibold text-fg">
                        {act.target}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">{act.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isOwner && (
        <ProfileEditModal
          user={profileUser}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </PageLayout>
  );
}