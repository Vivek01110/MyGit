import { Link } from "react-router-dom";
import { Star, GitFork, Eye } from "lucide-react";
import Badge from "../common/Badge";

const languageColors = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  HTML: "#e34c26",
};

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

export default function RepositoryCard({ repo }) {
  const repoId = repo._id || repo.id;
  const langColor = languageColors[repo.language] ?? "#8b949e";
  const isPublic = (repo.visibility || "public").toLowerCase() === "public";
  const visibilityVariant = isPublic ? "public" : "private";

  return (
    <Link
      to={`/repository/${repoId}`}
      className="card-surface block p-4 transition-colors hover:border-fg-subtle"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="truncate font-medium text-accent-blue hover:underline">
          {repo.name}
        </h3>

        <Badge variant={visibilityVariant}>
          {isPublic ? "Public" : "Private"}
        </Badge>
      </div>

      {repo.description && (
        <p className="mb-3 line-clamp-2 text-sm text-fg-muted">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="topic">
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-fg-muted">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: langColor }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}

        <span className="flex items-center gap-1">
          <Star size={14} aria-hidden="true" />
          {repo.stars || 0}
        </span>

        <span className="flex items-center gap-1">
          <GitFork size={14} aria-hidden="true" />
          {repo.forks || 0}
        </span>

        <span className="flex items-center gap-1">
          <Eye size={14} aria-hidden="true" />
          {repo.watchers || 0}
        </span>

        <span className="ml-auto">
          Updated {formatDate(repo.updatedAt)}
        </span>
      </div>
    </Link>
  );
}