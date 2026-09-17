import fs from "fs";
import path from "path";

import {
  isRepository,
  getCurrentCommit,
  getCurrentBranch,
  setCurrentCommit,
  getRemoteOrigin,
  setRemoteOrigin
} from "../core/repository.js";
import {
  getRemoteBranchRef,
  downloadObjectFromRepository,
  getUserRepositories
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

export const pull = async (arg1, arg2) => {
  if (!isRepository()) {
    console.log("Not a Mygit repository. Run 'mygit init' first.");
    return;
  }

  const savedOrigin = getRemoteOrigin();
  let repositoryId = savedOrigin;
  let targetBranch = getCurrentBranch();

  if (arg1 && arg2) {
    if (arg1 !== "origin") {
      repositoryId = arg1;
    }
    targetBranch = arg2;
  } else if (arg1) {
    if (arg1 === "origin") {
      targetBranch = getCurrentBranch();
    } else if (arg1.match(/^[0-9a-fA-F]{24}$/)) {
      repositoryId = arg1;
    } else {
      targetBranch = arg1;
    }
  }

  // Auto-detect remote repository if not specified
  if (!repositoryId) {
    try {
      const userRepos = await getUserRepositories();
      if (userRepos && userRepos.length > 0) {
        const currentDirName = path.basename(process.cwd()).toLowerCase();
        const matched = userRepos.find((r) => r.name.toLowerCase() === currentDirName);

        if (matched) {
          repositoryId = matched._id;
          console.log(`Auto-detected remote repository '${matched.name}' (${repositoryId}).`);
        } else if (userRepos.length === 1) {
          repositoryId = userRepos[0]._id;
          console.log(`Auto-detected repository '${userRepos[0].name}' (${repositoryId}).`);
        }
      }
    } catch {
      // Continue
    }
  }

  if (!repositoryId) {
    console.log("No remote repository configured.");
    console.log("To link your remote repository:");
    console.log("  mygit remote add origin <repository-id>");
    console.log("  mygit pull");
    return;
  }

  // Save origin for all subsequent pulls/pushes
  setRemoteOrigin(repositoryId);

  try {
    const localCommit = getCurrentCommit();

    const branchRef = await getRemoteBranchRef({
      repositoryId,
      branch: targetBranch
    });

    const remoteCommit = branchRef?.commitHash;

    if (!remoteCommit) {
      console.log(`Remote repository branch '${targetBranch}' has no commits yet.`);
      return;
    }

    if (localCommit === remoteCommit) {
      // Check if any working directory files were deleted or missing on disk
      const commitContent = readObject(localCommit);
      let missingRestored = 0;
      if (commitContent) {
        try {
          const commitObj = JSON.parse(commitContent);
          const files = commitObj.files || {};
          const objectsDir = getObjectsDirectory();
          for (const [relPath, fileMeta] of Object.entries(files)) {
            const normalizedParts = relPath.split(/[/\\]/);
            const fullFilePath = path.join(process.cwd(), ...normalizedParts);
            if (!fs.existsSync(fullFilePath)) {
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
              if (content !== null) {
                const fileDir = path.dirname(fullFilePath);
                if (!fs.existsSync(fileDir)) {
                  fs.mkdirSync(fileDir, { recursive: true });
                }
                fs.writeFileSync(fullFilePath, content);
                missingRestored++;
              }
            }
          }
        } catch {
          // Continue
        }
      }

      if (missingRestored > 0) {
        console.log(`Already up to date with remote (${localCommit.substring(0, 7)}), restored ${missingRestored} missing file(s) to working directory.`);
        return;
      }

      console.log(`Already up to date. (branch '${targetBranch}' is at ${localCommit ? localCommit.substring(0, 7) : "HEAD"})`);
      return;
    }

    console.log(`Pulling updates from remote (${remoteCommit.substring(0, 7)})...`);

    const objectsDir = getObjectsDirectory();

    // Fetch commit objects back to local commit or until root
    const commitQueue = [remoteCommit];
    const visitedCommits = new Set();
    let latestCommitObj = null;

    while (commitQueue.length > 0) {
      const cHash = commitQueue.shift();
      if (!cHash || cHash === localCommit || visitedCommits.has(cHash)) {
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
        if (commitObj.parent && commitObj.parent !== localCommit) {
          commitQueue.push(commitObj.parent);
        }
      } catch {
        // Continue if parsing fails
      }
    }

    // Ensure we have latest commit object parsed
    if (!latestCommitObj) {
      const content = readObject(remoteCommit, objectsDir);
      if (content) {
        latestCommitObj = JSON.parse(content);
      }
    }

    const files = latestCommitObj?.files || {};
    let updatedFiles = 0;

    for (const [relPath, fileMeta] of Object.entries(files)) {
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

      const normalizedParts = relPath.split(/[/\\]/);
      const fullFilePath = path.join(process.cwd(), ...normalizedParts);
      const fileDir = path.dirname(fullFilePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(fullFilePath, content);
      updatedFiles++;
    }

    // Update branch ref
    setCurrentCommit(remoteCommit);

    // Update index
    fs.writeFileSync(
      getIndexFile(),
      JSON.stringify(files, null, 2)
    );

    console.log(`Fast-forward: updated to ${remoteCommit.substring(0, 7)} (${updatedFiles} files updated).`);
  } catch (error) {
    console.error();
    console.error(`Pull failed: ${error.message}`);
  }
};
