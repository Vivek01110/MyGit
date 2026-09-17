import fs from "fs";
import path from "path";

import { isRepository } from "../core/repository.js";
import { getIndexFile } from "../utils/paths.js";
import { getAllFiles, normalizePath } from "../utils/file.js";
import { writeObject } from "../core/objects.js";

export const add = (target) => {
  if (!isRepository()) {
    console.log(
      "Not a Mygit repository. Run 'mygit init' first."
    );
    return;
  }

  if (!target) {
    console.log("Nothing specified, nothing added.");
    return;
  }

  let files = [];

  if (target === ".") {
    files = getAllFiles(process.cwd());
  } else {
    const targetPath = path.resolve(process.cwd(), target);
    if (!fs.existsSync(targetPath)) {
      console.log(`fatal: pathspec '${target}' did not match any files`);
      return;
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      files = getAllFiles(targetPath);
    } else {
      files = [targetPath];
    }
  }

  const index = JSON.parse(
    fs.readFileSync(getIndexFile(), "utf-8")
  );

  let stagedCount = 0;

  for (const file of files) {
    const relativePath = normalizePath(
      path.relative(process.cwd(), file)
    );

    const content = fs.readFileSync(file, "utf-8");

    // Store file content blob in object store
    const hash = writeObject(content);

    index[relativePath] = {
      hash
    };

    stagedCount++;
  }

  fs.writeFileSync(
    getIndexFile(),
    JSON.stringify(index, null, 2)
  );

  console.log(`Staged ${stagedCount} file(s) into staging area.`);
};