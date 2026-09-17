import {
  clearCredentials,
  getCredentials
} from "../core/auth.js";

export const logout = () => {
  const credentials = getCredentials();

  if (!credentials?.token) {
    console.log("You are not logged in.");
    return;
  }

  clearCredentials();

  console.log("Logout successful.");
};