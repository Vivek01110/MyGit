import fs from "fs";
import os from "os";
import path from "path";

const MYGIT_HOME = path.join(
  os.homedir(),
  ".mygit"
);

const CREDENTIALS_FILE = path.join(
  MYGIT_HOME,
  "credentials.json"
);

export const saveCredentials = (data) => {
  if (!fs.existsSync(MYGIT_HOME)) {
    fs.mkdirSync(MYGIT_HOME, {
      recursive: true
    });
  }

  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(data, null, 2)
  );
};

export const getCredentials = () => {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        CREDENTIALS_FILE,
        "utf-8"
      )
    );
  } catch {
    return null;
  }
};

export const getAuthToken = () => {
  const credentials = getCredentials();

  return credentials?.token || null;
};

export const clearCredentials = () => {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
};