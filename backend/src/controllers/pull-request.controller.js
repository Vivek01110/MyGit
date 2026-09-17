import PullRequest from "../models/pull-request.model.js";
import Repository from "../models/repository.model.js";
import Issue from "../models/issue.model.js";
import User from "../models/user.model.js";
import {
  getBranchRef as getBranchRefFromStorage,
  uploadRepositoryObject,
  downloadRepositoryObject
} from "../services/repository-storage.service.js";
import {
  checkMergeability,
  executeMerge,
  loadCommit,
  generateFileDiffs,
  getPRCommits
} from "../services/merge.service.js";
import crypto from "crypto";
import { uploadObject } from "../services/storage.service.js";
import { getObjectKey } from "../utils/repository-storage.js";

// Helper: check access
const checkRepoAccess = async (repositoryId, userId) => {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    return { error: { status: 404, message: "Repository not found." } };
  }

  if (repository.visibility === "private" && repository.owner.toString() !== userId) {
    return { error: { status: 403, message: "You do not have access to this repository." } };
  }

  return { repository };
};

// ---------------------------------------
// Create Pull Request
// ---------------------------------------
export const createPullRequest = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const {
      title,
      description,
      sourceBranch,
      targetBranch = "main",
      linkedIssueId
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Pull request title is required." });
    }
    if (!sourceBranch || !sourceBranch.trim()) {
      return res.status(400).json({ message: "Source branch is required." });
    }

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (sourceBranch === targetBranch) {
      return res.status(400).json({
        message: "Source and target branches must be different."
      });
    }

    // Get current commits on both branches
    const [sourceCommit, targetCommit] = await Promise.all([
      getBranchRefFromStorage({ repositoryId, branch: sourceBranch }),
      getBranchRefFromStorage({ repositoryId, branch: targetBranch })
    ]);

    const actualTargetCommit = targetCommit || repository.latestCommit;

    if (!sourceCommit) {
      return res.status(400).json({
        message: `Source branch '${sourceBranch}' does not exist or has no commits.`
      });
    }
    if (!actualTargetCommit) {
      return res.status(400).json({
        message: `Target branch '${targetBranch}' does not exist or has no commits.`
      });
    }

    // Run merge analysis
    const mergeAnalysis = await checkMergeability({
      repositoryId,
      sourceCommitHash: sourceCommit,
      targetCommitHash: actualTargetCommit,
      sourceBranch,
      targetBranch
    });

    // Auto-increment number
    const lastPR = await PullRequest.findOne({ repository: repositoryId }).sort({ number: -1 });
    const number = lastPR ? lastPR.number + 1 : 1;

    // Validate linked issue if provided
    let validIssueId = null;
    if (linkedIssueId) {
      const issue = await Issue.findOne({
        _id: linkedIssueId,
        repository: repositoryId
      });
      if (issue) {
        validIssueId = issue._id;
      }
    }

    const pr = await PullRequest.create({
      repository: repositoryId,
      number,
      title: title.trim(),
      description: description ? description.trim() : "",
      sourceBranch: sourceBranch.trim(),
      targetBranch: targetBranch.trim(),
      author: req.userId,
      linkedIssue: validIssueId,
      headCommit: sourceCommit,
      baseCommit: actualTargetCommit,
      hasConflicts: mergeAnalysis.hasConflicts,
      conflictingFiles: mergeAnalysis.conflictingFiles.map((f) => f.filePath)
    });

    await pr.populate("author", "username email");
    if (pr.linkedIssue) {
      await pr.populate("linkedIssue", "number title status");
    }

    return res.status(201).json({
      message: "Pull request created successfully.",
      pr,
      mergeAnalysis
    });
  } catch (error) {
    console.error("Create PR error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to create pull request."
    });
  }
};

