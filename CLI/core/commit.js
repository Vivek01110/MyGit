import fs from "fs";
import path from "path";

import {
  getHeadFile,
  getBranchRefFile
} from "../utils/paths.js";
import { getCurrentBranch } from "./repository.js";
import { writeObject } from "./objects.js";

export const createCommit = (message, files) => {
  const currentBranch = getCurrentBranch();
  const branchFile = getBranchRefFile(currentBranch);

  let parent = null;
  if (fs.existsSync(branchFile)) {
    const previousCommit = fs.readFileSync(branchFile, "utf-8").trim();
    if (previousCommit) {
      parent = previousCommit;
    }
  }

  // Ensure normalized forward-slash paths and ensure blobs are stored
  const normalizedFiles = {};
  for (const [filePath, fileMeta] of Object.entries(files)) {
    const normPath = filePath.split(/[/\\]/).join("/");
    normalizedFiles[normPath] = fileMeta;

    // Safety fallback: if blob wasn't stored for any reason, store it now
    const localPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, "utf-8");
      const hash = writeObject(content);
      normalizedFiles[normPath] = { hash };
    }
  }

  const commit = {
    type: "commit",
    message,
    timestamp: new Date().toISOString(),
    parent,
    files: normalizedFiles
  };

  const content = JSON.stringify(commit, null, 2);
  const commitHash = writeObject(content);

  const headsDir = path.dirname(branchFile);
  if (!fs.existsSync(headsDir)) {
    fs.mkdirSync(headsDir, { recursive: true });
  }
  fs.writeFileSync(branchFile, commitHash, "utf-8");

  return commitHash;
};