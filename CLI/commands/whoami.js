import { apiRequest } from "../utils/api.js";
import { getAuthToken } from "../core/auth.js";

export const whoami = async () => {
  const token = getAuthToken();

  if (!token) {
    console.log("You are not logged in.");
    console.log("Run: mygit login");

    return;
  }

  try {
    const data = await apiRequest(
      "/api/users/me",
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const user = data.user;

    console.log();
    console.log(`Username: ${user.username}`);
    console.log(`Email:    ${user.email}`);
    console.log(`User ID:  ${user.id}`);
  } catch (error) {
    console.error(
      `Failed to get user information: ${error.message}`
    );
  }
};