import { getConfigValue } from "../core/config.js";

export const getApiUrl = () => {
  return (
    process.env.MYGIT_API_URL ||
    getConfigValue("remoteUrl") ||
    "https://mygit-backend-04ux.onrender.com"
  );
};

export const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const headRequest = async (
  endpoint,
  options = {}
) => {

  const response = await fetch(
    `${getApiUrl()}${endpoint}`,
    {
      ...options,

      method: "HEAD",

      headers: {
        ...(options.headers || {})
      }
    }
  );


  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }


  return true;
};