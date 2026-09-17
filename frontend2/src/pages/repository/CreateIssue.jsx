import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Tag, Loader2, AlertCircle } from "lucide-react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CreateIssue() {
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    if (!isAuthenticated) {
      setError("You must be logged in to create an issue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.issues.create(id, {
        title: title.trim(),
        description: description.trim(),
        labels: labels ? labels.split(",").map((l) => l.trim()).filter(Boolean) : []
      });

      const issueId = res.issue?._id || res.issue?.id;
      navigate(`/repository/${id}/issues/${issueId}`);
    } catch (err) {
      setError(err.message || "Failed to create issue.");
    } finally {
      setLoading(false);
    }
  };

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

      <h1 className="mb-6 text-xl font-semibold text-fg">
        Create a new issue
      </h1>

      {error && (
        <div className="mb-4 max-w-2xl rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card-surface max-w-2xl space-y-5 p-6"
      >
        {/* Title */}
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Briefly describe the issue"
          required
        />

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-fg"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Provide a detailed description of the issue..."
            rows={6}
            className="input-field resize-none"
          />
        </div>

        {/* Labels */}
        <Input
          label="Labels"
          name="labels"
          value={labels}
          onChange={(event) => setLabels(event.target.value)}
          placeholder="bug, enhancement, documentation (comma-separated)"
          icon={Tag}
        />

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="lg" disabled={loading || !title.trim()}>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </span>
            ) : (
              "Submit new issue"
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/repository/${id}/issues`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}