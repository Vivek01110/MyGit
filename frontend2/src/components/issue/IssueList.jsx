import IssueCard from "./IssueCard";

export default function IssueList({ issues, repoId, openCount, closedCount }) {
  if (!issues?.length) {
    return (
      <div className="card-surface py-12 text-center text-fg-muted">
        <p>No issues found.</p>
      </div>
    );
  }

  const computedOpen =
    openCount !== undefined
      ? openCount
      : issues.filter((issue) => (issue.status || "open").toLowerCase() === "open").length;

  const computedClosed =
    closedCount !== undefined
      ? closedCount
      : issues.filter((issue) => (issue.status || "open").toLowerCase() === "closed").length;

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-green" />
          {computedOpen} Open
        </span>

        <span className="flex items-center gap-1.5 text-fg-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          {computedClosed} Closed
        </span>
      </div>

      <div>
        {issues.map((issue) => (
          <IssueCard
            key={issue._id || issue.id}
            issue={issue}
            repoId={repoId}
          />
        ))}
      </div>
    </div>
  );
}