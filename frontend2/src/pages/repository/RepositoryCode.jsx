import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  FilePlus,
  Loader2,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Terminal,
  X,
  AlertCircle,
  GitBranch,
  Plus
} from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import CodeViewer from "../../components/repository/CodeViewer";
import api from "../../services/api";

export default function RepositoryCode() {
  const { repo, refreshRepo, isOwner } = useOutletContext();
  const repoId = repo?._id || repo?.id;

  const [treeData, setTreeData] = useState({ tree: [], files: {}, latestCommit: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Active viewed file
  const [selectedFile, setSelectedFile] = useState(null); // { name, path, hash, size }
  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Readme preview
  const [readmeContent, setReadmeContent] = useState("");
  const [loadingReadme, setLoadingReadme] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [cloneCopied, setCloneCopied] = useState(false);

  // Branch state
  const [branches, setBranches] = useState(["main"]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [newBranchError, setNewBranchError] = useState("");

  // File Upload state
  const [uploadFilePath, setUploadFilePath] = useState("");
  const [uploadFileContent, setUploadFileContent] = useState("");
  const [uploadCommitMsg, setUploadCommitMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (repoId) {
      fetchBranches();
      fetchTree(currentBranch);
    }
  }, [repoId]);

  const fetchBranches = async () => {
    try {
      const res = await api.repositories.getBranches(repoId);
      const list = res.branches || ["main"];
      setBranches(list);
      if (!list.includes(currentBranch) && list.length > 0) {
        setCurrentBranch(list[0]);
      }
    } catch (err) {
      console.warn("Failed to fetch branches:", err.message);
    }
  };

  const handleBranchChange = (branchName) => {
    setCurrentBranch(branchName);
    fetchTree(branchName);
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setCreatingBranch(true);
    setNewBranchError("");

    try {
      const clean = newBranchName.trim().replace(/\s+/g, "-");
      await api.repositories.createBranch(repoId, {
        branchName: clean,
        fromBranch: currentBranch
      });

      const updated = Array.from(new Set([...branches, clean]));
      setBranches(updated);
      setCurrentBranch(clean);
      setIsNewBranchModalOpen(false);
      setNewBranchName("");
      await fetchTree(clean);
      if (refreshRepo) refreshRepo();
    } catch (err) {
      setNewBranchError(err.message || "Failed to create branch.");
    } finally {
      setCreatingBranch(false);
    }
  };

  const fetchTree = async (branchToFetch = currentBranch) => {
    setLoading(true);
    setError("");
    setSelectedFile(null);

    try {
      const data = await api.repositories.getTree(repoId, branchToFetch);
      setTreeData(data);

      // Auto-expand top-level folders
      const initialExpanded = new Set();
      if (data.tree) {
        data.tree.forEach((item) => {
          if (item.type === "folder") {
            initialExpanded.add(item.id);
          }
        });
      }
      setExpandedFolders(initialExpanded);

      // Check if README.md exists in files to load preview
      const readmeEntry = Object.entries(data.files || {}).find(([path]) =>
        path.toLowerCase() === "readme.md"
      );

      if (readmeEntry) {
        loadReadme(readmeEntry[1].hash);
      } else {
        setReadmeContent("");
      }
    } catch (err) {
      setError(err.message || "Failed to load repository files.");
    } finally {
      setLoading(false);
    }
  };

  const loadReadme = async (hash) => {
    setLoadingReadme(true);
    try {
      const res = await api.repositories.getBlob(repoId, hash);
      setReadmeContent(res.content);
    } catch (err) {
      console.warn("Could not load README preview:", err.message);
    } finally {
      setLoadingReadme(false);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelectFile = async (item) => {
    setSelectedFile(item);
    setLoadingContent(true);
    setFileContent("");

    try {
      const res = await api.repositories.getBlob(repoId, item.hash);
      setFileContent(res.content);
    } catch (err) {
      setFileContent(`Error loading file: ${err.message}`);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle local disk file select
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFilePath(file.name);
    setUploadCommitMsg(`Upload ${file.name}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileContent(event.target?.result || "");
    };
    reader.readAsText(file);
  };

  // Submit file upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFilePath.trim()) return;

    setUploading(true);
    setUploadError("");

    try {
      await api.repositories.uploadFile(repoId, {
        filePath: uploadFilePath.trim(),
        content: uploadFileContent,
        commitMessage: uploadCommitMsg.trim() || `Upload ${uploadFilePath.trim()}`,
        branch: currentBranch
      });

      setIsUploadModalOpen(false);
      setIsNewFileModalOpen(false);
      setUploadFilePath("");
      setUploadFileContent("");
      setUploadCommitMsg("");
      await fetchTree(currentBranch);
      if (refreshRepo) refreshRepo();
    } catch (err) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const renderTree = (items, depth = 0) => {
    return items.map((item) => {
      if (item.type === "folder") {
        const isExpanded = expandedFolders.has(item.id);

        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggleFolder(item.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-canvas"
              style={{ paddingLeft: `${depth * 20 + 12}px` }}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="shrink-0 text-fg-subtle" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-fg-subtle" />
              )}
              <Folder size={16} className="shrink-0 text-accent-blue" />
              <span>{item.name}</span>
            </button>

            {isExpanded && item.children && renderTree(item.children, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={item.id}
          onClick={() => handleSelectFile(item)}
          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-canvas hover:text-fg"
          style={{ paddingLeft: `${depth * 20 + 26}px` }}
        >
          <FileText size={16} className="shrink-0 text-fg-subtle" />
          <span className="truncate">{item.name}</span>
          <span className="ml-auto text-xs text-fg-subtle">
            {item.size}
          </span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-fg-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span>Loading files...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Top action bar */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1.5 rounded border border-border bg-canvas px-2.5 py-1">
            <GitBranch size={14} className="text-accent-blue" />
            <select
              value={currentBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="bg-transparent font-mono text-xs text-fg focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-canvas text-fg">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewBranchName("");
              setNewBranchError("");
              setIsNewBranchModalOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded border border-border bg-canvas px-2.5 py-1 text-xs text-fg-muted hover:text-fg transition-colors"
            title="Create new branch"
          >
            <Plus size={12} />
            <span>New Branch</span>
          </button>

          <span className="text-fg-subtle">•</span>
          <span>
            {Object.keys(treeData.files || {}).length} file(s)
          </span>
        </div>

        {/* Action buttons: Clone & Upload */}
        <div className="flex items-center gap-2 relative">
          {/* Clone Dropdown Button */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              icon={Terminal}
              onClick={() => setIsCloneOpen(!isCloneOpen)}
              className="font-medium"
            >
              Clone
            </Button>

            {isCloneOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-80 rounded-lg border border-border bg-canvas p-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-semibold text-fg">
                  <span>Clone this repository</span>
                  <button
                    onClick={() => setIsCloneOpen(false)}
                    className="text-fg-muted hover:text-fg"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2 text-xs text-fg-muted">
                  Use your local VGIT CLI to clone:
                </p>
                <div className="mt-2 flex items-center justify-between rounded bg-canvas-subtle p-2 border border-border">
                  <code className="text-xs font-mono text-accent-blue truncate">
                    mygit clone {repoId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`mygit clone ${repoId}`);
                      setCloneCopied(true);
                      setTimeout(() => setCloneCopied(false), 2000);
                    }}
                    className="ml-2 text-fg-muted hover:text-fg"
                    title="Copy command"
                  >
                    {cloneCopied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-fg-subtle space-y-1">
                  <div>1. <code>mygit clone {repoId}</code></div>
                  <div>2. <code>mygit checkout -b fix-bug</code></div>
                  <div>3. <code>mygit push origin fix-bug</code></div>
                </div>
              </div>
            )}
          </div>

          {/* Owner actions */}
          {isOwner && (
            <>
              <Button
                size="sm"
                variant="secondary"
                icon={FilePlus}
                onClick={() => {
                  setUploadFilePath("");
                  setUploadFileContent("");
                  setUploadCommitMsg("");
                  setUploadError("");
                  setIsNewFileModalOpen(true);
                }}
              >
                Create new file
              </Button>

              <Button
                size="sm"
                icon={UploadCloud}
                onClick={() => {
                  setUploadFilePath("");
                  setUploadFileContent("");
                  setUploadCommitMsg("");
                  setUploadError("");
                  setIsUploadModalOpen(true);
                }}
              >
                Upload files
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Selected File Viewer */}
      {selectedFile ? (
        <div className="card-surface mb-6 overflow-hidden">
          {/* File Viewer Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-canvas-subtle px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
              >
                <ArrowLeft size={14} /> Back to files
              </button>
              <span className="text-fg-subtle">|</span>
              <span className="font-mono font-medium text-fg">
                {selectedFile.path}
              </span>
              <span className="text-xs text-fg-subtle">({selectedFile.size})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
              >
                {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>

              <button
                type="button"
                onClick={handleDownloadFile}
                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>

          {/* File Content */}
          <div className="p-4">
            {loadingContent ? (
              <div className="flex items-center justify-center py-12 text-fg-muted">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span>Loading content from storage...</span>
              </div>
            ) : (
              <CodeViewer
                filename={selectedFile.path || selectedFile.name}
                content={fileContent}
              />
            )}
          </div>
        </div>
      ) : treeData.tree.length === 0 ? (
        /* Empty repository state */
        <div className="card-surface p-8 text-center">
          <UploadCloud size={40} className="mx-auto mb-3 text-accent-blue" />
          <h2 className="text-lg font-semibold text-fg">
            This repository is empty
          </h2>
          <p className="mt-1 text-sm text-fg-muted max-w-md mx-auto">
            Get started by creating a new file online or pushing code from your local machine with the VGIT CLI.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            {isOwner && (
              <>
                <Button
                  icon={FilePlus}
                  onClick={() => setIsNewFileModalOpen(true)}
                >
                  Create a new file
                </Button>
                <Button
                  variant="secondary"
                  icon={UploadCloud}
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload files
                </Button>
              </>
            )}
          </div>

          {/* CLI instructions */}
          <div className="mt-8 text-left max-w-xl mx-auto rounded border border-border bg-canvas p-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              <Terminal size={14} /> Push an existing repository from CLI
            </div>
            <pre className="font-mono text-xs text-accent-blue bg-canvas-subtle p-3 rounded overflow-x-auto">
              {`mygit init\nmygit add .\nmygit commit "Initial commit"\nmygit push ${repoId}`}
            </pre>
          </div>
        </div>
      ) : (
        /* File tree */
        <div className="card-surface overflow-hidden">
          {treeData.latestCommit && (
            <div className="border-b border-border bg-canvas-subtle px-4 py-3 text-xs flex items-center justify-between text-fg-muted">
              <div className="flex items-center gap-2">
                <span className="font-medium text-fg">{treeData.latestCommit.author}</span>
                <span className="text-fg-subtle truncate max-w-sm">{treeData.latestCommit.message}</span>
              </div>
              <span className="font-mono text-fg-subtle">
                {treeData.latestCommit.hash?.substring(0, 7)}
              </span>
            </div>
          )}

          <div className="divide-y divide-border/30">
            {renderTree(treeData.tree)}
          </div>
        </div>
      )}

      {/* README Preview (if present and not currently viewing another file) */}
      {!selectedFile && readmeContent && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            <FileText size={14} /> README.md
          </div>
          <CodeViewer
            filename="README.md"
            content={readmeContent}
          />
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-surface w-full max-w-lg p-6 shadow-2xl animate-in fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-fg">
                Upload File to Repository
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">
                  Select File from Computer
                </label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className="input-field cursor-pointer file:mr-4 file:rounded file:border-0 file:bg-accent-blue/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-accent-blue hover:file:bg-accent-blue/20"
                />
              </div>

              <Input
                label="File destination path"
                name="uploadFilePath"
                value={uploadFilePath}
                onChange={(e) => setUploadFilePath(e.target.value)}
                placeholder="e.g. src/index.js or README.md"
                required
              />

              <Input
                label="Commit message"
                name="uploadCommitMsg"
                value={uploadCommitMsg}
                onChange={(e) => setUploadCommitMsg(e.target.value)}
                placeholder="e.g. Upload index.js"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={uploading || !uploadFilePath.trim()}>
                  {uploading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" /> Committing...
                    </span>
                  ) : (
                    "Commit changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New File Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-surface w-full max-w-2xl p-6 shadow-2xl animate-in fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-fg">
                Create New File
              </h2>
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <Input
                label="File Name / Path"
                name="newFilePath"
                value={uploadFilePath}
                onChange={(e) => setUploadFilePath(e.target.value)}
                placeholder="e.g. main.js or docs/guide.md"
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">
                  File Content
                </label>
                <textarea
                  value={uploadFileContent}
                  onChange={(e) => setUploadFileContent(e.target.value)}
                  rows={10}
                  className="input-field font-mono text-xs resize-y"
                  placeholder="// Write your code or markdown here..."
                />
              </div>

              <Input
                label="Commit message"
                name="newFileCommitMsg"
                value={uploadCommitMsg}
                onChange={(e) => setUploadCommitMsg(e.target.value)}
                placeholder={`Create ${uploadFilePath || "new file"}`}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsNewFileModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={uploading || !uploadFilePath.trim()}>
                  {uploading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" /> Committing...
                    </span>
                  ) : (
                    "Commit new file"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Branch Modal */}
      {isNewBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                <GitBranch size={16} className="text-accent-blue" />
                Create a new branch
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBranchModalOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            {newBranchError && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {newBranchError}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <Input
                label="Branch Name"
                name="branchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. fix-issue-1 or feature-navbar"
                required
                autoFocus
              />

              <p className="text-xs text-fg-muted">
                Branch will be branched from: <code className="font-mono text-fg">{currentBranch}</code>
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsNewBranchModalOpen(false)}
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