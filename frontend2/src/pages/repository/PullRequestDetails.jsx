import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  GitPullRequest,
  GitBranch,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Tag,
  MessageSquare,
  FileCode,
  Send,
  Loader2,
  GitMerge,
  Edit3,
  Check,
  GitCommit,
  Columns,
  AlignJustify,
  Layers,
  FileText
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DiffViewer from "../../components/repository/DiffViewer";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function Avatar({ name = "User", size = "sm" }) {
  const dim = size === "xs" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-10 w-10 text-base" : "h-7 w-7 text-xs";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=38bdf8&size=64`;
  return (
    <img
      src={avatarUrl}
      alt={name}
      className={`${dim} shrink-0 rounded-full border border-border object-cover`}
    />
  );
}

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
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
};

export default function PullRequestDetails() {
  const { id, prId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const outletContext = useOutletContext() || {};
  const repo = outletContext.repo;

  const [pr, setPr] = useState(null);
  const [mergeAnalysis, setMergeAnalysis] = useState(null);
  const [filesChanged, setFilesChanged] = useState([]);
  const [diffStats, setDiffStats] = useState({ totalAdditions: 0, totalDeletions: 0, filesCount: 0 });
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation tab: 'conversation' | 'commits' | 'files'
  const [activeTab, setActiveTab] = useState("conversation");

  // Diff view mode: 'unified' | 'split'
  const [diffViewMode, setDiffViewMode] = useState("unified");

  // Merge modal & state
  const [merging, setMerging] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Close PR state
  const [closing, setClosing] = useState(false);

  // Conflict resolution modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvingFiles, setResolvingFiles] = useState({});
  const [activeConflictFile, setActiveConflictFile] = useState("");

  // Comments
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id && prId) {
      fetchPRDetails();
    }
  }, [id, prId]);

  const fetchPRDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.pullRequests.getById(id, prId);
      setPr(res.pr);
      setMergeAnalysis(res.mergeAnalysis);
      setFilesChanged(res.filesChanged || []);
      setDiffStats(res.diffStats || { totalAdditions: 0, totalDeletions: 0, filesCount: 0 });
      setCommits(res.commits || []);
      setCommitMessage(`Merge pull request #${res.pr.number} from ${res.pr.sourceBranch}`);

      // Initialize conflict resolution editor state with conflict markers
      if (res.mergeAnalysis?.conflictingFiles) {
        const fileMap = {};
        res.mergeAnalysis.conflictingFiles.forEach((f) => {
          fileMap[f.filePath] = f.conflictMarkerText;
        });
        setResolvingFiles(fileMap);
        if (res.mergeAnalysis.conflictingFiles.length > 0) {
          setActiveConflictFile(res.mergeAnalysis.conflictingFiles[0].filePath);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load pull request.");
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const res = await api.pullRequests.merge(id, pr._id || pr.number, commitMessage);
      setPr(res.pr);
      setIsMergeModalOpen(false);
      // Reload to get updated commits / comments / status
      fetchPRDetails();
    } catch (err) {
      alert(err.message || "Failed to merge pull request.");
    } finally {
      setMerging(false);
    }
  };

  const handleClosePR = async () => {
    if (!window.confirm("Are you sure you want to close this pull request without merging?")) {
      return;
    }
    setClosing(true);
    try {
      const res = await api.pullRequests.close(id, pr._id || pr.number);
      setPr(res.pr);
    } catch (err) {
      alert(err.message || "Failed to close pull request.");
    } finally {
      setClosing(false);
    }
  };

  const handleResolveConflicts = async () => {
    setResolving(true);
    try {
      const res = await api.pullRequests.resolveConflicts(id, pr._id || pr.number, {
        resolvedFiles: resolvingFiles,
        commitMessage: `Resolve merge conflicts in PR #${pr.number}`
      });
      setPr(res.pr);
      setIsResolveModalOpen(false);
      fetchPRDetails();
    } catch (err) {
      alert(err.message || "Failed to resolve conflicts.");
    } finally {
      setResolving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.pullRequests.addComment(id, pr._id || pr.number, commentText.trim());
      setPr(res.pr);
      setCommentText("");
    } catch (err) {
      alert(err.message || "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
        <Loader2 size={32} className="animate-spin text-accent-blue mb-3" />
        <span>Loading pull request...</span>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="card-surface p-8 text-center text-fg-muted">
        <AlertTriangle size={36} className="mx-auto mb-3 text-red-400" />
        <h3 className="text-lg font-medium text-fg">Pull Request Not Found</h3>
        <p className="mt-1 text-sm">{error || "The requested pull request could not be loaded."}</p>
        <div className="mt-4">
          <Button icon={ArrowLeft} variant="outline" to={`/repository/${id}/pull-requests`}>
            Back to Pull Requests
          </Button>
        </div>
      </div>
    );
  }

  const authorName = pr.author?.username || pr.author || "Anonymous";
  const authorId = pr.author?._id || pr.author;
  const currentUserId = user?._id || user?.id || user?.userId;
  const repoOwnerId = repo?.owner?._id || repo?.owner;

  const isOwner = Boolean(
    outletContext.isOwner ||
    (currentUserId && repoOwnerId && String(currentUserId) === String(repoOwnerId))
  );

  const isAuthor = Boolean(
    currentUserId && authorId && String(currentUserId) === String(authorId)
  );

  const hasConflicts = pr.hasConflicts;
  const isMerged = pr.status === "merged";
  const isClosed = pr.status === "closed";
  const isOpen = pr.status === "open";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          to={`/repository/${id}/pull-requests`}
          className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent-blue transition-colors"
        >
          <ArrowLeft size={13} />
          Back to Pull Requests
        </Link>
      </div>

      {/* Header Section */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-fg tracking-tight">{pr.title}</h1>
          <span className="text-2xl font-light text-fg-muted font-mono">#{pr.number}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm">
          {isOpen && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <GitPullRequest size={14} /> Open
            </span>
          )}
          {isMerged && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
              <CheckCircle size={14} /> Merged
            </span>
          )}
          {isClosed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
              <XCircle size={14} /> Closed
            </span>
          )}

          <span className="text-fg-muted">
            <strong className="text-fg font-medium">{authorName}</strong> wants to merge commits into{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs text-accent-blue border border-border">
              {pr.targetBranch}
            </code>{" "}
            from{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs text-fg border border-border">
              {pr.sourceBranch}
            </code>
          </span>

          <span className="text-fg-subtle">•</span>
          <span className="text-xs text-fg-muted">{formatDate(pr.createdAt)}</span>
        </div>

        {/* Linked Issue Banner */}
        {pr.linkedIssue && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded bg-accent-blue/10 px-2.5 py-1 text-accent-blue border border-accent-blue/20">
              <Tag size={12} />
              Resolves Issue:{" "}
              <Link
                to={`/repository/${id}/issues/${pr.linkedIssue._id || pr.linkedIssue.number}`}
                className="font-medium underline hover:text-white ml-1"
              >
                #{pr.linkedIssue.number || pr.linkedIssue}: {pr.linkedIssue.title || "Linked Issue"}
              </Link>
            </span>
            {isMerged && (
              <span className="text-xs text-emerald-400 font-medium">
                (Automatically closed upon merge)
              </span>
            )}
          </div>
        )}
      </div>

      {/* TABS NAVIGATION: Conversation | Commits | Files Changed (Code Review) */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("conversation")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "conversation"
                ? "border-accent-green text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <MessageSquare size={16} />
            Conversation
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-fg-muted border border-border">
              {(pr.comments?.length || 0) + 1}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("commits")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "commits"
                ? "border-accent-green text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <GitCommit size={16} />
            Commits
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-fg-muted border border-border">
              {commits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "files"
                ? "border-accent-green text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <FileCode size={16} />
            Files changed (Code Review)
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-fg-muted border border-border">
              {filesChanged.length}
            </span>
            {(diffStats.totalAdditions > 0 || diffStats.totalDeletions > 0) && (
              <span className="flex items-center gap-1 text-xs font-mono ml-1">
                <span className="text-emerald-400">+{diffStats.totalAdditions}</span>
                <span className="text-red-400">-{diffStats.totalDeletions}</span>
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: CONVERSATION */}
      {activeTab === "conversation" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fadeIn">
          {/* Left Column: Description, Timeline, Merge Box, Comments */}
          <div className="space-y-6 lg:col-span-2">
            {/* PR Body / Initial Description */}
            <div className="card-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-canvas/60 px-4 py-2.5 text-xs text-fg-muted">
                <div className="flex items-center gap-2">
                  <Avatar name={authorName} size="xs" />
                  <span className="font-medium text-fg">{authorName}</span> commented {formatDate(pr.createdAt)}
                </div>
                <span className="rounded bg-border/50 px-2 py-0.5 text-[11px] font-mono text-fg-subtle">
                  Author
                </span>
              </div>
              <div className="p-4 text-sm text-fg leading-relaxed whitespace-pre-wrap">
                {pr.description ? (
                  pr.description
                ) : (
                  <span className="italic text-fg-muted">No description provided.</span>
                )}
              </div>
            </div>

            {/* Merge Status & Actions Card */}
            <div className="card-surface overflow-hidden border border-border">
              {isMerged ? (
                <div className="flex items-start gap-3 bg-purple-500/5 p-4 text-sm">
                  <CheckCircle size={20} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-300">Pull request successfully merged</h4>
                    <p className="mt-1 text-xs text-fg-muted">
                      All changes from <span className="font-mono text-fg">{pr.sourceBranch}</span> were merged into{" "}
                      <span className="font-mono text-fg">{pr.targetBranch}</span>.
                    </p>
                    {pr.mergeCommit && (
                      <div className="mt-2 text-xs font-mono text-fg-subtle">
                        Merge commit: <span className="text-purple-300">{pr.mergeCommit.substring(0, 7)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : isClosed ? (
                <div className="flex items-start gap-3 bg-canvas p-4 text-sm">
                  <XCircle size={20} className="text-fg-muted shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-fg">This pull request is closed</h4>
                    <p className="mt-1 text-xs text-fg-muted">
                      No changes were merged into <span className="font-mono">{pr.targetBranch}</span>.
                    </p>
                  </div>
                </div>
              ) : hasConflicts ? (
                <div className="bg-red-500/5 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-400">Cannot be merged automatically</h4>
                      <p className="mt-1 text-xs text-fg-muted">
                        This pull request has conflicting changes with{" "}
                        <span className="font-mono text-fg">{pr.targetBranch}</span> that must be resolved before merging.
                      </p>

                      {pr.conflictingFiles && pr.conflictingFiles.length > 0 && (
                        <div className="mt-3 rounded bg-canvas border border-red-500/20 p-2.5">
                          <div className="text-xs font-semibold text-red-400 mb-1.5">
                            Conflicting Files ({pr.conflictingFiles.length}):
                          </div>
                          <ul className="space-y-1">
                            {pr.conflictingFiles.map((file) => (
                              <li key={file} className="flex items-center gap-1.5 text-xs font-mono text-fg">
                                <FileCode size={13} className="text-red-400" />
                                <span>{file}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          icon={Edit3}
                          onClick={() => setIsResolveModalOpen(true)}
                          className="bg-accent-blue hover:bg-accent-blue-hover text-white"
                        >
                          Resolve Conflicts in Browser
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClosePR}
                          disabled={closing}
                        >
                          Close Pull Request
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/5 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-emerald-400">Able to merge</h4>
                      <p className="mt-1 text-xs text-fg-muted">
                        These branches can be automatically merged without conflicts into{" "}
                        <span className="font-mono text-fg">{pr.targetBranch}</span>.
                      </p>

                      {/* Code review button link */}
                      {filesChanged.length > 0 && (
                        <div className="mt-2.5 text-xs text-fg-muted">
                          <button
                            type="button"
                            onClick={() => setActiveTab("files")}
                            className="text-accent-blue hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <FileCode size={13} />
                            Review {filesChanged.length} changed file(s) before merging &rarr;
                          </button>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {isOwner ? (
                          <Button
                            size="sm"
                            icon={GitMerge}
                            onClick={() => setIsMergeModalOpen(true)}
                            className="bg-accent-green hover:opacity-90 text-white font-medium"
                          >
                            Merge Pull Request
                          </Button>
                        ) : (
                          <span className="rounded bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-400 border border-yellow-500/20 font-medium">
                            Only repository owner can merge
                          </span>
                        )}

                        {(isOwner || isAuthor) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClosePR}
                            disabled={closing}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            {closing ? "Closing..." : isOwner ? "Reject & Close Pull Request" : "Close Pull Request"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline & Discussion Comments */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <MessageSquare size={16} /> Discussion ({pr.comments?.length || 0})
              </h3>

              {pr.comments && pr.comments.length > 0 ? (
                pr.comments.map((comment, index) => {
                  const commentAuthor = comment.author?.username || comment.author || "User";
                  return (
                    <div key={comment._id || index} className="card-surface overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border bg-canvas/40 px-4 py-2 text-xs text-fg-muted">
                        <div className="flex items-center gap-2">
                          <Avatar name={commentAuthor} size="xs" />
                          <span className="font-medium text-fg">{commentAuthor}</span>
                          <span>commented {formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                      <div className="p-4 text-sm text-fg whitespace-pre-wrap leading-relaxed">
                        {comment.body}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-fg-muted italic">No comments yet. Start the conversation below.</div>
              )}

              {/* Add Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="card-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-fg">
                    <Avatar name={user?.username || "You"} size="xs" />
                    <span>Leave a comment</span>
                  </div>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Leave a comment on this pull request..."
                    className="w-full rounded-md border border-border bg-canvas p-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      icon={Send}
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {submittingComment ? "Posting..." : "Comment"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="card-surface p-4 text-center text-xs text-fg-muted">
                  Please <Link to="/login" className="text-accent-blue underline">sign in</Link> to leave a comment.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata Sidebar */}
          <div className="space-y-5">
            <div className="card-surface p-4 space-y-4 text-sm">
              <div>
                <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">Branches</span>
                <div className="mt-2 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between rounded bg-canvas p-2 border border-border">
                    <span className="text-fg-muted">Source:</span>
                    <span className="text-fg font-medium">{pr.sourceBranch}</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-canvas p-2 border border-border">
                    <span className="text-fg-muted">Target:</span>
                    <span className="text-fg font-medium">{pr.targetBranch}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">Status</span>
                <div className="mt-2">
                  <Badge variant={isOpen ? "open" : isMerged ? "merged" : "closed"}>
                    {pr.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {pr.linkedIssue && (
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">Linked Issue</span>
                  <div className="mt-2">
                    <Link
                      to={`/repository/${id}/issues/${pr.linkedIssue._id || pr.linkedIssue.number}`}
                      className="flex items-center gap-1.5 text-xs text-accent-blue hover:underline"
                    >
                      <Tag size={13} />
                      <span>#{pr.linkedIssue.number || pr.linkedIssue}: {pr.linkedIssue.title || "Linked Issue"}</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Changes Summary Card */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">Files Changed</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("files")}
                    className="text-xs text-accent-blue hover:underline"
                  >
                    View Diff &rarr;
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-fg">
                    <span>Changed files:</span>
                    <span className="font-semibold">{filesChanged.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Additions:</span>
                    <span className="font-semibold">+{diffStats.totalAdditions}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-400">
                    <span>Deletions:</span>
                    <span className="font-semibold">-{diffStats.totalDeletions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMITS */}
      {activeTab === "commits" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="card-surface p-4 rounded-xl border border-border flex items-center justify-between">
            <div className="text-sm text-fg">
              Showing <span className="font-semibold text-fg">{commits.length}</span> commit(s) in this pull request
            </div>
            <div className="text-xs text-fg-muted font-mono">
              Comparing <span className="text-fg">{pr.sourceBranch}</span> into <span className="text-accent-blue">{pr.targetBranch}</span>
            </div>
          </div>

          {commits.length === 0 ? (
            <div className="card-surface p-8 text-center text-fg-muted rounded-xl border border-border">
              <GitCommit size={32} className="mx-auto mb-2 text-fg-subtle" />
              <p className="text-sm font-medium text-fg">No separate commits found</p>
              <p className="text-xs text-fg-muted mt-1">
                The source and target branch might be at the same commit or merged.
              </p>
            </div>
          ) : (
            <div className="card-surface rounded-xl border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {commits.map((c) => (
                  <li key={c.hash} className="p-4 hover:bg-canvas/50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas border border-border text-accent-blue mt-0.5">
                        <GitCommit size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{c.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
                          <span className="text-fg font-medium">{c.author}</span>
                          <span>committed {formatDate(c.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 font-mono text-xs text-accent-blue bg-canvas px-2.5 py-1 rounded border border-border">
                      {c.hash.substring(0, 7)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FILES CHANGED (CODE REVIEW DIFF VIEWER) */}
      {activeTab === "files" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Code Review Toolbar */}
          <div className="card-surface p-4 rounded-xl border border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-16 z-20 shadow-md">
            {/* Left: Summary */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-fg">
                Showing {filesChanged.length} changed file{filesChanged.length === 1 ? "" : "s"}
              </span>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-semibold border border-emerald-500/20">
                  +{diffStats.totalAdditions}
                </span>
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-400 font-semibold border border-red-500/20">
                  -{diffStats.totalDeletions}
                </span>
              </div>
            </div>

            {/* Right: View mode toggle & Quick Jump & Merge Action */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* File Jump Selector */}
              {filesChanged.length > 1 && (
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const el = document.getElementById(`file-${val.replace(/[^a-zA-Z0-9_-]/g, "-")}`);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-fg focus:border-accent-blue focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Jump to a file...</option>
                  {filesChanged.map((f) => (
                    <option key={f.filePath} value={f.filePath}>
                      {f.filePath} ({f.status === "added" ? "+" : f.status === "deleted" ? "-" : "~"})
                    </option>
                  ))}
                </select>
              )}

              {/* Unified vs Split Mode Switcher */}
              <div className="flex items-center rounded-lg bg-canvas p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setDiffViewMode("unified")}
                  title="Unified (inline) diff view"
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    diffViewMode === "unified"
                      ? "bg-accent-blue text-white shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  <AlignJustify size={13} />
                  Unified
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("split")}
                  title="Split (side-by-side) diff view"
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    diffViewMode === "split"
                      ? "bg-accent-blue text-white shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  <Columns size={13} />
                  Split
                </button>
              </div>

              {/* Direct Review & Merge button */}
              {isOpen && isOwner && !hasConflicts && (
                <Button
                  size="sm"
                  icon={GitMerge}
                  onClick={() => setIsMergeModalOpen(true)}
                  className="bg-accent-green hover:opacity-90 text-white font-medium ml-1"
                >
                  Review & Merge
                </Button>
              )}
            </div>
          </div>

          {/* Files Diff List */}
          {filesChanged.length === 0 ? (
            <div className="card-surface p-12 text-center text-fg-muted rounded-xl border border-border">
              <FileCode size={36} className="mx-auto mb-3 text-fg-subtle" />
              <h3 className="text-base font-medium text-fg">No file changes detected</h3>
              <p className="mt-1 text-xs">
                The source and target branches currently have identical file trees.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filesChanged.map((file) => (
                <DiffViewer
                  key={file.filePath}
                  file={file}
                  viewMode={diffViewMode}
                />
              ))}
            </div>
          )}

          {/* Bottom review confirmation footer if open */}
          {isOpen && isOwner && (
            <div className="card-surface p-6 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div>
                <h4 className="text-sm font-semibold text-fg">Finished reviewing changes?</h4>
                <p className="text-xs text-fg-muted mt-0.5">
                  {hasConflicts
                    ? "Resolve conflicting changes before this pull request can be merged."
                    : "You can merge this pull request with your chosen commit message."}
                </p>
              </div>

              {!hasConflicts ? (
                <Button
                  size="sm"
                  icon={GitMerge}
                  onClick={() => setIsMergeModalOpen(true)}
                  className="bg-accent-green hover:opacity-90 text-white font-medium"
                >
                  Confirm & Merge Pull Request
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={Edit3}
                  onClick={() => setIsResolveModalOpen(true)}
                  className="bg-accent-blue hover:bg-accent-blue-hover text-white font-medium"
                >
                  Resolve Conflicts
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MERGE CONFIRMATION MODAL WITH CODE REVIEW SUMMARY */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="card-surface w-full max-w-lg border border-border p-6 shadow-2xl space-y-4 rounded-2xl">
            <h3 className="text-lg font-semibold text-fg flex items-center gap-2">
              <GitMerge className="text-accent-green" size={20} />
              Confirm Merge Pull Request
            </h3>
            <p className="text-xs text-fg-muted">
              This will merge all commits from <code className="text-fg font-mono">{pr.sourceBranch}</code> into{" "}
              <code className="text-fg font-mono">{pr.targetBranch}</code>.
              {pr.linkedIssue && " Linked issue #" + (pr.linkedIssue.number || pr.linkedIssue) + " will be automatically closed."}
            </p>

            {/* Changed Files summary in Modal */}
            {filesChanged.length > 0 && (
              <div className="rounded-xl bg-canvas p-3 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <FileCode size={14} className="text-accent-blue" />
                    Reviewing {filesChanged.length} changed file(s):
                  </span>
                  <span className="font-mono text-[11px]">
                    <span className="text-emerald-400">+{diffStats.totalAdditions}</span> /{" "}
                    <span className="text-red-400">-{diffStats.totalDeletions}</span>
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs font-mono pr-1">
                  {filesChanged.map((f) => (
                    <div key={f.filePath} className="flex items-center justify-between text-[11px] text-fg-muted truncate">
                      <span className="truncate">{f.filePath}</span>
                      <span className={f.status === "added" ? "text-emerald-400" : f.status === "deleted" ? "text-red-400" : "text-accent-blue"}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-fg-muted">Commit Message</label>
              <textarea
                rows={3}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas p-2.5 font-mono text-xs text-fg focus:border-accent-blue focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMergeModalOpen(false)}
                disabled={merging}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                icon={Check}
                onClick={handleMerge}
                disabled={merging || !commitMessage.trim()}
                className="bg-accent-green hover:opacity-90 text-white"
              >
                {merging ? (
                  <>
                    <Loader2 size={15} className="animate-spin mr-1.5" />
                    Merging...
                  </>
                ) : (
                  "Confirm and Merge"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT RESOLUTION MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="card-surface flex h-[85vh] w-full max-w-4xl flex-col border border-border shadow-2xl overflow-hidden rounded-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-canvas/80 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-fg flex items-center gap-2">
                  <Edit3 size={18} className="text-red-400" /> Resolve Merge Conflicts
                </h3>
                <p className="text-xs text-fg-muted">
                  Edit the conflicting files directly below to remove conflict markers and keep the desired changes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="text-fg-muted hover:text-fg text-sm font-medium p-1 rounded-lg hover:bg-canvas"
              >
                ✕
              </button>
            </div>

            {/* File Switcher Tabs */}
            {pr.conflictingFiles && pr.conflictingFiles.length > 1 && (
              <div className="flex gap-2 border-b border-border bg-canvas px-6 py-2 overflow-x-auto">
                {pr.conflictingFiles.map((file) => (
                  <button
                    key={file}
                    type="button"
                    onClick={() => setActiveConflictFile(file)}
                    className={`rounded-md px-3 py-1 text-xs font-mono transition-colors ${
                      activeConflictFile === file
                        ? "bg-accent-blue text-white font-medium"
                        : "bg-surface text-fg-muted hover:text-fg"
                    }`}
                  >
                    {file}
                  </button>
                ))}
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeConflictFile ? (
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-fg font-medium">{activeConflictFile}</span>
                    <span className="text-fg-subtle">
                      Remove &lt;&lt;&lt;&lt;&lt;&lt;&lt;, =======, &gt;&gt;&gt;&gt;&gt;&gt;&gt; markers
                    </span>
                  </div>
                  <textarea
                    rows={18}
                    value={resolvingFiles[activeConflictFile] || ""}
                    onChange={(e) =>
                      setResolvingFiles({
                        ...resolvingFiles,
                        [activeConflictFile]: e.target.value
                      })
                    }
                    className="flex-1 w-full rounded-lg border border-border bg-canvas p-3 font-mono text-xs text-fg leading-relaxed focus:border-accent-blue focus:outline-none"
                  />
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-fg-muted">No conflicting file selected.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border bg-canvas/80 px-6 py-3">
              <span className="text-xs text-fg-muted">
                Commits the resolved files directly to <span className="font-mono text-fg">{pr.sourceBranch}</span>.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResolveModalOpen(false)}
                  disabled={resolving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  icon={Check}
                  onClick={handleResolveConflicts}
                  disabled={resolving}
                  className="bg-accent-blue text-white hover:bg-accent-blue-hover"
                >
                  {resolving ? "Saving Resolution..." : "Commit & Mark as Resolved"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
