import Issue from "../models/issue.model.js";
import Repository from "../models/repository.model.js";

// Helper: check access to repository
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
// Create Issue
// ---------------------------------------
export const createIssue = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { title, description, labels } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Issue title is required." });
    }

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    // Auto-increment issue number for this repository
    const lastIssue = await Issue.findOne({ repository: repositoryId }).sort({ number: -1 });
    const number = lastIssue ? lastIssue.number + 1 : 1;

    let processedLabels = [];
    if (Array.isArray(labels)) {
      processedLabels = labels.map((l) => String(l).trim()).filter(Boolean);
    } else if (typeof labels === "string" && labels.trim()) {
      processedLabels = labels.split(",").map((l) => l.trim()).filter(Boolean);
    }

    const issue = await Issue.create({
      repository: repositoryId,
      number,
      title: title.trim(),
      description: description ? description.trim() : "",
      labels: processedLabels,
      author: req.userId
    });

    await issue.populate("author", "username email");

    return res.status(201).json({
      message: "Issue created successfully.",
      issue
    });
  } catch (error) {
    console.error("Create issue error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to create issue." });
  }
};

// ---------------------------------------
// Get Issues for Repository
// ---------------------------------------
export const getIssues = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { status } = req.query;

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const filter = { repository: repositoryId };
    if (status && (status === "open" || status === "closed")) {
      filter.status = status;
    }

    const issues = await Issue.find(filter)
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    const openCount = await Issue.countDocuments({ repository: repositoryId, status: "open" });
    const closedCount = await Issue.countDocuments({ repository: repositoryId, status: "closed" });

    return res.status(200).json({
      issues,
      openCount,
      closedCount,
      totalCount: openCount + closedCount
    });
  } catch (error) {
    console.error("Get issues error:", error.message);
    return res.status(500).json({ message: "Failed to fetch issues." });
  }
};

// ---------------------------------------
// Get Single Issue Details
// ---------------------------------------
export const getIssueById = async (req, res) => {
  try {
    const { repositoryId, issueId } = req.params;

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    // Allow fetching by Mongo _id OR by issue number
    const query = { repository: repositoryId };
    if (issueId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = issueId;
    } else {
      query.number = Number(issueId);
    }

    const issue = await Issue.findOne(query)
      .populate("author", "username email")
      .populate("comments.author", "username email");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    return res.status(200).json({ issue });
  } catch (error) {
    console.error("Get issue by id error:", error.message);
    return res.status(500).json({ message: "Failed to get issue." });
  }
};

// ---------------------------------------
// Update Issue
// ---------------------------------------
export const updateIssue = async (req, res) => {
  try {
    const { repositoryId, issueId } = req.params;
    const { title, description, status, labels } = req.body;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    const query = { repository: repositoryId };
    if (issueId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = issueId;
    } else {
      query.number = Number(issueId);
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Permission check: Issue author OR Repository owner can update
    const isAuthor = issue.author.toString() === req.userId;
    const isRepoOwner = repository.owner.toString() === req.userId;

    if (!isAuthor && !isRepoOwner) {
      return res.status(403).json({
        message: "You do not have permission to update this issue."
      });
    }

    if (title !== undefined && title.trim()) {
      issue.title = title.trim();
    }
    if (description !== undefined) {
      issue.description = description.trim();
    }
    if (status !== undefined && (status === "open" || status === "closed")) {
      issue.status = status;
    }
    if (labels !== undefined) {
      if (Array.isArray(labels)) {
        issue.labels = labels.map((l) => String(l).trim()).filter(Boolean);
      } else if (typeof labels === "string") {
        issue.labels = labels.split(",").map((l) => l.trim()).filter(Boolean);
      }
    }

    await issue.save();
    await issue.populate("author", "username email");
    await issue.populate("comments.author", "username email");

    return res.status(200).json({
      message: "Issue updated successfully.",
      issue
    });
  } catch (error) {
    console.error("Update issue error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to update issue." });
  }
};

// ---------------------------------------
// Delete Issue
// ---------------------------------------
export const deleteIssue = async (req, res) => {
  try {
    const { repositoryId, issueId } = req.params;

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    const query = { repository: repositoryId };
    if (issueId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = issueId;
    } else {
      query.number = Number(issueId);
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Permission check: Issue author OR Repository owner can delete
    const isAuthor = issue.author.toString() === req.userId;
    const isRepoOwner = repository.owner.toString() === req.userId;

    if (!isAuthor && !isRepoOwner) {
      return res.status(403).json({
        message: "You do not have permission to delete this issue."
      });
    }

    await Issue.findByIdAndDelete(issue._id);

    return res.status(200).json({
      message: "Issue deleted successfully.",
      issueId: issue._id
    });
  } catch (error) {
    console.error("Delete issue error:", error.message);
    return res.status(500).json({ message: "Failed to delete issue." });
  }
};

// ---------------------------------------
// Add Comment to Issue
// ---------------------------------------
export const addComment = async (req, res) => {
  try {
    const { repositoryId, issueId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required." });
    }

    const { repository, error } = await checkRepoAccess(repositoryId, req.userId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const query = { repository: repositoryId };
    if (issueId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = issueId;
    } else {
      query.number = Number(issueId);
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    issue.comments.push({
      author: req.userId,
      body: body.trim(),
      createdAt: new Date()
    });

    await issue.save();
    await issue.populate("author", "username email");
    await issue.populate("comments.author", "username email");

    const newComment = issue.comments[issue.comments.length - 1];

    return res.status(201).json({
      message: "Comment added successfully.",
      comment: newComment,
      issue
    });
  } catch (error) {
    console.error("Add comment error:", error.message);
    return res.status(500).json({ message: "Failed to add comment." });
  }
};