// ---------------------------------------
// Get Pull Requests
// ---------------------------------------
export const getPullRequests = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { status } = req.query;

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const filter = { repository: repositoryId };
    if (status && ["open", "merged", "closed"].includes(status)) {
      filter.status = status;
    }

    const pullRequests = await PullRequest.find(filter)
      .populate("author", "username email")
      .populate("linkedIssue", "number title status")
      .sort({ createdAt: -1 });

    const openCount = await PullRequest.countDocuments({ repository: repositoryId, status: "open" });
    const mergedCount = await PullRequest.countDocuments({ repository: repositoryId, status: "merged" });
    const closedCount = await PullRequest.countDocuments({ repository: repositoryId, status: "closed" });

    return res.status(200).json({
      pullRequests,
      openCount,
      mergedCount,
      closedCount,
      totalCount: openCount + mergedCount + closedCount
    });
  } catch (error) {
    console.error("Get pull requests error:", error.message);
    return res.status(500).json({ message: "Failed to fetch pull requests." });
  }
};

// ---------------------------------------
// Get Pull Request Details
// ---------------------------------------
export const getPullRequestById = async (req, res) => {
  try {
    const { repositoryId, prId } = req.params;

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const query = { repository: repositoryId };
    if (prId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = prId;
    } else {
      query.number = Number(prId);
    }

    const pr = await PullRequest.findOne(query)
      .populate("author", "username email")
      .populate("linkedIssue", "number title status")
      .populate("comments.author", "username email");

    if (!pr) {
      return res.status(404).json({ message: "Pull request not found." });
    }

    // Resolve source & target commits
    let sourceCommit = pr.headCommit;
    let targetCommit = pr.baseCommit || repository.latestCommit;

    // Dynamic mergeability check if open
    let mergeAnalysis = null;
    if (pr.status === "open") {
      const [currentSourceCommit, currentTargetCommit] = await Promise.all([
        getBranchRefFromStorage({ repositoryId, branch: pr.sourceBranch }),
        getBranchRefFromStorage({ repositoryId, branch: pr.targetBranch })
      ]);

      if (currentSourceCommit) sourceCommit = currentSourceCommit;
      if (currentTargetCommit) targetCommit = currentTargetCommit;

      if (sourceCommit && targetCommit) {
        mergeAnalysis = await checkMergeability({
          repositoryId,
          sourceCommitHash: sourceCommit,
          targetCommitHash: targetCommit,
          sourceBranch: pr.sourceBranch,
          targetBranch: pr.targetBranch
        });

        // Sync with DB
        pr.hasConflicts = mergeAnalysis.hasConflicts;
        pr.conflictingFiles = mergeAnalysis.conflictingFiles.map((f) => f.filePath);
        await pr.save();
      }
    }

    // Compute detailed file diffs & commits for code review
    const [diffData, commits] = await Promise.all([
      sourceCommit && targetCommit
        ? generateFileDiffs({
            repositoryId,
            sourceCommitHash: sourceCommit,
            targetCommitHash: targetCommit
          })
        : Promise.resolve({ files: [], totalAdditions: 0, totalDeletions: 0, filesCount: 0 }),
      sourceCommit && targetCommit
        ? getPRCommits({
            repositoryId,
            sourceCommitHash: sourceCommit,
            targetCommitHash: targetCommit
          })
        : Promise.resolve([])
    ]);

    return res.status(200).json({
      pr,
      mergeAnalysis,
      filesChanged: diffData.files || [],
      diffStats: {
        totalAdditions: diffData.totalAdditions || 0,
        totalDeletions: diffData.totalDeletions || 0,
        filesCount: diffData.filesCount || 0
      },
      commits: commits || []
    });
  } catch (error) {
    console.error("Get PR by id error:", error.message);
    return res.status(500).json({ message: "Failed to get pull request." });
  }
};

