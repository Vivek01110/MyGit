import fs from "fs";

import {
  getHeadFile,
  getConfigFile,
  getIndexFile,
  getMainBranchFile
} from "../utils/paths.js";

import {
  isRepository,
  initializeRepository
} from "../core/repository.js";

export const init = (targetDir = process.cwd()) => {
  if (isRepository(targetDir)) {
    console.log("Mygit repository already exists.");
    return;
  }

  initializeRepository(targetDir);

  // HEAD points to the current branch
  fs.writeFileSync(
    getHeadFile(targetDir),
    "ref: refs/heads/main\n"
  );

  // Repository configuration
  const config = {
    version: 1,
    defaultBranch: "main"
  };

  fs.writeFileSync(
    getConfigFile(targetDir),
    JSON.stringify(config, null, 2)
  );

  // Empty staging area
  fs.writeFileSync(
    getIndexFile(targetDir),
    JSON.stringify({}, null, 2)
  );

  // No commit yet
  fs.writeFileSync(
    getMainBranchFile(targetDir),
    ""
  );

  console.log("Initialized empty Mygit repository.");
};