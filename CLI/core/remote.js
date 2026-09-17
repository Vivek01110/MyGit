import {
  getAuthToken
} from "./auth.js";

import {
  apiRequest,
  headRequest
} from "../utils/api.js";


export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`
    };
  }
  return {};
};

export const uploadObjectToRepository = async ({
  repositoryId,
  objectHash,
  content
}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("You must be logged in.");
  }

  return apiRequest(
    `/api/repositories/${repositoryId}/objects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        hash: objectHash,
        content
      })
    }
  );
};

export const objectExistsOnRepository = async ({
  repositoryId,
  objectHash
}) => {
  try {
    await headRequest(
      `/api/repositories/${repositoryId}/objects/${objectHash}`,
      {
        headers: getAuthHeaders()
      }
    );
    return true;
  } catch {
    return false;
  }
};

export const downloadObjectFromRepository = async ({
  repositoryId,
  objectHash
}) => {
  const data = await apiRequest(
    `/api/repositories/${repositoryId}/objects/${objectHash}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  return data.content;
};

export const updateRemoteMain = async ({
  repositoryId,
  commitHash
}) => {
  return updateRemoteBranchRef({
    repositoryId,
    branch: "main",
    commitHash
  });
};

export const updateRemoteBranchRef = async ({
  repositoryId,
  branch = "main",
  commitHash
}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("You must be logged in.");
  }

  return apiRequest(
    `/api/repositories/${repositoryId}/refs/${encodeURIComponent(branch)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        commitHash
      })
    }
  );
};

export const getRemoteBranchRef = async ({
  repositoryId,
  branch = "main"
}) => {
  const data = await apiRequest(
    `/api/repositories/${repositoryId}/refs/${branch}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  return data;
};

export const getRepositoryInfo = async (repositoryId) => {
  const data = await apiRequest(
    `/api/repositories/${repositoryId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  return data.repository;
};

export const getUserRepositories = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("You must be logged in.");
  }

  const data = await apiRequest(
    `/api/repositories`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return data.repositories;
};
