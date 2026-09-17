import fs from "fs";
import path from "path";
import { isRepository, getCurrentCommit } from "../core/repository.js";
import { getHeadsDirectory, getHeadFile, getIndexFile } from "../utils/paths.js";
import { readObject } from "../core/objects.js";
import { branch } from "./branch.js";

const restoreFilesFromCommit = (commitHash, targetFile = null) => {
  if (!commitHash) return 0;
  const commitContent = readObject(commitHash);
  if (!commitContent) return 0;

  try {
    const commitObj = JSON.parse(commitContent);
    const files = commitObj.files || {};
    let count = 0;

    for (const [relPath, fileMeta] of Object.entries(files)) {
      if (targetFile && targetFile !== "." && relPath !== targetFile) {
        continue;
      }
      const blobHash = fileMeta.hash;
      const content = readObject(blobHash);
      if (content !== null) {
        const normalizedParts = relPath.split(/[/\\]/);
        const fullFilePath = path.join(process.cwd(), ...normalizedParts);
        const fileDir = path.dirname(fullFilePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(fullFilePath, content);
        count++;
      }
    }

    if (!targetFile || targetFile === ".") {
      fs.writeFileSync(getIndexFile(), JSON.stringify(files, null, 2));
    }
    return count;
  } catch {
    return 0;
  }
};

export const checkout = async (target, branchName) => {
  if (!isRepository()) {
    console.error("fatal: not a mygit repository (or any of the parent directories): .mygit");
    return;
  }

  const headsDir = getHeadsDirectory();
  const headFile = getHeadFile();

  // Support: mygit checkout -b <newBranch>
  if (target === "-b") {
    if (!branchName) {
      console.error("fatal: missing branch name for -b");
      return;
    }
    const currentCommit = getCurrentCommit();
    if (currentCommit) {
      await branch(branchName);
    }
    fs.writeFileSync(headFile, `ref: refs/heads/${branchName}\n`, "utf-8");
    console.log(`Switched to a new branch '${branchName}'`);
    return;
  }

  if (!target) {
    console.error("fatal: please specify a branch, file, or '.' to checkout.");
    return;
  }

  // Check if target is a file in current commit or "." (restore file content)
  const currentCommit = getCurrentCommit();
  let commitFiles = {};
  if (currentCommit) {
    const commitContent = readObject(currentCommit);
    if (commitContent) {
      try {
        const commitObj = JSON.parse(commitContent);
        commitFiles = commitObj.files || {};
      } catch {}
    }
  }

  const normalizedTarget = target.split(/[/\\]/).join("/");
  if (target === "." || commitFiles[normalizedTarget] || commitFiles[target]) {
    if (!currentCommit) {
      console.log("No commits in current branch to restore from.");
      return;
    }
    const fileKey = target === "." ? null : (commitFiles[normalizedTarget] ? normalizedTarget : target);
    const restored = restoreFilesFromCommit(currentCommit, fileKey);
    console.log(`✓ Restored ${restored} file(s) from commit ${currentCommit.substring(0, 7)}.`);
    return;
  }

  // Branch switch
  const branchToSwitch = target;
  const branchFile = path.join(headsDir, branchToSwitch);
  if (!fs.existsSync(branchFile)) {
    console.error(`error: pathspec '${branchToSwitch}' did not match any file or branch known to mygit.`);
    return;
  }

  fs.writeFileSync(headFile, `ref: refs/heads/${branchToSwitch}\n`, "utf-8");
  const branchCommit = fs.readFileSync(branchFile, "utf-8").trim();
  if (branchCommit) {
    restoreFilesFromCommit(branchCommit);
  }
  console.log(`Switched to branch '${branchToSwitch}'`);
};


