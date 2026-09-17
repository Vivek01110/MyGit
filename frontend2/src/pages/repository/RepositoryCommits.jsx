import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { GitCommit, Loader2 } from "lucide-react";
import api from "../../services/api";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
  } catch {
    return dateStr;
  }
};

export default function RepositoryCommits() {
  const { repo } = useOutletContext();
  const repoId = repo?._id || repo?.id;

  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (repoId) {
      fetchCommits();
    }
  }, [repoId]);

  const fetchCommits = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.repositories.getCommits(repoId);
      setCommits(res.commits || []);
    } catch (err) {
      setError(err.message || "Failed to load commits.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-fg-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span>Loading commits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="card-surface p-12 text-center text-fg-muted">
        <GitCommit size={36} className="mx-auto mb-3 text-fg-subtle" />
        <h3 className="text-lg font-medium text-fg">No commits yet</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Commits will appear here once you upload files or push from the CLI.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      {commits.map((commit) => (
        <div
          key={commit.hash}
          className="flex items-start gap-3 border-b border-border p-4 transition-colors last:border-b-0 hover:bg-canvas"
        >
          <GitCommit
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-fg-muted"
          />

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-fg">
              {commit.message}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-fg-muted">
                by{" "}
                <span className="text-accent-blue font-medium">
                  {commit.author}
                </span>
              </span>

              <span className="text-xs text-fg-subtle">
                {formatDate(commit.date)}
              </span>
            </div>
          </div>

          {/* Commit hash */}
          <code className="shrink-0 rounded border border-border bg-canvas px-2 py-1 font-mono text-xs text-fg-muted">
            {commit.hash.substring(0, 7)}
          </code>
        </div>
      ))}
    </div>
  );
}