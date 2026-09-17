import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  GitFork,
  Eye,
  Lock,
  Globe,
  Settings,
  Trash2,
  X,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Input from "../common/Input";
import api from "../../services/api";

export default function RepositoryHeader({ repo, isOwner, onRepoUpdated }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState(repo?.name || "");
  const [description, setDescription] = useState(repo?.description || "");
  const [visibility, setVisibility] = useState(repo?.visibility || "public");
  const [language, setLanguage] = useState(repo?.language || "JavaScript");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Delete state
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const navigate = useNavigate();

  if (!repo) {
    return null;
  }

  const repoId = repo._id || repo.id;
  const ownerName = repo.owner?.username || repo.owner || "Developer";
  const isPublic = (repo.visibility || "public").toLowerCase() === "public";
  const visibilityVariant = isPublic ? "public" : "private";

  const handleOpenEdit = () => {
    setName(repo.name);
    setDescription(repo.description || "");
    setVisibility((repo.visibility || "public").toLowerCase());
    setLanguage(repo.language || "JavaScript");
    setError("");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const response = await api.repositories.update(repoId, {
        name: name.trim(),
        description: description.trim(),
        visibility,
        language
      });
      setIsEditOpen(false);
      if (onRepoUpdated) {
        onRepoUpdated(response.repository);
      }
    } catch (err) {
      setError(err.message || "Failed to update repository.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmName !== repo.name) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.repositories.delete(repoId);
      navigate("/repositories");
    } catch (err) {
      setDeleteError(err.message || "Failed to delete repository.");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="card-surface mb-6 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          {/* Owner / Repository name */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link
                to={`/profile/${ownerName}`}
                className="text-lg font-medium text-accent-blue hover:underline"
              >
                {ownerName}
              </Link>

              <span className="text-lg text-fg-muted">/</span>

              <Link
                to={`/repository/${repoId}`}
                className="text-lg font-semibold text-accent-blue hover:underline"
              >
                {repo.name}
              </Link>

              <Badge
                variant={visibilityVariant}
                className="ml-1"
              >
                {isPublic ? (
                  <Globe size={12} aria-hidden="true" />
                ) : (
                  <Lock size={12} aria-hidden="true" />
                )}
                {isPublic ? "Public" : "Private"}
              </Badge>
            </div>

            {/* Description */}
            {repo.description && (
              <p className="mb-4 text-sm text-fg-muted">
                {repo.description}
              </p>
            )}
          </div>

          {/* Owner Settings button */}
          {isOwner && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Settings}
                onClick={handleOpenEdit}
              >
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm border-t border-border pt-4 mt-2">
          {repo.language && (
            <span className="flex items-center gap-1.5 text-fg-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-blue" />
              {repo.language}
            </span>
          )}

          <span className="flex items-center gap-1.5 text-fg-muted">
            <Star
              size={16}
              className="text-warning"
              aria-hidden="true"
            />
            {repo.stars || 0} stars
          </span>

          <span className="flex items-center gap-1.5 text-fg-muted">
            <GitFork size={16} aria-hidden="true" />
            {repo.forks || 0} forks
          </span>

          <span className="flex items-center gap-1.5 text-fg-muted">
            <Eye size={16} aria-hidden="true" />
            {repo.watchers || 0} watching
          </span>
        </div>
      </div>

      {/* Edit Repository Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-surface w-full max-w-lg p-6 shadow-2xl animate-in fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-fg">
                Repository Settings
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="Repository Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="input-field"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">
                  Primary Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field"
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="Java">Java</option>
                  <option value="HTML">HTML</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setIsEditOpen(false);
                    setIsDeleteOpen(true);
                  }}
                >
                  Delete repository
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-surface w-full max-w-md border-red-500/30 p-6 shadow-2xl animate-in fade-in">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} className="shrink-0" />
              <h2 className="text-lg font-semibold text-fg">
                Delete Repository
              </h2>
            </div>

            <p className="mb-4 text-sm text-fg-muted">
              This action <strong>cannot</strong> be undone. This will permanently
              delete the repository <strong>{repo.name}</strong>, all files,
              commits, issues, and Backblaze B2 storage objects.
            </p>

            {deleteError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-fg-muted">
                  Please type <span className="font-semibold text-fg">{repo.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="input-field"
                  placeholder={repo.name}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={confirmName !== repo.name || deleting}
                >
                  {deleting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" /> Deleting...
                    </span>
                  ) : (
                    "I understand, delete this repository"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}