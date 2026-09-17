import crypto from "crypto";
import Repository from "../models/repository.model.js";
import {
  getObject,
  uploadObject
} from "./storage.service.js";
import {
  getObjectKey,
  getRefKey
} from "../utils/repository-storage.js";
import {
  downloadRepositoryObject,
  updateBranchRef
} from "./repository-storage.service.js";

// Helper: load commit JSON from database
export const loadCommit = async (repositoryId, commitHash) => {
  if (!commitHash) return null;
  try {
    const object = await downloadRepositoryObject({
      repositoryId,
      objectHash: commitHash
    });
    const content = await object.Body.transformToString();
    return JSON.parse(content);
  } catch (err) {
    console.warn(`Could not load commit ${commitHash}:`, err.message);
    return null;
  }
};

// Helper: load blob content as string
export const loadBlobContent = async (repositoryId, blobHash) => {
  if (!blobHash) return "";
  try {
    const object = await downloadRepositoryObject({
      repositoryId,
      objectHash: blobHash
    });
    return await object.Body.transformToString();
  } catch (err) {
    return "";
  }
};

// Helper: find common ancestor commit using BFS traversal
export const findCommonAncestor = async (repositoryId, hashA, hashB) => {
  if (!hashA || !hashB) return null;
  if (hashA === hashB) return hashA;

  const ancestorsA = new Set();
  const queueA = [hashA];
  const visitedA = new Set();

  while (queueA.length > 0 && ancestorsA.size < 200) {
    const curr = queueA.shift();
    if (!curr || visitedA.has(curr)) continue;
    visitedA.add(curr);
    ancestorsA.add(curr);

    const c = await loadCommit(repositoryId, curr);
    if (c?.parent) queueA.push(c.parent);
    if (c?.mergeParent) queueA.push(c.mergeParent);
  }

  const queueB = [hashB];
  const visitedB = new Set();

  while (queueB.length > 0) {
    const curr = queueB.shift();
    if (!curr || visitedB.has(curr)) continue;
    visitedB.add(curr);

    if (ancestorsA.has(curr)) {
      return curr;
    }

    const c = await loadCommit(repositoryId, curr);
    if (c?.parent) queueB.push(c.parent);
    if (c?.mergeParent) queueB.push(c.mergeParent);
  }

  return null;
};

