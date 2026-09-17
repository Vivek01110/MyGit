import Repository from "../models/repository.model.js";
import User from "../models/user.model.js";

import {
  createRepository,
  updateRepository,
  deleteRepository,
  getPublicRepositories as fetchPublicRepos
} from "../services/repository.service.js";

import {
  uploadRepositoryObject,
  downloadRepositoryObject,
  repositoryObjectExists,
  updateBranchRef as updateBranchRefInStorage,
  getBranchRef as getBranchRefFromStorage,
  uploadFileAndCommit,
  getRepositoryFileTree,
  getRepositoryCommits
} from "../services/repository-storage.service.js";

// ---------------------------------------
// Create repository
// ---------------------------------------
export const create = async (req, res) => {
  try {
    const { name, description, visibility, language, topics } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Repository name is required."
      });
    }

    const repository = await createRepository({
      name: name.trim(),
      description,
      visibility,
      language,
      topics,
      ownerId: req.userId
    });

    return res.status(201).json({
      repository
    });
  } catch (error) {
    console.error("Create repository error:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a repository with this name."
      });
    }
    return res.status(400).json({
      message: error.message
    });
  }
};

// ---------------------------------------
// Update repository
// ---------------------------------------
export const update = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { name, description, visibility, language, topics } = req.body;

    const repository = await updateRepository({
      repositoryId,
      ownerId: req.userId,
      name,
      description,
      visibility,
      language,
      topics
    });

    return res.status(200).json({
      message: "Repository updated successfully.",
      repository
    });
  } catch (error) {
    console.error("Update repository error:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a repository with this name."
      });
    }
    return res.status(400).json({
      message: error.message
    });
  }
};

// ---------------------------------------
// Delete repository
// ---------------------------------------
export const deleteRepo = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    const repository = await deleteRepository({
      repositoryId,
      ownerId: req.userId
    });

    return res.status(200).json({
      message: "Repository deleted successfully.",
      repositoryId: repository._id
    });
  } catch (error) {
    console.error("Delete repository error:", error.message);
    return res.status(400).json({
      message: error.message
    });
  }
};

// ---------------------------------------
// Explore / Public repositories
// ---------------------------------------
export const getPublicRepos = async (req, res) => {
  try {
    const { search, limit, skip } = req.query;

    const result = await fetchPublicRepos({
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Explore repositories error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch public repositories."
    });
  }
};

// ---------------------------------------
// Get repository details
// ---------------------------------------
export const getRepository = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    const repository = await Repository.findById(repositoryId).populate(
      "owner",
      "username email"
    );

    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    if (
      repository.visibility === "private" &&
      repository.owner._id.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    return res.status(200).json({
      repository
    });
  } catch (error) {
    console.error("Get repository error:", error.message);
    return res.status(500).json({
      message: "Failed to get repository."
    });
  }
};

// ---------------------------------------
// Get user repositories
// ---------------------------------------
export const getUserRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find({
      owner: req.userId
    })
      .populate("owner", "username email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      repositories
    });
  } catch (error) {
    console.error("Get user repositories error:", error.message);
    return res.status(500).json({
      message: "Failed to get user repositories."
    });
  }
};

// ---------------------------------------
// Upload Git Object (CLI)
// ---------------------------------------
export const uploadObject = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { hash, content } = req.body;

    if (!hash) {
      return res.status(400).json({
        message: "Object hash is required."
      });
    }

    if (content === undefined) {
      return res.status(400).json({
        message: "Object content is required."
      });
    }

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const result = await uploadRepositoryObject({
      repositoryId,
      objectHash: hash,
      content
    });

    return res.status(201).json({
      message: "Object uploaded successfully.",
      object: result
    });
  } catch (error) {
    console.error("Upload object error:", error.message);
    return res.status(400).json({
      message: error.message
    });
  }
};

// ---------------------------------------
// Download Git Object
// ---------------------------------------
export const downloadObject = async (req, res) => {
  try {
    const { repositoryId, objectHash } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const object = await downloadRepositoryObject({
      repositoryId,
      objectHash
    });

    const content = await object.Body.transformToString();

    return res.status(200).json({
      hash: objectHash,
      content
    });
  } catch (error) {
    console.error("Download object error:", error.message);
    return res.status(404).json({
      message: "Object not found."
    });
  }
};

// ---------------------------------------
// Check Git Object Exists
// ---------------------------------------
export const checkObjectExists = async (req, res) => {
  try {
    const { repositoryId, objectHash } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const exists = await repositoryObjectExists({
      repositoryId,
      objectHash
    });

    return res.status(200).json({
      exists
    });
  } catch (error) {
    console.error("Check object error:", error.message);
    return res.status(500).json({
      message: "Failed to check object."
    });
  }
};

// ---------------------------------------
// Get Branch Ref
// ---------------------------------------
export const getBranchRef = async (req, res) => {
  try {
    const { repositoryId, branch = "main" } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const commitHash = await getBranchRefFromStorage({
      repositoryId,
      branch
    });

    return res.status(200).json({
      branch,
      commitHash: commitHash || repository.latestCommit || null
    });
  } catch (error) {
    console.error("Get branch ref error:", error.message);
    return res.status(500).json({
      message: "Failed to get branch ref."
    });
  }
};