// ---------------------------------------
// Merge Pull Request
// ---------------------------------------
export const mergePullRequest = async (req, res) => {
  try {
    const { repositoryId, prId } = req.params;
    const { commitMessage } = req.body;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    // Only repository owner can merge
    if (repository.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "Only the repository owner can merge pull requests."
      });
    }

    const query = { repository: repositoryId };
    if (prId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = prId;
    } else {
      query.number = Number(prId);
    }

    const pr = await PullRequest.findOne(query);
    if (!pr) {
      return res.status(404).json({ message: "Pull request not found." });
    }

    if (pr.status !== "open") {
      return res.status(400).json({
        message: `This pull request is already ${pr.status}.`
      });
    }

    const [sourceCommit, targetCommit] = await Promise.all([
      getBranchRefFromStorage({ repositoryId, branch: pr.sourceBranch }),
      getBranchRefFromStorage({ repositoryId, branch: pr.targetBranch })
    ]);

    const actualTarget = targetCommit || repository.latestCommit;
    const actualSource = sourceCommit || pr.headCommit;

    // Check mergeability
    const mergeAnalysis = await checkMergeability({
      repositoryId,
      sourceCommitHash: actualSource,
      targetCommitHash: actualTarget,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch
    });

    if (mergeAnalysis.hasConflicts) {
      return res.status(400).json({
        message: "Cannot merge automatically. Merge conflicts must be resolved first.",
        conflictingFiles: mergeAnalysis.conflictingFiles
      });
    }

    const user = await User.findById(req.userId);

    // Execute merge commit
    const mergeResult = await executeMerge({
      repositoryId,
      user: { username: user?.username || "Maintainer" },
      sourceCommitHash: actualSource,
      targetCommitHash: actualTarget,
      mergedFiles: mergeAnalysis.mergedFiles,
      commitMessage: commitMessage || `Merge pull request #${pr.number} from ${pr.sourceBranch}`,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch
    });

    // Update PR status
    pr.status = "merged";
    pr.mergeCommit = mergeResult.mergeCommitHash;
    pr.comments.push({
      author: req.userId,
      body: `Merged pull request into \`${pr.targetBranch}\` with commit \`${mergeResult.mergeCommitHash.substring(0, 7)}\`.`,
      createdAt: new Date()
    });
    await pr.save();

    // AUTO-RESOLVE LINKED ISSUE
    if (pr.linkedIssue) {
      const issue = await Issue.findById(pr.linkedIssue);
      if (issue && issue.status !== "closed") {
        issue.status = "closed";
        issue.comments.push({
          author: req.userId,
          body: `Closed via Pull Request #${pr.number} (${pr.title}).`,
          createdAt: new Date()
        });
        await issue.save();
      }
    }

    await pr.populate("author", "username email");
    await pr.populate("linkedIssue", "number title status");

    return res.status(200).json({
      message: "Pull request merged successfully.",
      pr,
      mergeResult
    });
  } catch (error) {
    console.error("Merge pull request error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to merge pull request."
    });
  }
};

// ---------------------------------------
// Close Pull Request (Without Merging)
// ---------------------------------------
export const closePullRequest = async (req, res) => {
  try {
    const { repositoryId, prId } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    const query = { repository: repositoryId };
    if (prId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = prId;
    } else {
      query.number = Number(prId);
    }

    const pr = await PullRequest.findOne(query);
    if (!pr) {
      return res.status(404).json({ message: "Pull request not found." });
    }

    const isAuthor = pr.author.toString() === req.userId;
    const isRepoOwner = repository.owner.toString() === req.userId;

    if (!isAuthor && !isRepoOwner) {
      return res.status(403).json({
        message: "You do not have permission to close this pull request."
      });
    }

    pr.status = "closed";
    pr.comments.push({
      author: req.userId,
      body: "Closed this pull request without merging.",
      createdAt: new Date()
    });
    await pr.save();

    await pr.populate("author", "username email");
    await pr.populate("linkedIssue", "number title status");

    return res.status(200).json({
      message: "Pull request closed.",
      pr
    });
  } catch (error) {
    console.error("Close PR error:", error.message);
    return res.status(500).json({ message: "Failed to close pull request." });
  }
};

