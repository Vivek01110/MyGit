import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  CircleDot,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Check,
  X
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
  } catch {
    return dateStr;
  }
};

export default function IssueDetails() {
  const { id, issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { repo, isOwner: isRepoOwner } = useOutletContext();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit issue mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLabels, setEditLabels] = useState("");
  const [updating, setUpdating] = useState(false);

  // New comment
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Delete issue modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id && issueId) {
      fetchIssue();
    }
  }, [id, issueId]);

  const fetchIssue = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.issues.getById(id, issueId);
      setIssue(res.issue);
      setEditTitle(res.issue.title);
      setEditDescription(res.issue.description || "");
      setEditLabels((res.issue.labels || []).join(", "));
    } catch (err) {
      setError(err.message || "Failed to load issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!issue) return;
    const newStatus = (issue.status || "open").toLowerCase() === "open" ? "closed" : "open";
    setUpdating(true);

    try {
      const res = await api.issues.update(id, issue._id, { status: newStatus });
      setIssue(res.issue);
    } catch (err) {
      alert(err.message || "Failed to update issue status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setUpdating(true);
    try {
      const res = await api.issues.update(id, issue._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        labels: editLabels ? editLabels.split(",").map((l) => l.trim()).filter(Boolean) : []
      });
      setIssue(res.issue);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || "Failed to save edits.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteIssue = async () => {
    setDeleting(true);
    try {
      await api.issues.delete(id, issue._id);
      navigate(`/repository/${id}/issues`);
    } catch (err) {
      alert(err.message || "Failed to delete issue.");
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.issues.addComment(id, issue._id, commentText.trim());
      setIssue(res.issue);
      setCommentText("");
    } catch (err) {
      alert(err.message || "Failed to add comment. Please make sure you are logged in.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-fg-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span>Loading issue details...</span>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="card-surface p-8 text-center">
        <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
        <h2 className="text-lg font-semibold text-fg">Issue Not Found</h2>
        <p className="text-sm text-fg-muted mb-4">{error || "Could not find the requested issue."}</p>
        <Link to={`/repository/${id}/issues`}>
          <Button variant="secondary" size="sm">
            Back to issues
          </Button>
        </Link>
      </div>
    );
  }

  const isOpen = (issue.status || "open").toLowerCase() === "open";
  const StatusIcon = isOpen ? CircleDot : CheckCircle;
  const authorName = issue.author?.username || issue.author || "Anonymous";
  const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0d1117&color=c9d1d9&size=64`;

  // Permission: author or repo owner can edit / delete
  const isAuthor = user && (user.id === (issue.author?._id || issue.author) || user._id === (issue.author?._id || issue.author));
  const canModify = isAuthor || isRepoOwner;

  const comments = issue.comments || [];

  return (
    <div>
      {/* Back link */}
      <Link
        to={`/repository/${id}/issues`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to issues
      </Link>

      {/* Header */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="card-surface mb-6 p-4 space-y-4">
          <Input
            label="Issue Title"
            name="editTitle"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={5}
              className="input-field resize-y"
            />
          </div>

          <Input
            label="Labels (comma-separated)"
            name="editLabels"
            value={editLabels}
            onChange={(e) => setEditLabels(e.target.value)}
            placeholder="bug, enhancement"
          />

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button type="submit" size="sm" disabled={updating || !editTitle.trim()}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <StatusIcon
              size={24}
              aria-hidden="true"
              className={`mt-1 shrink-0 ${isOpen ? "text-accent-green" : "text-purple-400"}`}
            />

            <div>
              <h1 className="mb-2 text-xl font-semibold text-fg">
                {issue.title}{" "}
                <span className="font-normal text-fg-muted">
                  #{issue.number}
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={isOpen ? "open" : "closed"}>
                  {isOpen ? "Open" : "Closed"}
                </Badge>

                {issue.labels?.map((label) => (
                  <Badge key={label} variant="label">
                    {label}
                  </Badge>
                ))}

                <span className="text-xs text-fg-muted">
                  opened by{" "}
                  <span className="font-medium text-accent-blue">
                    {authorName}
                  </span>{" "}
                  on {formatDate(issue.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Close/Reopen, Edit, Delete) */}
          <div className="flex flex-wrap items-center gap-2">
            {canModify && (
              <>
                <Button
                  size="sm"
                  variant={isOpen ? "secondary" : "primary"}
                  onClick={handleToggleStatus}
                  disabled={updating}
                >
                  {isOpen ? "Close issue" : "Reopen issue"}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={Edit2}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Description card */}
      <div className="card-surface mb-6 p-5">
        <div className="mb-3 flex items-center gap-3 border-b border-border/50 pb-3">
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-8 w-8 shrink-0 rounded-full border border-border"
          />

          <div>
            <span className="text-sm font-semibold text-fg">
              {authorName}
            </span>
            <span className="ml-2 text-xs text-fg-subtle">
              {formatDate(issue.createdAt)}
            </span>
          </div>
        </div>

        <div className="whitespace-pre-wrap text-sm text-fg leading-relaxed">
          {issue.description || <span className="italic text-fg-muted">No description provided.</span>}
        </div>
      </div>

      {/* Comments conversation */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
          <MessageCircle size={16} />
          Discussion ({comments.length})
        </h3>

        {comments.map((comment, index) => {
          const cAuthor = comment.author?.username || comment.author || "Anonymous";
          const cAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor)}&background=0d1117&color=c9d1d9&size=64`;

          return (
            <div key={comment._id || index} className="card-surface p-4">
              <div className="mb-2 flex items-center gap-3 border-b border-border/40 pb-2">
                <img
                  src={cAvatar}
                  alt={cAuthor}
                  className="h-7 w-7 shrink-0 rounded-full border border-border"
                />
                <div>
                  <span className="text-xs font-semibold text-fg">
                    {cAuthor}
                  </span>
                  <span className="ml-2 text-xs text-fg-subtle">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm text-fg leading-relaxed pl-10">
                {comment.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add comment box */}
      <form onSubmit={handleAddComment} className="card-surface mt-6 p-5">
        <label className="mb-2 block text-sm font-medium text-fg">
          Leave a comment
        </label>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Type your feedback, question, or reply..."
          rows={4}
          className="input-field mb-3 resize-y"
          required
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={submittingComment || !commentText.trim()}
          >
            {submittingComment ? "Posting..." : "Comment"}
          </Button>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-surface w-full max-w-sm p-6 shadow-2xl border-red-500/30">
            <h3 className="text-lg font-semibold text-fg mb-2">Delete Issue</h3>
            <p className="text-sm text-fg-muted mb-4">
              Are you sure you want to delete issue #{issue.number}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteIssue}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}