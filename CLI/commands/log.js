import fs from "fs";

import { isRepository } from "../core/repository.js";

import { getMainBranchFile } from "../utils/paths.js";  
import { readObject } from "../core/objects.js";

export const log = () => {
  if (!isRepository()) {
    console.log(
      "Not a Mygit repository. Run 'mygit init' first."
    );
    return;
  }

  let commitHash = fs.readFileSync(
    getMainBranchFile(),
    "utf-8"
  ).trim();

  if (!commitHash) {
    console.log("No commits yet.");
    return;
  }

  while (commitHash) {
    const content = readObject(commitHash);

    if (!content) {
      console.log(
        `Could not read commit ${commitHash}`
      );
      return;
    }

    const commit = JSON.parse(content);

    console.log(`commit ${commitHash}`);
    console.log(
      `Date: ${commit.timestamp}`
    );
    console.log();
    console.log(`    ${commit.message}`);
    console.log();

    commitHash = commit.parent;
  }
};