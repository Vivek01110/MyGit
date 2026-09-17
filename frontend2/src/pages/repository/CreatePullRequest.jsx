import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  GitPullRequest,
  GitBranch,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Tag,
  AlertCircle,
  Plus,
  X
} from "lucide-react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CreatePullRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [branches, setBranches] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedIssueId, setLinkedIssueId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Branch creation modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [branchError, setBranchError] = useState("");

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setCreatingBranch(true);
    setBranchError("");

    try {
      const clean = newBranchName.trim().replace(/\s+/g, "-");
      await api.repositories.createBranch(id, {
        branchName: clean,
        fromBranch: targetBranch || "main"
      });

      const updated = Array.from(new Set([...branches, clean]));
      setBranches(updated);
      setSourceBranch(clean);
      setTitle(`Merge ${clean} into ${targetBranch}`);
      setIsBranchModalOpen(false);
      setNewBranchName("");
    } catch (err) {
      setBranchError(err.message || "Failed to create branch.");
    } finally {
      setCreatingBranch(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadInitialData();
    }
  }, [id]);

  const loadInitialData = async () => {
    setLoadingInitial(true);
    setError("");

    try {
      const [branchRes, issueRes] = await Promise.all([
        api.repositories.getBranches(id),
        api.issues.getAll(id, "open")
      ]);

      const branchList = branchRes.branches || ["main"];
      setBranches(branchList);
      setOpenIssues(issueRes.issues || []);

      // Default source to a non-main branch if available
      const nonMain = branchList.find((b) => b !== "main");
      if (nonMain) {
        setSourceBranch(nonMain);
        setTitle(`Merge ${nonMain} into main`);
      } else {
        setSourceBranch(branchList[0] || "main");
      }
      setTargetBranch(branchRes.defaultBranch || "main");
    } catch (err) {
      setError(err.message || "Failed to load repository data.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSourceChange = (e) => {
    const val = e.target.value;
    setSourceBranch(val);
    if (!title || title.startsWith("Merge ")) {
      setTitle(`Merge ${val} into ${targetBranch}`);
    }
  };

  const handleIssueSelect = (e) => {
    const issueId = e.target.value;
    setLinkedIssueId(issueId);

    const issue = openIssues.find((i) => (i._id || String(i.id)) === issueId);
    if (issue) {
      if (!title || title.startsWith("Merge ")) {
        setTitle(`Fix #${issue.number}: ${issue.title}`);
      }
      setDescription((prev) =>
        prev
          ? `${prev}\n\nResolves #${issue.number}`
          : `This pull request resolves issue #${issue.number} (${issue.title}).`
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !sourceBranch) return;

    if (!isAuthenticated) {
      setError("You must be logged in to create a pull request.");
      return;
    }

    if (sourceBranch === targetBranch) {
      setError("Source branch and target branch must be different.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.pullRequests.create(id, {
        title: title.trim(),
        description: description.trim(),
        sourceBranch,
        targetBranch,
        linkedIssueId: linkedIssueId || undefined
      });

      const prId = res.pr?._id || res.pr?.number;
      navigate(`/repository/${id}/pull-requests/${prId}`);
    } catch (err) {
      setError(err.message || "Failed to create pull request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center py-16 text-fg-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span>Loading repository branches & issues...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to={`/repository/${id}/pull-requests`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} />
        Back to pull requests
      </Link>

      <h1 className="mb-2 text-2xl font-semibold text-fg">
        Comparing changes & open a Pull Request
      </h1>
      <p className="mb-6 text-sm text-fg-muted">
        Choose two branches to see what’s changed or to start a new pull request.
      </p>

      {/* Single Branch Warning / Quick Creator */}
      {branches.length <= 1 && (
        <div className="mb-6 rounded-lg border border-accent-blue/20 bg-accent-blue/10 p-4 text-sm text-fg">
          <div className="font-semibold text-accent-blue mb-1">
            Only 1 branch found ({branches[0] || "main"})
          </div>
          <p className="text-xs text-fg-muted mb-3">
            To create a Pull Request, you need two branches. You can either push a branch via CLI:
            <code className="block my-1.5 p-2 rounded bg-canvas font-mono text-accent-blue text-xs border border-border">
              mygit checkout -b fix-bug &amp;&amp; mygit push origin fix-bug
            </code>
            or create a feature branch directly in the browser:
          </p>
          <button
            type="button"
            onClick={() => {
              setBranchError("");
              setNewBranchName("");
              setIsBranchModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded bg-accent-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-blue-hover"
          >
            <Plus size={14} /> Create Branch in Browser
          </button>
        </div>
      )}

      {/* Branch Comparator Box */}
      <div className="card-surface mb-6 p-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-fg-muted text-xs uppercase font-medium">base:</span>
          <select
            value={targetBranch}
            onChange={(e) => setTargetBranch(e.target.value)}
            className="rounded border border-border bg-canvas px-3 py-1.5 font-mono text-sm text-fg"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <span className="text-fg-subtle">←</span>

        <div className="flex items-center gap-2">
          <span className="text-fg-muted text-xs uppercase font-medium">compare:</span>
          <select
            value={sourceBranch}
            onChange={handleSourceChange}
            className="rounded border border-border bg-canvas px-3 py-1.5 font-mono text-sm text-fg"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setBranchError("");
            setNewBranchName("");
            setIsBranchModalOpen(true);
          }}
          className="ml-auto inline-flex items-center gap-1 rounded border border-border bg-canvas px-2.5 py-1 text-xs text-fg-muted hover:text-fg transition-colors"
        >
          <Plus size={12} />
          <span>New Branch</span>
        </button>

        {sourceBranch === targetBranch && branches.length > 1 && (
          <span className="text-xs text-warning w-full mt-1">
            Please choose different branches to compare.
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PR Creation Form */}
      <form onSubmit={handleSubmit} className="card-surface space-y-5 p-6 max-w-3xl">
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fix navbar overflow on mobile"
          required
        />

        {/* Linked Issue Selector */}
        {openIssues.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg flex items-center gap-1.5">
              <Tag size={14} className="text-accent-blue" />
              Link Issue to Resolve (optional)
            </label>
            <select
              value={linkedIssueId}
              onChange={handleIssueSelect}
              className="input-field"
            >
              <option value="">-- No linked issue --</option>
              {openIssues.map((issue) => (
                <option key={issue._id} value={issue._id}>
                  #{issue.number}: {issue.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-fg-subtle">
              When this pull request is merged, the selected issue will be automatically closed.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="input-field resize-y font-sans text-sm"
            placeholder="Explain what changes are in this pull request and why..."
          />
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <Button
            type="submit"
            size="lg"
            disabled={submitting || !title.trim() || sourceBranch === targetBranch}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={16} className="animate-spin" /> Creating...
              </span>
            ) : (
              "Create Pull Request"
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/repository/${id}/pull-requests`)}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Create New Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                <GitBranch size={16} className="text-accent-blue" />
                Create a new branch
              </h3>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {branchError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {branchError}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <Input
                label="Branch Name"
                name="branchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. fix-bug or feature-login"
                required
                autoFocus
              />

              <p className="text-xs text-fg-muted">
                Branch will be created from: <code className="font-mono text-fg">{targetBranch}</code>
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBranchModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingBranch || !newBranchName.trim()}>
                  {creatingBranch ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" /> Creating...
                    </span>
                  ) : (
                    "Create Branch"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
