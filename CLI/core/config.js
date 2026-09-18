import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_FILE = path.join(os.homedir(), ".mygitconfig.json");

export const loadConfig = () => {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      remoteUrl: "https://mygit-backend-04ux.onrender.com"
    };
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return {
      remoteUrl: "https://mygit-backend-04ux.onrender.com",
      ...JSON.parse(raw)
    };
  } catch {
    return {
      remoteUrl: "https://mygit-backend-04ux.onrender.com"
    };
  }
};

export const saveConfig = (newConfig) => {
  const current = loadConfig();
  const merged = { ...current, ...newConfig };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
};

export const getConfigValue = (key) => {
  const config = loadConfig();
  return config[key];
};

export const setConfigValue = (key, value) => {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
  return config;
};
