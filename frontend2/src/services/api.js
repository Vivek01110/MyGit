const BASE_URL = "/api";

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === "object" && data !== null && (data.message || data.error)) ||
      response.statusText ||
      "Request failed";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      }),

    signup: (userData) =>
      request("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData)
      }),

    getMe: () => request("/users/me")
  },

  // Users
  users: {
    getMe: () => request("/users/me"),
    updateProfile: (data) =>
      request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    getByUsername: (username) => request(`/users/${encodeURIComponent(username)}`)
  },

  // Repositories
  repositories: {
    getUserRepos: () => request("/repositories"),

    getPublic: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.limit) query.append("limit", params.limit);
      if (params.skip) query.append("skip", params.skip);
      const queryString = query.toString();
      return request(`/repositories/explore${queryString ? `?${queryString}` : ""}`);
    },

    getById: (id) => request(`/repositories/${id}`),

    create: (data) =>
      request("/repositories", {
        method: "POST",
        body: JSON.stringify(data)
      }),

    update: (id, data) =>
      request(`/repositories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),

    delete: (id) =>
      request(`/repositories/${id}`, {
        method: "DELETE"
      }),

    // Files & commits
    getTree: (id, branch = "main") =>
      request(`/repositories/${id}/tree?branch=${encodeURIComponent(branch)}`),

    getBlob: (id, hash) =>
      request(`/repositories/${id}/blob/${encodeURIComponent(hash)}`),

    uploadFile: (id, fileData) =>
      request(`/repositories/${id}/files`, {
        method: "POST",
        body: JSON.stringify(fileData)
      }),

    getCommits: (id, branch = "main") =>
      request(`/repositories/${id}/commits?branch=${encodeURIComponent(branch)}`),

    getBranches: (id) =>
      request(`/repositories/${id}/branches`),

    createBranch: (id, data) =>
      request(`/repositories/${id}/branches`, {
        method: "POST",
        body: JSON.stringify(data)
      })
  },

  // Issues
  issues: {
    getAll: (repoId, status) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request(`/repositories/${repoId}/issues${query}`);
    },

    getById: (repoId, issueId) =>
      request(`/repositories/${repoId}/issues/${issueId}`),

    create: (repoId, data) =>
      request(`/repositories/${repoId}/issues`, {
        method: "POST",
        body: JSON.stringify(data)
      }),

    update: (repoId, issueId, data) =>
      request(`/repositories/${repoId}/issues/${issueId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),

    delete: (repoId, issueId) =>
      request(`/repositories/${repoId}/issues/${issueId}`, {
        method: "DELETE"
      }),

    addComment: (repoId, issueId, body) =>
      request(`/repositories/${repoId}/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body })
      })
  },

  // Pull Requests
  pullRequests: {
    getAll: (repoId, status) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request(`/repositories/${repoId}/pull-requests${query}`);
    },

    getById: (repoId, prId) =>
      request(`/repositories/${repoId}/pull-requests/${prId}`),

    create: (repoId, data) =>
      request(`/repositories/${repoId}/pull-requests`, {
        method: "POST",
        body: JSON.stringify(data)
      }),

    merge: (repoId, prId, commitMessage) =>
      request(`/repositories/${repoId}/pull-requests/${prId}/merge`, {
        method: "POST",
        body: JSON.stringify({ commitMessage })
      }),

    close: (repoId, prId) =>
      request(`/repositories/${repoId}/pull-requests/${prId}/close`, {
        method: "PUT"
      }),

    resolveConflicts: (repoId, prId, data) =>
      request(`/repositories/${repoId}/pull-requests/${prId}/resolve`, {
        method: "POST",
        body: JSON.stringify(data)
      }),

    addComment: (repoId, prId, body) =>
      request(`/repositories/${repoId}/pull-requests/${prId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body })
      })
  }
};

export default api;

