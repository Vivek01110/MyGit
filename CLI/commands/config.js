import { getConfigValue, setConfigValue, loadConfig } from "../core/config.js";

export const config = async (key, value) => {
  if (!key) {
    const all = loadConfig();
    console.log("MyGit Configuration:");
    for (const [k, v] of Object.entries(all)) {
      console.log(`  ${k} = ${v}`);
    }
    return;
  }

  // If only key is given, get key
  if (value === undefined) {
    const v = getConfigValue(key);
    if (v !== undefined) {
      console.log(`${key} = ${v}`);
    } else {
      console.log(`${key} is not set.`);
    }
    return;
  }

  // Set key
  if (key === "remote" || key === "remoteUrl") {
    // Normalize URL, strip trailing slash
    const normalized = value.replace(/\/+$/, "");
    setConfigValue("remoteUrl", normalized);
    console.log(`✓ Remote server set to: ${normalized}`);
  } else {
    setConfigValue(key, value);
    console.log(`✓ Set ${key} = ${value}`);
  }
};
