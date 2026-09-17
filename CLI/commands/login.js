import readline from "readline";

import { apiRequest } from "../utils/api.js";
import {
  saveCredentials,
  getCredentials
} from "../core/auth.js";

const askQuestion = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

export const login = async () => {
  const existingCredentials = getCredentials();

  if (existingCredentials?.token) {
    console.log("You are already logged in.");
    return;
  }

  try {
    const rawEmail = await askQuestion("Email: ");
    const rawPassword = await askQuestion("Password: ");

    const email = rawEmail.trim();
    const password = rawPassword.trim();

    const data = await apiRequest(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    saveCredentials({
      token: data.token,
      userId: data.userId,
      user: data.user
    });

    console.log();
    console.log("Login successful!");
    console.log(`Welcome, ${data.user.username}`);
  } catch (error) {
    console.error();
    console.error(`Login failed: ${error.message}`);
  }
};