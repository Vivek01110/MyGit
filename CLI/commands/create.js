import { apiRequest } from "../utils/api.js";

import {
  getAuthToken
} from "../core/auth.js";

import {
  isRepository,
  setRemoteOrigin
} from "../core/repository.js";

export const create = async (
  repositoryName
) => {

  // -----------------------------
  // Validate command
  // -----------------------------

  if (!repositoryName) {

    console.log(
      "Usage: mygit create <repository-name>"
    );

    return;
  }


  // -----------------------------
  // Get JWT
  // -----------------------------

  const token = getAuthToken();


  if (!token) {

    console.log(
      "You must be logged in to create a repository."
    );

    console.log(
      "Run: mygit login"
    );

    return;
  }


  try {

    // -----------------------------
    // Call backend
    // -----------------------------

    const data =
      await apiRequest(
        "/api/repositories",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            name: repositoryName,

            description: "",

            visibility: "public"
          })
        }
      );


    const repository =
      data.repository;


    // -----------------------------
    // Display result
    // -----------------------------

    console.log();

    console.log(
      "Repository created successfully!"
    );

    console.log();

    console.log(
      `Name:       ${repository.name}`
    );

    console.log(
      `ID:         ${repository._id}`
    );

    console.log(
      `Visibility: ${repository.visibility}`
    );

    console.log(
      `Branch:     ${repository.defaultBranch}`
    );

    console.log();
    console.log(
      `Clone command: mygit clone ${repository._id}`
    );

    // If inside a local repo, automatically link origin
    if (isRepository()) {
      setRemoteOrigin(repository._id);
      console.log();
      console.log("Linked current local repository to remote origin.");
      console.log("Run 'mygit push' to push your commits.");
    }

    console.log();

  } catch (error) {

    console.error();

    console.error(
      `Failed to create repository: ${error.message}`
    );

  }
};