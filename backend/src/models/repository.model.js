import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },

    defaultBranch: {
      type: String,
      default: "main"
    },

    storagePrefix: {
      type: String,
      required: true,
      unique: true
    },

    latestCommit: {
      type: String,
      default: null
    },

    language: {
      type: String,
      default: "JavaScript"
    },

    topics: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Same user cannot create two repositories
// with the same name.
repositorySchema.index(
  {
    owner: 1,
    name: 1
  },
  {
    unique: true
  }
);

const Repository = mongoose.model(
  "Repository",
  repositorySchema
);

export default Repository;