import fs from "fs";
import path from "path";

import { isRepository, getCurrentCommit } from "../core/repository.js";
import { getIndexFile } from "../utils/paths.js";
import { getAllFiles, normalizePath } from "../utils/file.js";
import { hashContent } from "../utils/hash.js";
import { readObject } from "../core/objects.js";

export const status = () => {
  if (!isRepository()) {
    console.log(
      "Not a Mygit repository. Run 'mygit init' first."
    );
    return;
  }

  const index = JSON.parse(
    fs.readFileSync(getIndexFile(), "utf-8")
  );

  const files = getAllFiles(process.cwd());

  const currentFiles = new Set();
  const untracked = [];
  const modified = [];

  for (const file of files) {
    const relativePath = normalizePath(
      path.relative(process.cwd(), file)
    );

    currentFiles.add(relativePath);

    const content = fs.readFileSync(file, "utf-8");
    const currentHash = hashContent(content);

    if (!index[relativePath]) {
      untracked.push(relativePath);
    } else if (index[relativePath].hash !== currentHash) {
      modified.push(relativePath);
    }
  }

  // Compare index with latest commit to find staged changes
  const currentCommitHash = getCurrentCommit();
  let committedFiles = {};

  if (currentCommitHash) {
    const commitContent = readObject(currentCommitHash);
    if (commitContent) {
      try {
        const commit = JSON.parse(commitContent);
        committedFiles = commit.files || {};
      } catch {
        committedFiles = {};
      }
    }
  }

  const stagedNew = [];
  const stagedModified = [];

  for (const file in index) {
    if (!committedFiles[file]) {
      stagedNew.push(file);
    } else if (committedFiles[file].hash !== index[file].hash) {
      stagedModified.push(file);
    }
  }

  console.log();

  if (stagedNew.length > 0 || stagedModified.length > 0) {
    console.log("Changes to be committed:");
    for (const file of stagedNew) {
      console.log(`  new file:   ${file}`);
    }
    for (const file of stagedModified) {
      console.log(`  modified:   ${file}`);
    }
    console.log();
  }

  if (modified.length > 0) {
    console.log("Changes not staged for commit:");
    for (const file of modified) {
      console.log(`  modified:   ${file}`);
    }
    console.log();
  }

  if (untracked.length > 0) {
    console.log("Untracked files:");
    for (const file of untracked) {
      console.log(`  ${file}`);
    }
    console.log();
  }

  if (
    untracked.length === 0 &&
    modified.length === 0 &&
    stagedNew.length === 0 &&
    stagedModified.length === 0
  ) {
    console.log("Working tree clean.");
  }
};