// ---------------------------------------
// Update Branch Ref
// ---------------------------------------
export const updateBranchRef = async (req, res) => {
  try {
    const { repositoryId, branch = "main" } = req.params;
    const { commitHash } = req.body;

    if (!commitHash) {
      return res.status(400).json({
        message: "commitHash is required."
      });
    }

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    const isOwner = repository.owner.toString() === req.userId;
    const defaultBranch = repository.defaultBranch || "main";
    const isDefaultBranch = branch === defaultBranch || branch === "main";

    if (repository.visibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    // Direct push to default branch (main) is restricted to the repository owner
    if (isDefaultBranch && !isOwner) {
      return res.status(403).json({
        message: `Direct push to default branch '${branch}' is restricted. Please push to a feature branch and open a Pull Request.`
      });
    }

    const exists = await repositoryObjectExists({
      repositoryId,
      objectHash: commitHash
    });

    if (!exists) {
      return res.status(400).json({
        message: "Commit object does not exist on remote."
      });
    }

    await updateBranchRefInStorage({
      repositoryId,
      branch,
      commitHash
    });

    // Only update repository.latestCommit if updating the default branch
    if (isDefaultBranch) {
      repository.latestCommit = commitHash;
      await repository.save();
    }

    return res.status(200).json({
      message: "Branch ref updated successfully.",
      branch,
      commitHash
    });
  } catch (error) {
    console.error("Update branch ref error:", error.message);
    return res.status(500).json({
      message: "Failed to update branch ref."
    });
  }
};

// ---------------------------------------
// Web UI: Get File Tree
// ---------------------------------------
export const getFileTree = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { branch = "main" } = req.query;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const treeData = await getRepositoryFileTree({ repositoryId, branch });

    return res.status(200).json(treeData);
  } catch (error) {
    console.error("Get file tree error:", error.message);
    return res.status(500).json({
      message: "Failed to load file tree."
    });
  }
};

// ---------------------------------------
// Web UI: Get File Content (Blob)
// ---------------------------------------
export const getFileContent = async (req, res) => {
  try {
    const { repositoryId, blobHash } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const object = await downloadRepositoryObject({
      repositoryId,
      objectHash: blobHash
    });

    const content = await object.Body.transformToString();

    return res.status(200).json({
      hash: blobHash,
      content
    });
  } catch (error) {
    console.error("Get file content error:", error.message);
    return res.status(404).json({
      message: "File not found or could not be loaded."
    });
  }
};


// Web UI: Upload File & Commit
export const uploadFile = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { filePath, content, commitMessage, branch = "main" } = req.body;

    if (!filePath || !filePath.trim()) {
      return res.status(400).json({ message: "File path is required." });
    }

    if (content === undefined) {
      return res.status(400).json({ message: "File content is required." });
    }

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({
        message: "Repository not found."
      });
    }

    const isOwner = repository.owner.toString() === req.userId;
    const defaultBranch = repository.defaultBranch || "main";
    const isDefaultBranch = branch === defaultBranch || branch === "main";

    if (repository.visibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    if (isDefaultBranch && !isOwner) {
      return res.status(403).json({
        message: `Direct commit to default branch '${branch}' is restricted. Please create a feature branch and open a Pull Request.`
      });
    }

    const user = await User.findById(req.userId);

    const result = await uploadFileAndCommit({
      repositoryId,
      user: { username: user?.username || "Developer" },
      filePath,
      content,
      commitMessage,
      branch
    });

    return res.status(201).json({
      message: "File uploaded and committed successfully.",
      result
    });
  } catch (error) {
    console.error("Upload file error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to upload file."
    });
  }
};

// ---------------------------------------
// Web UI: Get Commits
// ---------------------------------------
export const getCommits = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { branch = "main", limit = 50 } = req.query;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const commits = await getRepositoryCommits({
      repositoryId,
      branch,
      limit: parseInt(limit, 10) || 50
    });

    return res.status(200).json({
      commits
    });
  } catch (error) {
    console.error("Get commits error:", error.message);
    return res.status(500).json({
      message: "Failed to get commits."
    });
  }
};

// ---------------------------------------
// List Branches
// ---------------------------------------
export const listBranches = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const { listObjects } = await import("../services/storage.service.js");
    const prefix = `repositories/${repositoryId}/refs/heads/`;
    const objects = await listObjects(prefix);

    const branches = objects
      .map((obj) => obj.Key.replace(prefix, "").trim())
      .filter(Boolean);

    const defaultBranch = repository.defaultBranch || "main";
    if (!branches.includes(defaultBranch)) {
      branches.unshift(defaultBranch);
    }

    return res.status(200).json({
      branches,
      defaultBranch
    });
  } catch (error) {
    console.error("List branches error:", error.message);
    return res.status(500).json({ message: "Failed to list branches." });
  }
};

// ---------------------------------------
// Create Branch
// ---------------------------------------
export const createBranch = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { branchName, fromBranch = "main" } = req.body;

    if (!branchName || !branchName.trim()) {
      return res.status(400).json({ message: "Branch name is required." });
    }

    const cleanBranch = branchName.trim().replace(/\s+/g, "-");

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    if (
      repository.visibility === "private" &&
      repository.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You do not have access to this repository."
      });
    }

    const commitHash =
      (await getBranchRefFromStorage({
        repositoryId,
        branch: fromBranch
      })) || repository.latestCommit;

    if (!commitHash) {
      return res.status(400).json({
        message: `Cannot branch from '${fromBranch}' because it has no commits yet.`
      });
    }

    await updateBranchRefInStorage({
      repositoryId,
      branch: cleanBranch,
      commitHash
    });

    return res.status(201).json({
      message: `Branch '${cleanBranch}' created successfully.`,
      branchName: cleanBranch,
      commitHash
    });
  } catch (error) {
    console.error("Create branch error:", error.message);
    return res.status(500).json({ message: "Failed to create branch." });
  }
};