// ---------------------------------------
// 3-Way Merge Check & Conflict Detection
// ---------------------------------------
export const checkMergeability = async ({
  repositoryId,
  sourceCommitHash,
  targetCommitHash,
  baseCommitHash = null,
  sourceBranch = "feature",
  targetBranch = "main"
}) => {
  const sourceCommit = await loadCommit(repositoryId, sourceCommitHash);
  const targetCommit = await loadCommit(repositoryId, targetCommitHash);

  if (!sourceCommit) {
    throw new Error("Source commit not found.");
  }
  if (!targetCommit) {
    throw new Error("Target commit not found.");
  }

  const commonBaseHash =
    baseCommitHash ||
    (await findCommonAncestor(repositoryId, sourceCommitHash, targetCommitHash));

  const baseCommit = commonBaseHash
    ? await loadCommit(repositoryId, commonBaseHash)
    : null;

  const srcFiles = sourceCommit.files || {};
  const tgtFiles = targetCommit.files || {};
  const baseFiles = baseCommit?.files || {};

  const allPaths = new Set([
    ...Object.keys(srcFiles),
    ...Object.keys(tgtFiles)
  ]);

  const mergedFiles = {};
  const conflictingFiles = [];
  const diffSummary = {
    added: [],
    modified: [],
    deleted: []
  };

  for (const filePath of allPaths) {
    const srcBlob = srcFiles[filePath];
    const tgtBlob = tgtFiles[filePath];
    const baseBlob = baseFiles[filePath];

    // Case 1: File is identical in both source and target
    if (srcBlob && tgtBlob && srcBlob.hash === tgtBlob.hash) {
      mergedFiles[filePath] = { ...tgtBlob };
      continue;
    }

    // Case 2: File exists only in source
    if (srcBlob && !tgtBlob) {
      if (!baseBlob) {
        // Newly added in source
        mergedFiles[filePath] = { ...srcBlob };
        diffSummary.added.push(filePath);
      } else {
        // Was in base, deleted in target, kept in source
        diffSummary.modified.push(filePath);
        mergedFiles[filePath] = { ...srcBlob };
      }
      continue;
    }

    // Case 3: File exists only in target
    if (tgtBlob && !srcBlob) {
      if (!baseBlob) {
        // Newly added in target
        mergedFiles[filePath] = { ...tgtBlob };
      } else {
        // Deleted in source
        diffSummary.deleted.push(filePath);
        // Do not add to mergedFiles (clean deletion)
      }
      continue;
    }

    // Case 4: File exists in both but hashes differ
    if (srcBlob && tgtBlob && srcBlob.hash !== tgtBlob.hash) {
      // Check if target matches base (source made changes)
      if (baseBlob && tgtBlob.hash === baseBlob.hash) {
        mergedFiles[filePath] = { ...srcBlob };
        diffSummary.modified.push(filePath);
        continue;
      }

      // Check if source matches base (target made changes)
      if (baseBlob && srcBlob.hash === baseBlob.hash) {
        mergedFiles[filePath] = { ...tgtBlob };
        continue;
      }

      // Both modified relative to base (or no base) -> check actual text content
      const [srcContent, tgtContent] = await Promise.all([
        loadBlobContent(repositoryId, srcBlob.hash),
        loadBlobContent(repositoryId, tgtBlob.hash)
      ]);

      if (srcContent === tgtContent) {
        mergedFiles[filePath] = { ...srcBlob };
        continue;
      }

      // Conflict detected! Generate standard Git conflict markers
      const conflictText = [
        `<<<<<<< target (${targetBranch})`,
        tgtContent,
        `=======`,
        srcContent,
        `>>>>>>> source (${sourceBranch})`
      ].join("\n");

      conflictingFiles.push({
        filePath,
        targetHash: tgtBlob.hash,
        sourceHash: srcBlob.hash,
        targetContent: tgtContent,
        sourceContent: srcContent,
        conflictMarkerText: conflictText
      });

      diffSummary.modified.push(filePath);
    }
  }

  const hasConflicts = conflictingFiles.length > 0;

  return {
    canMerge: !hasConflicts,
    hasConflicts,
    conflictingFiles,
    mergedFiles: hasConflicts ? null : mergedFiles,
    diffSummary
  };
};

// ---------------------------------------
// Execute Merge & Create Merge Commit
// ---------------------------------------
export const executeMerge = async ({
  repositoryId,
  user,
  sourceCommitHash,
  targetCommitHash,
  mergedFiles,
  commitMessage,
  sourceBranch = "feature",
  targetBranch = "main"
}) => {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error("Repository not found.");
  }

  const newCommit = {
    type: "commit",
    message: commitMessage || `Merge branch '${sourceBranch}' into ${targetBranch}`,
    timestamp: new Date().toISOString(),
    author: user.username || "Developer",
    parent: targetCommitHash,
    mergeParent: sourceCommitHash,
    files: mergedFiles
  };

  const commitContent = JSON.stringify(newCommit, null, 2);
  const commitBuffer = Buffer.from(commitContent, "utf-8");
  const commitHash = crypto
    .createHash("sha1")
    .update(commitBuffer)
    .digest("hex");

  const commitKey = getObjectKey(repositoryId, commitHash);

  await uploadObject({
    key: commitKey,
    body: commitBuffer,
    contentType: "application/json"
  });

  // Update target branch ref
  await updateBranchRef({
    repositoryId,
    branch: targetBranch,
    commitHash
  });

  // Update repository latestCommit in MongoDB
  repository.latestCommit = commitHash;
  await repository.save();

  return {
    mergeCommitHash: commitHash,
    message: newCommit.message,
    files: mergedFiles
  };
};

