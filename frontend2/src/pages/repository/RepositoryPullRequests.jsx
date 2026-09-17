import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  GitPullRequest,
  GitBranch,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Tag
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import api from "../../services/api";

const formatDate = (dateStr) => {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffSecs = Math.floor((now - d) / 1000);
    if (diffSecs < 60) return "just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  } catch {
    return dateStr;
  }
};

export default function RepositoryPullRequests() {
  const { id } = useParams();
  const [statusFilter, setStatusFilter] = useState("open"); // "open" | "merged" | "closed" | "all"
  const [pullRequests, setPullRequests] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [mergedCount, setMergedCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchPRs();
    }
  }, [id, statusFilter]);

  const fetchPRs = async () => {
    setLoading(true);
    setError("");

    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const res = await api.pullRequests.getAll(id, statusParam);
      setPullRequests(res.pullRequests || []);
      setOpenCount(res.openCount || 0);
      setMergedCount(res.mergedCount || 0);
      setClosedCount(res.closedCount || 0);
    } catch (err) {
      setError(err.message || "Failed to load pull requests.");
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status) => {
    if (status === "open") return "open";
    if (status === "merged") return "merged";
    return "closed";
  };

  return (
    <div>
      {/* Action and Filter bar */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setStatusFilter("open")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              statusFilter === "open"
                ? "border border-border bg-canvas text-fg font-medium"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <GitPullRequest size={14} className="text-accent-green" />
            Open ({openCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("merged")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              statusFilter === "merged"
                ? "border border-border bg-canvas text-fg font-medium"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <CheckCircle size={14} className="text-purple-400" />
            Merged ({mergedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("closed")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              statusFilter === "closed"
                ? "border border-border bg-canvas text-fg font-medium"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Closed ({closedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              statusFilter === "all"
                ? "border border-border bg-canvas text-fg font-medium"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            All ({openCount + mergedCount + closedCount})
          </button>
        </div>

        <Button
          icon={Plus}
          size="sm"
          to={`/repository/${id}/pull-requests/create`}
        >
          New Pull Request
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-fg-muted">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span>Loading pull requests...</span>
        </div>
      ) : pullRequests.length === 0 ? (
        <div className="card-surface p-12 text-center text-fg-muted">
          <GitPullRequest size={36} className="mx-auto mb-3 text-fg-subtle" />
          <h3 className="text-lg font-medium text-fg">No pull requests found</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Pull requests let you propose changes, review code with diffs, and resolve issues.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              icon={Plus}
              to={`/repository/${id}/pull-requests/create`}
            >
              Create Pull Request
            </Button>
          </div>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          {pullRequests.map((pr) => {
            const iconColor =
              pr.status === "open"
                ? "text-accent-green"
                : pr.status === "merged"
                ? "text-purple-400"
                : "text-fg-muted";

            const authorName = pr.author?.username || pr.author || "Anonymous";

            return (
              <Link
                key={pr._id || pr.number}
                to={`/repository/${id}/pull-requests/${pr._id || pr.number}`}
                className="flex items-start gap-3 border-b border-border p-4 transition-colors last:border-b-0 hover:bg-canvas block"
              >
                <GitPullRequest
                  size={18}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${iconColor}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-fg hover:text-accent-blue truncate">
                      {pr.title}
                    </h3>

                    <Badge variant={statusVariant(pr.status)}>
                      {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                    </Badge>

                    {pr.hasConflicts && pr.status === "open" && (
                      <span className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                        <AlertTriangle size={12} /> Conflicts
                      </span>
                    )}

                    {pr.linkedIssue && (
                      <span className="flex items-center gap-1 rounded bg-accent-blue/10 px-2 py-0.5 text-xs text-accent-blue border border-accent-blue/20">
                        <Tag size={11} /> Resolves #{pr.linkedIssue.number || pr.linkedIssue}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                    <span>#{pr.number}</span>
                    <span>•</span>
                    <span>
                      by{" "}
                      <span className="text-accent-blue font-medium">
                        {authorName}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{formatDate(pr.createdAt)}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
                    <GitBranch size={13} />
                    <span className="font-mono text-fg">{pr.sourceBranch}</span>
                    <span>→</span>
                    <span className="font-mono text-fg-muted">{pr.targetBranch}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}