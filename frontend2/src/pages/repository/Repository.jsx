import { useState, useEffect } from "react";
import { useParams, NavLink, Outlet } from "react-router-dom";
import {
  Code,
  CircleDot,
  GitPullRequest,
  GitCommit,
  Loader2,
  AlertCircle
} from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import RepositoryHeader from "../../components/repository/RepositoryHeader";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const tabs = [
  {
    to: "code",
    label: "Code",
    icon: Code,
  },
  {
    to: "issues",
    label: "Issues",
    icon: CircleDot,
  },
  {
    to: "pull-requests",
    label: "Pull Requests",
    icon: GitPullRequest,
  },
  {
    to: "commits",
    label: "Commits",
    icon: GitCommit,
  },
];

export default function Repository() {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const fetchRepo = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.repositories.getById(id);
      setRepo(response.repository);
    } catch (err) {
      setError(err.message || "Failed to load repository.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRepo();
    }
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
          <Loader2 size={32} className="animate-spin mb-3 text-accent-blue" />
          <p>Loading repository details...</p>
        </div>
      </PageLayout>
    );
  }

  if (error || !repo) {
    return (
      <PageLayout>
        <div className="card-surface mx-auto max-w-lg p-8 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
          <h1 className="mb-2 text-xl font-semibold text-fg">
            Repository Unavailable
          </h1>
          <p className="text-sm text-fg-muted mb-4">
            {error || "Repository not found or you do not have permission to view it."}
          </p>
          <NavLink
            to="/repositories"
            className="inline-flex rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue-hover"
          >
            Back to Repositories
          </NavLink>
        </div>
      </PageLayout>
    );
  }

  const ownerId = repo.owner?._id || repo.owner;
  const isOwner = user && (user.id === ownerId || user.userId === ownerId || user._id === ownerId);

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl">
        {/* Header with edit & delete controls */}
        <RepositoryHeader
          repo={repo}
          isOwner={isOwner}
          onRepoUpdated={(updated) => setRepo(updated)}
        />

        {/* Tab navigation */}
        <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 whitespace-nowrap px-4 py-2.5",
                    "border-b-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-[#f78166] text-fg"
                      : "border-transparent text-fg-muted hover:text-fg",
                  ].join(" ")
                }
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                />

                {tab.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Tab content */}
        <Outlet context={{ repo, refreshRepo: fetchRepo, isOwner }} />
      </div>
    </PageLayout>
  );
}