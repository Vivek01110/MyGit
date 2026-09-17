import { isRepository, getRemoteOrigin, setRemoteOrigin, removeRemoteOrigin } from "../core/repository.js";
import { getRepositoryInfo } from "../core/remote.js";

export const remote = async (action, nameOrId, targetId) => {
  if (!isRepository()) {
    console.log("Not a Mygit repository. Run 'mygit init' first.");
    return;
  }

  // mygit remote OR mygit remote -v
  if (!action || action === "-v" || action === "show") {
    const origin = getRemoteOrigin();
    if (!origin) {
      console.log("No remote origins configured.");
      console.log("To add one: mygit remote add origin <repository-id>");
      return;
    }

    try {
      const info = await getRepositoryInfo(origin);
      console.log(`origin\t${origin} (${info.name})`);
    } catch {
      console.log(`origin\t${origin}`);
    }
    return;
  }

  // mygit remote add <name> <id> OR mygit remote add origin <id>
  if (action === "add" || action === "set-url") {
    let repoId = targetId;
    let remoteName = nameOrId;

    if (!targetId && nameOrId && nameOrId.match(/^[0-9a-fA-F]{24}$/)) {
      repoId = nameOrId;
      remoteName = "origin";
    }

    if (!repoId) {
      console.log("Usage: mygit remote add origin <repository-id>");
      return;
    }

    setRemoteOrigin(repoId);
    console.log(`✓ Remote '${remoteName || "origin"}' set to ${repoId}`);
    return;
  }

  // mygit remote remove <name>
  if (action === "remove" || action === "rm") {
    removeRemoteOrigin();
    console.log(`✓ Remote '${nameOrId || "origin"}' removed.`);
    return;
  }

  console.log("Usage:");
  console.log("  mygit remote -v");
  console.log("  mygit remote add origin <repository-id>");
  console.log("  mygit remote set-url origin <repository-id>");
  console.log("  mygit remote remove origin");
};
