import express from "express";

import {
  create,
  update,
  deleteRepo,
  getPublicRepos,
  getRepository,
  getUserRepositories,
  uploadObject,
  downloadObject,
  checkObjectExists,
  getBranchRef,
  updateBranchRef,
  getFileTree,
  getFileContent,
  uploadFile,
  getCommits,
  listBranches,
  createBranch
} from "../controllers/repository.controller.js";

import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  addComment
} from "../controllers/issue.controller.js";

import {
  createPullRequest,
  getPullRequests,
  getPullRequestById,
  mergePullRequest,
  closePullRequest,
  resolveConflicts,
  addComment as addPrComment
} from "../controllers/pull-request.controller.js";

import {
  authenticate,
  optionalAuthenticate
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Explore public repositories (Must be before /:repositoryId)
router.get("/explore", optionalAuthenticate, getPublicRepos);

// Repository metadata & listing
router.post("/", authenticate, create);
router.get("/", authenticate, getUserRepositories);
router.get("/:repositoryId", optionalAuthenticate, getRepository);
router.put("/:repositoryId", authenticate, update);
router.delete("/:repositoryId", authenticate, deleteRepo);

// Branch Management
router.get("/:repositoryId/branches", optionalAuthenticate, listBranches);
router.post("/:repositoryId/branches", authenticate, createBranch);

// Branch refs
router.get("/:repositoryId/main", optionalAuthenticate, (req, res) => {
  req.params.branch = "main";
  return getBranchRef(req, res);
});

router.put("/:repositoryId/main", authenticate, (req, res) => {
  req.params.branch = "main";
  return updateBranchRef(req, res);
});

router.get("/:repositoryId/refs/:branch", optionalAuthenticate, getBranchRef);
router.put("/:repositoryId/refs/:branch", authenticate, updateBranchRef);

// Git objects (CLI)
router.post("/:repositoryId/objects", authenticate, uploadObject);
router.get("/:repositoryId/objects/:objectHash", optionalAuthenticate, downloadObject);
router.head("/:repositoryId/objects/:objectHash", optionalAuthenticate, checkObjectExists);

// Web UI Files & Commits
router.get("/:repositoryId/tree", optionalAuthenticate, getFileTree);
router.get("/:repositoryId/blob/:blobHash", optionalAuthenticate, getFileContent);
router.post("/:repositoryId/files", authenticate, uploadFile);
router.get("/:repositoryId/commits", optionalAuthenticate, getCommits);

// Issues
router.post("/:repositoryId/issues", authenticate, createIssue);
router.get("/:repositoryId/issues", optionalAuthenticate, getIssues);
router.get("/:repositoryId/issues/:issueId", optionalAuthenticate, getIssueById);
router.put("/:repositoryId/issues/:issueId", authenticate, updateIssue);
router.delete("/:repositoryId/issues/:issueId", authenticate, deleteIssue);
router.post("/:repositoryId/issues/:issueId/comments", authenticate, addComment);

// Pull Requests
router.post("/:repositoryId/pull-requests", authenticate, createPullRequest);
router.get("/:repositoryId/pull-requests", optionalAuthenticate, getPullRequests);
router.get("/:repositoryId/pull-requests/:prId", optionalAuthenticate, getPullRequestById);
router.post("/:repositoryId/pull-requests/:prId/merge", authenticate, mergePullRequest);
router.put("/:repositoryId/pull-requests/:prId/close", authenticate, closePullRequest);
router.post("/:repositoryId/pull-requests/:prId/resolve", authenticate, resolveConflicts);
router.post("/:repositoryId/pull-requests/:prId/comments", authenticate, addPrComment);

export default router;