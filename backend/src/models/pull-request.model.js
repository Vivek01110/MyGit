import mongoose from "mongoose";

const prCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const pullRequestSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true
    },
    number: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    sourceBranch: {
      type: String,
      required: true,
      trim: true
    },
    targetBranch: {
      type: String,
      default: "main",
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["open", "merged", "closed"],
      default: "open",
      index: true
    },
    linkedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      default: null
    },
    headCommit: {
      type: String,
      default: null
    },
    baseCommit: {
      type: String,
      default: null
    },
    mergeCommit: {
      type: String,
      default: null
    },
    hasConflicts: {
      type: Boolean,
      default: false
    },
    conflictingFiles: {
      type: [String],
      default: []
    },
    comments: [prCommentSchema]
  },
  {
    timestamps: true
  }
);

pullRequestSchema.index({ repository: 1, number: 1 }, { unique: true });

const PullRequest =
  mongoose.models.PullRequest ||
  mongoose.model("PullRequest", pullRequestSchema);

export default PullRequest;
