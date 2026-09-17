import fs from "fs";
import path from "path";
import { isRepository, getCurrentCommit } from "../core/repository.js";
import { getHeadsDirectory, getHeadFile, getCurrentDirectory } from "../utils/paths.js";

export const getCurrentBranch = (rootDir = getCurrentDirectory()) => {
  const headFile = getHeadFile(rootDir);
  if (!fs.existsSync(headFile)) {
    return "main";
  }
  const content = fs.readFileSync(headFile, "utf-8").trim();
  if (content.startsWith("ref: refs/heads/")) {
    return content.replace("ref: refs/heads/", "");
  }
  return "main";
};

export const branch = async (branchName) => {
  if (!isRepository()) {
    console.error("fatal: not a mygit repository (or any of the parent directories): .mygit");
    return;
  }

  const headsDir = getHeadsDirectory();
  if (!fs.existsSync(headsDir)) {
    fs.mkdirSync(headsDir, { recursive: true });
  }

  const currentBranch = getCurrentBranch();

  // If no branch name is provided, list all branches
  if (!branchName) {
    const files = fs.readdirSync(headsDir);
    if (files.length === 0) {
      console.log(`* main (no commits yet)`);
      return;
    }

    files.forEach((file) => {
      if (file === currentBranch) {
        console.log(`* \x1b[32m${file}\x1b[0m`);
      } else {
        console.log(`  ${file}`);
      }
    });
    return;
  }

  // Create new branch pointing to current commit
  const newBranchFile = path.join(headsDir, branchName);
  if (fs.existsSync(newBranchFile)) {
    console.error(`fatal: a branch named '${branchName}' already exists.`);
    return;
  }

  const currentCommit = getCurrentCommit();
  if (!currentCommit) {
    console.error("fatal: not a valid object name: cannot create branch without initial commit.");
    return;
  }

  fs.writeFileSync(newBranchFile, currentCommit, "utf-8");
  console.log(`✓ Created branch '${branchName}' at commit ${currentCommit.substring(0, 7)}`);
};
