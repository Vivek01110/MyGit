import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Lock, Globe, Check, AlertCircle } from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CreateRepository() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [language, setLanguage] = useState("JavaScript");
  const [success, setSuccess] = useState(false);
  const [createdRepoId, setCreatedRepoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      return;
    }

    if (!isAuthenticated) {
      setError("You must be logged in to create a repository.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.repositories.create({
        name: name.trim(),
        description: description.trim(),
        visibility: visibility.toLowerCase(),
        language
      });

      const repo = response.repository;
      setCreatedRepoId(repo._id);
      setSuccess(true);

      setTimeout(() => {
        navigate(`/repository/${repo._id}`);
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to create repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-semibold text-fg">
          Create a new repository
        </h1>

        <p className="mb-6 text-fg-muted">
          A repository contains your project files and revision history.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="card-surface p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10">
              <Check
                size={24}
                aria-hidden="true"
                className="text-accent-green"
              />
            </div>

            <h2 className="mb-1 text-lg font-medium text-fg">
              Repository created!
            </h2>

            <p className="text-sm text-fg-muted">
              Redirecting to your repository...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="card-surface space-y-5 p-6"
          >
            {/* Repository name */}
            <Input
              label="Repository name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="my-awesome-project"
              icon={BookOpen}
              required
            />

            <p className="-mt-3 text-xs text-fg-subtle">
              Great repository names are short and memorable.
            </p>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Description{" "}
                <span className="text-fg-subtle">(optional)</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="A brief description of your project"
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Primary Language */}
            <div>
              <label
                htmlFor="language"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Primary Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
              >
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="Java">Java</option>
                <option value="HTML">HTML</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <span className="mb-2 block text-sm font-medium text-fg">
                Visibility
              </span>

              <div className="space-y-2">
                {/* Public */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                    visibility === "Public"
                      ? "border-accent-blue bg-accent-blue/5"
                      : "border-border hover:bg-canvas"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="Public"
                    checked={visibility === "Public"}
                    onChange={(event) =>
                      setVisibility(event.target.value)
                    }
                    className="mt-1"
                  />

                  <Globe
                    size={18}
                    aria-hidden="true"
                    className="mt-0.5 text-fg-muted"
                  />

                  <div>
                    <p className="text-sm font-medium text-fg">
                      Public
                    </p>

                    <p className="text-xs text-fg-muted">
                      Anyone can see this repository. Anyone can create issues.
                    </p>
                  </div>
                </label>

                {/* Private */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                    visibility === "Private"
                      ? "border-accent-blue bg-accent-blue/5"
                      : "border-border hover:bg-canvas"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="Private"
                    checked={visibility === "Private"}
                    onChange={(event) =>
                      setVisibility(event.target.value)
                    }
                    className="mt-1"
                  />

                  <Lock
                    size={18}
                    aria-hidden="true"
                    className="mt-0.5 text-fg-muted"
                  />

                  <div>
                    <p className="text-sm font-medium text-fg">
                      Private
                    </p>

                    <p className="text-xs text-fg-muted">
                      Only you can see and contribute to this repository.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create repository"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageLayout>
  );
}