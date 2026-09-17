import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Loader2, CircleDot, CheckCircle } from "lucide-react";

import Button from "../../components/common/Button";
import IssueList from "../../components/issue/IssueList";
import api from "../../services/api";

export default function RepositoryIssues() {
  const { id } = useParams();
  const [statusFilter, setStatusFilter] = useState("open"); // "open" | "closed" | "all"
  const [issues, setIssues] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchIssues();
    }
  }, [id, statusFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    setError("");

    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const res = await api.issues.getAll(id, statusParam);
      setIssues(res.issues || []);
      setOpenCount(res.openCount || 0);
      setClosedCount(res.closedCount || 0);
    } catch (err) {
      setError(err.message || "Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Status filter buttons */}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setStatusFilter("open")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              statusFilter === "open"
                ? "border border-border bg-canvas text-fg font-medium"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <CircleDot size={14} className="text-accent-green" />
            Open ({openCount})
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
            <CheckCircle size={14} className="text-purple-400" />
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
            All ({openCount + closedCount})
          </button>
        </div>

        <Button
          icon={Plus}
          size="sm"
          to={`/repository/${id}/issues/create`}
        >
          New Issue
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
          <span>Loading issues...</span>
        </div>
      ) : (
        <IssueList
          issues={issues}
          repoId={id}
          openCount={openCount}
          closedCount={closedCount}
        />
      )}
    </div>
  );
}