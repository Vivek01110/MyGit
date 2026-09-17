import fs from "fs";
import path from "path";

import { init } from "./init.js";
import {
  getRepositoryInfo,
  getRemoteBranchRef,
  downloadObjectFromRepository
} from "../core/remote.js";
import {
  writeObject,
  readObject,
  hasObject
} from "../core/objects.js";
import {
  getObjectsDirectory,
  getIndexFile
} from "../utils/paths.js";
import {
  setRemoteOrigin,
  setCurrentCommit
} from "../core/repository.js";

export const clone = async (repositoryIdOrUrl, targetDirArg) => {
  if (!repositoryIdOrUrl) {
    console.log("Usage: mygit clone <repository-id> [directory]");
    return;
  }

  // Extract ID if a full URL was passed
  let repositoryId = repositoryIdOrUrl;
  if (repositoryId.includes("/")) {
    const parts = repositoryId.split("/").filter(Boolean);
    repositoryId = parts[parts.length - 1];
  }

  try {
    console.log(`Connecting to remote repository ${repositoryId}...`);
    const repository = await getRepositoryInfo(repositoryId);

    const targetDirName = targetDirArg || repository.name;
    const targetPath = path.resolve(process.cwd(), targetDirName);

    if (fs.existsSync(targetPath)) {
      const existing = fs.readdirSync(targetPath);
      if (existing.length > 0) {
        console.error(
          `fatal: destination path '${targetDirName}' already exists and is not an empty directory.`
        );
        return;
      }
    } else {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    console.log(`Cloning into '${targetDirName}'...`);

    // Initialize .mygit in target directory
    init(targetPath);
    setRemoteOrigin(repository._id, targetPath);

    const defaultBranch = repository.defaultBranch || "main";
    const branchRef = await getRemoteBranchRef({
      repositoryId,
      branch: defaultBranch
    });

    const commitHash = branchRef?.commitHash;

    if (!commitHash) {
      console.log("warning: You appear to have cloned an empty repository.");
      return;
    }

    const objectsDir = getObjectsDirectory(targetPath);

    // Download commit history (chain of parent commits)
    const commitQueue = [commitHash];
    const visitedCommits = new Set();
    let latestCommitObj = null;

    while (commitQueue.length > 0) {
      const cHash = commitQueue.shift();
      if (!cHash || visitedCommits.has(cHash)) {
        continue;
      }

      visitedCommits.add(cHash);
      const commitContent = await downloadObjectFromRepository({
        repositoryId,
        objectHash: cHash
      });

      writeObject(commitContent, objectsDir);

      try {
        const commitObj = JSON.parse(commitContent);
        if (!latestCommitObj) {
          latestCommitObj = commitObj;
        }
        if (commitObj.parent) {
          commitQueue.push(commitObj.parent);
        }
      } catch {
        // Continue if parsing fails
      }
    }

    // Download all file blobs referenced by latest commit
    const files = latestCommitObj?.files || {};
    const fileEntries = Object.entries(files);

    console.log(
      `remote: Enumerating objects: ${visitedCommits.size + fileEntries.length}, done.`
    );
    console.log(
      `remote: Receiving objects: 100% (${visitedCommits.size + fileEntries.length}/${visitedCommits.size + fileEntries.length}), done.`
    );

    let checkedOut = 0;

    for (const [relPath, fileMeta] of fileEntries) {
      const blobHash = fileMeta.hash;
      let content = null;

      if (hasObject(blobHash, objectsDir)) {
        content = readObject(blobHash, objectsDir);
      } else {
        content = await downloadObjectFromRepository({
          repositoryId,
          objectHash: blobHash
        });
        writeObject(content, objectsDir);
      }

      // Reconstruct working tree file
      const normalizedParts = relPath.split(/[/\\]/);
      const fullFilePath = path.join(targetPath, ...normalizedParts);
      const fileDir = path.dirname(fullFilePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(fullFilePath, content);
      checkedOut++;
    }

    // Set local main branch ref to the cloned commit
    setCurrentCommit(commitHash, targetPath);

    // Set index to match the committed files
    fs.writeFileSync(
      getIndexFile(targetPath),
      JSON.stringify(files, null, 2)
    );

    console.log(
      `Checking out files: 100% (${checkedOut}/${checkedOut}), done.`
    );
    console.log(`Successfully cloned repository '${repository.name}'.`);
  } catch (error) {
    console.error();
    console.error(`Clone failed: ${error.message}`);
  }
};
