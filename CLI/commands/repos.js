import { getUserRepositories } from "../core/remote.js";
import { getAuthToken } from "../core/auth.js";

export const repos = async () => {
  const token = getAuthToken();

  if (!token) {
    console.log("You must be logged in.");
    console.log("Run: mygit login");
    return;
  }

  try {
    const list = await getUserRepositories();

    if (!list || list.length === 0) {
      console.log("No repositories found.");
      console.log("Create one with: mygit create <repository-name>");
      return;
    }

    console.log();
    console.log(`Your repositories (${list.length}):`);
    console.log();

    for (const repo of list) {
      const commitInfo = repo.latestCommit
        ? `[commit: ${repo.latestCommit.substring(0, 7)}]`
        : "[empty]";
      console.log(`  * ${repo.name} (${repo.visibility}) ${commitInfo}`);
      console.log(`    ID: ${repo._id}`);
      console.log(`    Clone: mygit clone ${repo._id}`);
      console.log();
    }
  } catch (error) {
    console.error();
    console.error(`Failed to list repositories: ${error.message}`);
  }
};