// ---------------------------------------
// Detailed File Diffs for Code Review
// ---------------------------------------
export const generateFileDiffs = async ({
  repositoryId,
  sourceCommitHash,
  targetCommitHash
}) => {
  const [sourceCommit, targetCommit] = await Promise.all([
    loadCommit(repositoryId, sourceCommitHash),
    loadCommit(repositoryId, targetCommitHash)
  ]);

  if (!sourceCommit && !targetCommit) {
    return { files: [], totalAdditions: 0, totalDeletions: 0, filesCount: 0 };
  }

  const srcFiles = sourceCommit?.files || {};
  const tgtFiles = targetCommit?.files || {};

  const allPaths = Array.from(
    new Set([...Object.keys(srcFiles), ...Object.keys(tgtFiles)])
  ).sort();

  const files = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const filePath of allPaths) {
    const srcBlob = srcFiles[filePath];
    const tgtBlob = tgtFiles[filePath];

    // If identical hashes, no changes
    if (srcBlob && tgtBlob && srcBlob.hash === tgtBlob.hash) {
      continue;
    }

    let status = "modified";
    let oldContent = "";
    let newContent = "";

    if (!tgtBlob && srcBlob) {
      status = "added";
      newContent = await loadBlobContent(repositoryId, srcBlob.hash);
    } else if (tgtBlob && !srcBlob) {
      status = "deleted";
      oldContent = await loadBlobContent(repositoryId, tgtBlob.hash);
    } else {
      status = "modified";
      const [oldText, newText] = await Promise.all([
        loadBlobContent(repositoryId, tgtBlob.hash),
        loadBlobContent(repositoryId, srcBlob.hash)
      ]);
      oldContent = oldText;
      newContent = newText;
    }

    // Line additions and deletions calculation
    const oldLines = oldContent ? oldContent.split("\n") : [];
    const newLines = newContent ? newContent.split("\n") : [];

    let additions = 0;
    let deletions = 0;

    if (status === "added") {
      additions = newLines.length;
    } else if (status === "deleted") {
      deletions = oldLines.length;
    } else {
      const oldSet = new Set(oldLines);
      const newSet = new Set(newLines);
      additions = newLines.filter((l) => !oldSet.has(l)).length;
      deletions = oldLines.filter((l) => !newSet.has(l)).length;
      if (additions === 0 && deletions === 0 && oldContent !== newContent) {
        additions = 1;
        deletions = 1;
      }
    }

    totalAdditions += additions;
    totalDeletions += deletions;

    files.push({
      filePath,
      status,
      oldContent,
      newContent,
      oldHash: tgtBlob?.hash || null,
      newHash: srcBlob?.hash || null,
      additions,
      deletions
    });
  }

  return {
    files,
    totalAdditions,
    totalDeletions,
    filesCount: files.length
  };
};

// ---------------------------------------
// Get Commits Belonging to PR
// ---------------------------------------
export const getPRCommits = async ({
  repositoryId,
  sourceCommitHash,
  targetCommitHash
}) => {
  if (!sourceCommitHash) return [];

  const commonBase = await findCommonAncestor(repositoryId, sourceCommitHash, targetCommitHash);
  const stopHashes = new Set([targetCommitHash, commonBase].filter(Boolean));

  const commits = [];
  const visited = new Set();
  const queue = [sourceCommitHash];

  while (queue.length > 0 && commits.length < 50) {
    const currentHash = queue.shift();
    if (!currentHash || visited.has(currentHash)) continue;
    visited.add(currentHash);

    if (stopHashes.has(currentHash)) {
      continue;
    }

    const commitObj = await loadCommit(repositoryId, currentHash);
    if (!commitObj) continue;

    commits.push({
      hash: currentHash,
      message: commitObj.message || "Commit",
      author: commitObj.author || "Developer",
      timestamp: commitObj.timestamp || new Date().toISOString(),
      parent: commitObj.parent || null
    });

    if (commitObj.parent && !stopHashes.has(commitObj.parent)) {
      queue.push(commitObj.parent);
    }
    if (commitObj.mergeParent && !stopHashes.has(commitObj.mergeParent)) {
      queue.push(commitObj.mergeParent);
    }
  }

  return commits;
};
