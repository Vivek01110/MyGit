import { Navigate, Route, Routes } from "react-router-dom";

// Auth pages
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Main pages
import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/profile/Profile";
import Repositories from "../pages/repositories/Repositories";
import CreateRepository from "../pages/repositories/CreateRepository";

// Repository pages
import Repository from "../pages/repository/Repository";
import RepositoryCode from "../pages/repository/RepositoryCode";
import RepositoryIssues from "../pages/repository/RepositoryIssues";
import IssueDetails from "../pages/repository/IssueDetails";
import CreateIssue from "../pages/repository/CreateIssue";
import RepositoryPullRequests from "../pages/repository/RepositoryPullRequests";
import CreatePullRequest from "../pages/repository/CreatePullRequest";
import PullRequestDetails from "../pages/repository/PullRequestDetails";
import RepositoryCommits from "../pages/repository/RepositoryCommits";

function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:username" element={<Profile />} />

      {/* Repositories */}
      <Route path="/repositories" element={<Repositories />} />
      <Route
        path="/repositories/create"
        element={<CreateRepository />}
      />

      {/* Repository */}
      <Route path="/repository/:id" element={<Repository />}>
        <Route index element={<Navigate to="code" replace />} />

        <Route path="code" element={<RepositoryCode />} />

        <Route path="issues" element={<RepositoryIssues />} />
        <Route path="issues/create" element={<CreateIssue />} />
        <Route path="issues/:issueId" element={<IssueDetails />} />

        <Route
          path="pull-requests"
          element={<RepositoryPullRequests />}
        />
        <Route
          path="pull-requests/create"
          element={<CreatePullRequest />}
        />
        <Route
          path="pull-requests/:prId"
          element={<PullRequestDetails />}
        />

        <Route path="commits" element={<RepositoryCommits />} />
      </Route>

      {/* Default routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;