import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GitFork,
  CircleDot,
  GitCommit,
  Star,
  GitPullRequest,
  Plus,
  Loader2,
  BookOpen,
  User,
  Compass,
  ArrowRight
} from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import RepositoryList from "../../components/repository/RepositoryList";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { recentActivity } from "../../data/users";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [userRepos, setUserRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRepos();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await api.repositories.getUserRepos();
      setUserRepos(res.repositories || []);
    } catch (err) {
      console.warn("Failed to load user repos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || user?.username || "Developer";
  const username = user?.username || "developer";

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Welcome Banner */}
        <div className="card-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-green">
              Welcome back
            </span>
            <h1 className="mt-1 text-2xl font-bold text-fg">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Here's an overview of your code repositories and recent activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={User}
              to={`/profile/${username}`}
            >
              View Profile
            </Button>
            <Button
              size="sm"
              icon={Plus}
              to="/repositories/create"
            >
              New Repository
            </Button>
          </div>
        </div>

        {/* Quick Highlights / Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-surface p-4 rounded-xl border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-fg-muted">Your Repositories</p>
              <p className="text-2xl font-bold text-fg mt-1">{userRepos.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas border border-border text-accent-green">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="card-surface p-4 rounded-xl border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-fg-muted">Explore Public Projects</p>
              <Link to="/repositories" className="text-xs text-accent-blue font-medium mt-1.5 flex items-center gap-1 hover:underline">
                Browse all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas border border-border text-blue-400">
              <Compass size={20} />
            </div>
          </div>

          <div className="card-surface p-4 rounded-xl border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-fg-muted">Contribution Map</p>
              <Link to={`/profile/${username}`} className="text-xs text-accent-green font-medium mt-1.5 flex items-center gap-1 hover:underline">
                View on Profile <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas border border-border text-emerald-400">
              <GitCommit size={20} />
            </div>
          </div>
        </div>

        {/* Your Repositories Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
              <BookOpen size={18} className="text-fg-muted" />
              Your Repositories
            </h2>

            {userRepos.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                to="/repositories"
              >
                View all ({userRepos.length})
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-fg-muted">
              <Loader2 size={20} className="animate-spin mr-2 text-accent-green" />
              <span>Loading repositories...</span>
            </div>
          ) : userRepos.length === 0 ? (
            <div className="card-surface p-8 text-center rounded-xl border border-border">
              <BookOpen size={32} className="mx-auto mb-2 text-fg-subtle" />
              <p className="text-sm font-medium text-fg mb-1">You haven't created any repositories yet.</p>
              <p className="text-xs text-fg-muted mb-4">Start by creating a new repository to push code from CLI or Web.</p>
              <Button size="sm" icon={Plus} to="/repositories/create">
                Create your first repository
              </Button>
            </div>
          ) : (
            <RepositoryList repositories={userRepos.slice(0, 6)} />
          )}
        </section>

        {/* Activity Feed Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
              <GitCommit size={18} className="text-fg-muted" />
              Recent Activity Feed
            </h2>
          </div>

          <div className="card-surface p-5 rounded-xl border border-border">
            <ul className="space-y-4">
              {recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-canvas text-fg-muted">
                    <GitFork size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-fg">
                      <span className="font-medium text-accent-blue">
                        {displayName}
                      </span>{" "}
                      {activity.text}{" "}
                      <span className="font-semibold text-fg">
                        {activity.target}
                      </span>
                    </p>

                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {activity.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}