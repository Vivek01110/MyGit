import path from "path";

import {
  getAllObjectHashes,
  readObject
} from "../core/objects.js";

import {
  getAuthToken
} from "../core/auth.js";

import {
  uploadObjectToRepository,
  objectExistsOnRepository,
  updateRemoteBranchRef,
  getUserRepositories
} from "../core/remote.js";

import {
  isRepository,
  getCurrentCommit,
  getCurrentBranch,
  getRemoteOrigin,
  setRemoteOrigin
} from "../core/repository.js";

export const push = async (
  arg1,
  arg2
) => {
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
    console.log("  mygit push");
    return;
  }

  // Save origin for all subsequent pushes/pulls
  setRemoteOrigin(repositoryId);

  const token = getAuthToken();

  if (!token) {
    console.log("You must be logged in.");
    console.log("Run: mygit login");
    return;
  }

  try {
    console.log("Preparing objects...");

    const hashes = getAllObjectHashes();

    console.log(`Found ${hashes.length} local objects.`);

    let uploaded = 0;
    let skipped = 0;

    // Upload all local objects
    for (const hash of hashes) {
      const exists = await objectExistsOnRepository({
        repositoryId,
        objectHash: hash
      });

      if (exists) {
        skipped++;
        continue;
      }

      const content = readObject(hash);

      if (content === null) {
        continue;
      }

      await uploadObjectToRepository({
        repositoryId,
        objectHash: hash,
        content
      });

      uploaded++;
      console.log(`Uploaded ${hash.substring(0, 10)}...`);
    }

    // Get current local commit
    const currentCommit = getCurrentCommit();

    if (!currentCommit) {
      console.log("Nothing to push. Create a commit first.");
      return;
    }

    // Make sure the commit object exists remotely
    const commitExists = await objectExistsOnRepository({
      repositoryId,
      objectHash: currentCommit
    });

    if (!commitExists) {
      throw new Error("Remote commit object was not uploaded.");
    }

    // Update remote branch ref
    await updateRemoteBranchRef({
      repositoryId,
      branch: targetBranch,
      commitHash: currentCommit
    });

    console.log();
    console.log(`Uploaded: ${uploaded}`);
    console.log(`Skipped:  ${skipped}`);
    console.log();
    console.log(`Pushed ${targetBranch} → ${currentCommit.substring(0, 7)}`);

    if (targetBranch !== "main") {
      console.log();
      console.log(`To create a pull request for '${targetBranch}', visit:`);
      console.log(`http://localhost:5173/repository/${repositoryId}/pull-requests/create`);
    }
  } catch (error) {
    console.error();
    console.error(`Push failed: ${error.message}`);
  }
};


