import crypto from "crypto";
import Repository from "../models/repository.model.js";

import {
  uploadObject,
  getObject,
  objectExists,
  listObjects,
  deleteObjects
} from "./storage.service.js";

import {
  getObjectKey,
  getRefKey,
  getHeadKey,
  getRepositoryPrefix
} from "../utils/repository-storage.js";

// Calculate object hash
export const calculateObjectHash = (content) => {
  return crypto
    .createHash("sha1")
    .update(content)
    .digest("hex");
};


// Upload repository object
export const uploadRepositoryObject = async ({
  repositoryId,
  objectHash,
  content
}) => {
  const buffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content, "utf-8");

  const calculatedHash = calculateObjectHash(buffer);

  if (calculatedHash !== objectHash) {
    throw new Error("Object hash does not match its content.");
  }

  const key = getObjectKey(repositoryId, objectHash);

  await uploadObject({
    key,
    body: buffer,
    contentType: "application/octet-stream"
  });

  return {
    hash: objectHash,
    key
  };
};

// ---------------------------------------
// Download repository object
// ---------------------------------------
export const downloadRepositoryObject = async ({
  repositoryId,
  objectHash
}) => {
  const key = getObjectKey(repositoryId, objectHash);
  const object = await getObject(key);
  return object;
};

export const repositoryObjectExists = async ({
  repositoryId,
  objectHash
}) => {
  const key = getObjectKey(repositoryId, objectHash);
  return objectExists(key);
};

// ---------------------------------------
// Branch ref operations
// ---------------------------------------
export const updateBranchRef = async ({
  repositoryId,
  branch = "main",
  commitHash
}) => {
  const key = getRefKey(repositoryId, branch);

  await uploadObject({
    key,
    body: commitHash,
    contentType: "text/plain"
  });

  return {
    branch,
    commitHash
  };
};

export const getBranchRef = async ({
  repositoryId,
  branch = "main"
}) => {
  const key = getRefKey(repositoryId, branch);

  try {
    const object = await getObject(key);
    const content = await object.Body.transformToString();
    return content.trim();
  } catch (error) {
    if (
      error.name === "NotFound" ||
      error.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }
    throw error;
  }
};

// ---------------------------------------
// Build Tree Helper
// ---------------------------------------
const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

export const buildTreeFromFiles = (files = {}) => {
  const root = [];

  for (const [filePath, fileMeta] of Object.entries(files)) {
    const parts = filePath.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((item) => item.name === part);

      if (!existing) {
        if (isFile) {
          existing = {
            id: fullPath,
            name: part,
            path: fullPath,
            type: "file",
            hash: fileMeta.hash,
            size: formatSize(fileMeta.size)
          };
          currentLevel.push(existing);
        } else {
          existing = {
            id: fullPath,
            name: part,
            path: fullPath,
            type: "folder",
            children: []
          };
          currentLevel.push(existing);
        }
      }

      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: folders first, then files alphabetically
  const sortItems = (items) => {
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      if (item.children) {
        sortItems(item.children);
      }
    }
  };

  sortItems(root);
  return root;
};

// ---------------------------------------
// File upload & Web commit
// ---------------------------------------
export const uploadFileAndCommit = async ({
  repositoryId,
  user,
  filePath,
  content,
  commitMessage,
  branch = "main"
}) => {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error("Repository not found.");
  }

  // Normalize path
  const normalizedPath = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();

  if (!normalizedPath) {
    throw new Error("File path is required.");
  }

  const buffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content, "utf-8");

  const blobHash = calculateObjectHash(buffer);

  // Upload blob to B2
  const blobKey = getObjectKey(repositoryId, blobHash);
  await uploadObject({
    key: blobKey,
    body: buffer,
    contentType: "application/octet-stream"
  });

  // Fetch current branch commit
  let currentCommitHash = await getBranchRef({ repositoryId, branch });
  if (!currentCommitHash && repository.latestCommit) {
    currentCommitHash = repository.latestCommit;
  }

  let files = {};
  if (currentCommitHash) {
    try {
      const commitObj = await downloadRepositoryObject({
        repositoryId,
        objectHash: currentCommitHash
      });
      const commitJson = await commitObj.Body.transformToString();
      const parsedCommit = JSON.parse(commitJson);
      if (parsedCommit.files && typeof parsedCommit.files === "object") {
        files = { ...parsedCommit.files };
      }
    } catch (err) {
      console.warn("Could not load parent commit files:", err.message);
    }
  }

  // Update or insert file
  files[normalizedPath] = {
    hash: blobHash,
    size: buffer.length
  };

  // Create commit object
  const newCommit = {
    type: "commit",
    message: commitMessage || `Upload ${normalizedPath}`,
    timestamp: new Date().toISOString(),
    author: user.username || "Anonymous",
    parent: currentCommitHash || null,
    files
  };

  const commitContent = JSON.stringify(newCommit, null, 2);
  const commitHash = calculateObjectHash(Buffer.from(commitContent, "utf-8"));
  const commitKey = getObjectKey(repositoryId, commitHash);

  await uploadObject({
    key: commitKey,
    body: Buffer.from(commitContent, "utf-8"),
    contentType: "application/json"
  });

  // Update branch ref
  await updateBranchRef({
    repositoryId,
    branch,
    commitHash
  });

  // Update repository latestCommit in DB
  repository.latestCommit = commitHash;
  await repository.save();

  return {
    commitHash,
    blobHash,
    filePath: normalizedPath,
    message: newCommit.message,
    files
  };
};


// Get File Tree for Repository
export const getRepositoryFileTree = async ({
  repositoryId,
  branch = "main"
}) => {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error("Repository not found.");
  }

  let commitHash = await getBranchRef({ repositoryId, branch });
  if (!commitHash && repository.latestCommit) {
    commitHash = repository.latestCommit;
  }

  if (!commitHash) {
    return {
      tree: [],
      files: {},
      latestCommit: null
    };
  }

  try {
    const commitObj = await downloadRepositoryObject({
      repositoryId,
      objectHash: commitHash
    });
    const commitJson = await commitObj.Body.transformToString();
    const commit = JSON.parse(commitJson);
    const files = commit.files || {};
    const tree = buildTreeFromFiles(files);

    return {
      tree,
      files,
      latestCommit: {
        hash: commitHash,
        message: commit.message,
        author: commit.author,
        timestamp: commit.timestamp
      }
    };
  } catch (error) {
    console.error("Error fetching repository file tree:", error.message);
    return {
      tree: [],
      files: {},
      latestCommit: null
    };
  }
};

// ---------------------------------------
// Get Commit History
// ---------------------------------------
export const getRepositoryCommits = async ({
  repositoryId,
  branch = "main",
  limit = 50
}) => {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error("Repository not found.");
  }

  let currentHash = await getBranchRef({ repositoryId, branch });
  if (!currentHash && repository.latestCommit) {
    currentHash = repository.latestCommit;
  }

  const commits = [];
  const visited = new Set();

  while (currentHash && commits.length < limit) {
    if (visited.has(currentHash)) break;
    visited.add(currentHash);

    try {
      const commitObj = await downloadRepositoryObject({
        repositoryId,
        objectHash: currentHash
      });
      const commitJson = await commitObj.Body.transformToString();
      const commit = JSON.parse(commitJson);

      commits.push({
        id: currentHash,
        hash: currentHash,
        message: commit.message,
        author: commit.author || "Developer",
        date: commit.timestamp,
        parent: commit.parent || null
      });

      currentHash = commit.parent;
    } catch (error) {
      console.warn(`Failed reading commit ${currentHash}:`, error.message);
      break;
    }
  }

  return commits;
};