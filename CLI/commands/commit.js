import fs from "fs";

import { isRepository, getCurrentBranch } from "../core/repository.js";
import { getIndexFile } from "../utils/paths.js";
import { createCommit } from "../core/commit.js";

export const commit = (args) => {
  if (!isRepository()) {
    console.log(
      "Not a Mygit repository. Run 'mygit init' first."
    );
    return;
  }

  const messageIndex = args.indexOf("-m");

  if (
    messageIndex === -1 ||
    !args[messageIndex + 1]
  ) {
    console.log(
      'Usage: mygit commit -m "commit message"'
    );
    return;
  }

  const message = args[messageIndex + 1];

  const index = JSON.parse(
    fs.readFileSync(getIndexFile(), "utf-8")
  );

  if (Object.keys(index).length === 0) {
    console.log(
      "Nothing to commit. Stage files first."
    );
    return;
  }

  const commitHash = createCommit(
    message,
    index
  );

  const branch = getCurrentBranch();

  console.log(
    `[${branch} ${commitHash.substring(0, 7)}] ${message}`
  );
};