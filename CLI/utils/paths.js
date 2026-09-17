import path from "path";

export const getCurrentDirectory = () => {
  return process.cwd();
};

export const getMygitDirectory = (rootDir = getCurrentDirectory()) => {
  return path.join(rootDir, ".mygit");
};

export const getObjectsDirectory = (rootDir = getCurrentDirectory()) => {
  return path.join(getMygitDirectory(rootDir), "objects");
};

export const getRefsDirectory = (rootDir = getCurrentDirectory()) => {
  return path.join(getMygitDirectory(rootDir), "refs");
};

export const getHeadsDirectory = (rootDir = getCurrentDirectory()) => {
  return path.join(getRefsDirectory(rootDir), "heads");
};

export const getHeadFile = (rootDir = getCurrentDirectory()) => {
  return path.join(getMygitDirectory(rootDir), "HEAD");
};

export const getConfigFile = (rootDir = getCurrentDirectory()) => {
  return path.join(getMygitDirectory(rootDir), "config.json");
};

export const getIndexFile = (rootDir = getCurrentDirectory()) => {
  return path.join(getMygitDirectory(rootDir), "index.json");
};

export const getMainBranchFile = (rootDir = getCurrentDirectory()) => {
  return path.join(getHeadsDirectory(rootDir), "main");
};

export const getMainRefFile = (rootDir = getCurrentDirectory()) => {
  return path.join(
    getRefsDirectory(rootDir),
    "heads",
    "main"
  );
};

export const getBranchRefFile = (branchName = "main", rootDir = getCurrentDirectory()) => {
  return path.join(getHeadsDirectory(rootDir), branchName);
};
