import fs from "fs";
import path from "path";
import { hashContent } from "../utils/hash.js";
import { getObjectsDirectory } from "../utils/paths.js";

export const writeObject = (content, customObjectsDir = null) => {
  const hash = hashContent(content);
  const baseDir = customObjectsDir || getObjectsDirectory();

  const directory = path.join(
    baseDir,
    hash.substring(0, 2)
  );

  const file = path.join(
    directory,
    hash.substring(2)
  );

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content);
  }

  return hash;
};

export const readObject = (hash, customObjectsDir = null) => {
  const baseDir = customObjectsDir || getObjectsDirectory();

  const directory = path.join(
    baseDir,
    hash.substring(0, 2)
  );

  const file = path.join(
    directory,
    hash.substring(2)
  );

  if (!fs.existsSync(file)) {
    return null;
  }

  return fs.readFileSync(file, "utf-8");
};

export const hasObject = (hash, customObjectsDir = null) => {
  const baseDir = customObjectsDir || getObjectsDirectory();

  const file = path.join(
    baseDir,
    hash.substring(0, 2),
    hash.substring(2)
  );

  return fs.existsSync(file);
};




export const getAllObjectHashes = () => {

  const objectsDirectory =
    getObjectsDirectory();

  if (!fs.existsSync(objectsDirectory)) {
    return [];
  }


  const hashes = [];


  const directories =
    fs.readdirSync(
      objectsDirectory,
      {
        withFileTypes: true
      }
    );


  for (const directory of directories) {

    if (!directory.isDirectory()) {
      continue;
    }


    const prefix =
      directory.name;


    const files =
      fs.readdirSync(
        path.join(
          objectsDirectory,
          prefix
        )
      );


    for (const file of files) {

      hashes.push(
        prefix + file
      );
    }
  }


  return hashes;
};