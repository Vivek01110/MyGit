import { Link } from "react-router-dom";
import { CircleDot, CheckCircle, MessageCircle } from "lucide-react";
import Badge from "../common/Badge";

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

export default function IssueCard({ issue, repoId }) {
  const issueId = issue._id || issue.id;
  const isOpen = (issue.status || "open").toLowerCase() === "open";
  const StatusIcon = isOpen ? CircleDot : CheckCircle;
  const statusColor = isOpen ? "text-accent-green" : "text-purple-400";
  const authorName = issue.author?.username || issue.author || "Anonymous";
  const commentsCount = Array.isArray(issue.comments) ? issue.comments.length : (issue.comments || 0);

  return (
    <Link
      to={`/repository/${repoId}/issues/${issueId}`}
      className="flex items-start gap-3 border-b border-border p-3 transition-colors last:border-b-0 hover:bg-canvas"
    >
      <StatusIcon
        size={18}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${statusColor}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium text-fg hover:text-accent-blue">
            {issue.title}
          </h3>

          {issue.labels?.map((label) => (
            <Badge key={label} variant="label">
              {label}
            </Badge>
          ))}
        </div>

        <p className="mt-1 text-xs text-fg-muted">
          #{issue.number} opened {formatDate(issue.createdAt || issue.createdDate)} by{" "}
          <span className="text-accent-blue font-medium">
            {authorName}
          </span>
        </p>
      </div>

      {commentsCount > 0 && (
        <div className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-fg-muted">
          <MessageCircle size={14} aria-hidden="true" />
          <span>{commentsCount}</span>
        </div>
      )}
    </Link>
  );
}