// ---------------------------------------
// Resolve Conflicts Online
// ---------------------------------------
export const resolveConflicts = async (req, res) => {
  try {
    const { repositoryId, prId } = req.params;
    const { resolvedFiles, commitMessage } = req.body; // { "src/App.jsx": "resolved content string" }

    if (!resolvedFiles || typeof resolvedFiles !== "object") {
      return res.status(400).json({ message: "Resolved files object is required." });
    }

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    const query = { repository: repositoryId };
    if (prId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = prId;
    } else {
      query.number = Number(prId);
    }

    const pr = await PullRequest.findOne(query);
    if (!pr || pr.status !== "open") {
      return res.status(400).json({ message: "Open pull request not found." });
    }

    // Load source commit files
    const [sourceCommitHash, targetCommitHash] = await Promise.all([
      getBranchRefFromStorage({ repositoryId, branch: pr.sourceBranch }),
      getBranchRefFromStorage({ repositoryId, branch: pr.targetBranch })
    ]);
    const sourceCommit = await loadCommit(repositoryId, sourceCommitHash);
    const targetCommit = await loadCommit(repositoryId, targetCommitHash || repository.latestCommit);

    const updatedFiles = {
      ...(targetCommit?.files || {}),
      ...(sourceCommit?.files || {})
    };

    // Write resolved blobs
    for (const [filePath, content] of Object.entries(resolvedFiles)) {
      const buffer = Buffer.from(content, "utf-8");
      const blobHash = crypto.createHash("sha1").update(buffer).digest("hex");
      const blobKey = getObjectKey(repositoryId, blobHash);

      await uploadObject({
        key: blobKey,
        body: buffer,
        contentType: "application/octet-stream"
      });

      updatedFiles[filePath] = {
        hash: blobHash,
        size: buffer.length
      };
    }

    const user = await User.findById(req.userId);

    // Create commit on source branch with resolved files and mergeParent pointing to target
    const newCommit = {
      type: "commit",
      message: commitMessage || `Resolve merge conflicts in ${Object.keys(resolvedFiles).join(", ")}`,
      timestamp: new Date().toISOString(),
      author: user?.username || "Developer",
      parent: sourceCommitHash,
      mergeParent: targetCommitHash || repository.latestCommit,
      files: updatedFiles
    };

    const commitContent = JSON.stringify(newCommit, null, 2);
    const commitHash = crypto.createHash("sha1").update(Buffer.from(commitContent, "utf-8")).digest("hex");
    const commitKey = getObjectKey(repositoryId, commitHash);

    await uploadObject({
      key: commitKey,
      body: Buffer.from(commitContent, "utf-8"),
      contentType: "application/json"
    });

    // Update source branch ref
    const { updateBranchRef } = await import("../services/repository-storage.service.js");
    await updateBranchRef({
      repositoryId,
      branch: pr.sourceBranch,
      commitHash
    });

    // Update PR headCommit
    pr.headCommit = commitHash;
    pr.hasConflicts = false;
    pr.conflictingFiles = [];
    pr.comments.push({
      author: req.userId,
      body: `Resolved merge conflicts with commit \`${commitHash.substring(0, 7)}\`.`,
      createdAt: new Date()
    });
    await pr.save();

    return res.status(200).json({
      message: "Conflicts resolved successfully. Pull request is now ready to merge.",
      pr
    });
  } catch (error) {
    console.error("Resolve conflicts error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to resolve conflicts."
    });
  }
};

// ---------------------------------------
// Add Comment to PR
// ---------------------------------------
export const addComment = async (req, res) => {
  try {
    const { repositoryId, prId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required." });
    }

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const query = { repository: repositoryId };
    if (prId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = prId;
    } else {
      query.number = Number(prId);
    }

    const pr = await PullRequest.findOne(query);
    if (!pr) {
      return res.status(404).json({ message: "Pull request not found." });
    }

    pr.comments.push({
      author: req.userId,
      body: body.trim(),
      createdAt: new Date()
    });

    await pr.save();
    await pr.populate("author", "username email");
    await pr.populate("comments.author", "username email");

    const newComment = pr.comments[pr.comments.length - 1];

    return res.status(201).json({
      message: "Comment added.",
      comment: newComment,
      pr
    });
  } catch (error) {
    console.error("Add PR comment error:", error.message);
    return res.status(500).json({ message: "Failed to add comment." });
  }
};
