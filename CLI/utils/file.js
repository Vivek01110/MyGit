import fs from "fs";
import path from "path";

const IGNORED_NAMES = [
  ".mygit",
  ".git",
  "node_modules"
];

export const normalizePath = (filePath) => {
  return filePath.split(path.sep).join("/");
};

export const getAllFiles = (directory = process.cwd()) => {
  const files = [];

  if (!fs.existsSync(directory)) {
    return files;
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (IGNORED_NAMES.includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
};