import fs from "fs";

import {
  getMygitDirectory,
  getObjectsDirectory,
  getHeadsDirectory,
  getMainRefFile,
  getConfigFile,
  getHeadFile,
  getIndexFile,
  getMainBranchFile,
  getBranchRefFile,
  getCurrentDirectory
} from "../utils/paths.js";

export const isRepository = (rootDir = getCurrentDirectory()) => {
  return fs.existsSync(getMygitDirectory(rootDir));
};

export const createDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

export const initializeRepository = (rootDir = getCurrentDirectory()) => {
  createDirectory(getMygitDirectory(rootDir));
  createDirectory(getObjectsDirectory(rootDir));
  createDirectory(getHeadsDirectory(rootDir));
};

export const getCurrentBranch = (rootDir = getCurrentDirectory()) => {
  const headFile = getHeadFile(rootDir);
  if (!fs.existsSync(headFile)) {
    return "main";
  }
  const content = fs.readFileSync(headFile, "utf-8").trim();
  if (content.startsWith("ref: refs/heads/")) {
    return content.replace("ref: refs/heads/", "").trim();
  }
  return "main";
};

export const getCurrentCommit = (rootDir = getCurrentDirectory()) => {
  const headFile = getHeadFile(rootDir);
  if (fs.existsSync(headFile)) {
    const headContent = fs.readFileSync(headFile, "utf-8").trim();
    if (headContent.startsWith("ref: refs/heads/")) {
      const branchName = headContent.replace("ref: refs/heads/", "").trim();
      const branchFile = getBranchRefFile(branchName, rootDir);
      if (fs.existsSync(branchFile)) {
        return fs.readFileSync(branchFile, "utf-8").trim();
      }
      return null;
    } else if (headContent.length > 0 && !headContent.startsWith("ref:")) {
      return headContent;
    }
  }

  const mainFile = getMainRefFile(rootDir);
  if (fs.existsSync(mainFile)) {
    return fs.readFileSync(mainFile, "utf-8").trim();
  }

  return null;
};

export const setCurrentCommit = (commitHash, rootDir = getCurrentDirectory()) => {
  const branchName = getCurrentBranch(rootDir);
  const branchFile = getBranchRefFile(branchName, rootDir);
  const headsDir = getHeadsDirectory(rootDir);
  if (!fs.existsSync(headsDir)) {
    fs.mkdirSync(headsDir, { recursive: true });
  }
  fs.writeFileSync(branchFile, commitHash, "utf-8");
};

export const getConfig = (rootDir = getCurrentDirectory()) => {
  const file = getConfigFile(rootDir);
  if (!fs.existsSync(file)) {
    return {
      version: 1,
      defaultBranch: "main"
    };
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return {
      version: 1,
      defaultBranch: "main"
    };
  }
};

export const saveConfig = (config, rootDir = getCurrentDirectory()) => {
  const file = getConfigFile(rootDir);
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
};

export const getRemoteOrigin = (rootDir = getCurrentDirectory()) => {
  const config = getConfig(rootDir);
  return config.remote?.origin?.repositoryId || null;
};

export const setRemoteOrigin = (repositoryId, rootDir = getCurrentDirectory()) => {
  const config = getConfig(rootDir);
  if (!config.remote) {
    config.remote = {};
  }
  config.remote.origin = {
    repositoryId
  };
  saveConfig(config, rootDir);
};

export const removeRemoteOrigin = (rootDir = getCurrentDirectory()) => {
  const config = getConfig(rootDir);
  if (config.remote?.origin) {
    delete config.remote.origin;
    saveConfig(config, rootDir);
  }
};
