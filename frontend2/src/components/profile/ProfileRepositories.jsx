import { useState } from "react";
import { Search, BookOpen, Plus } from "lucide-react";
import RepositoryList from "../repository/RepositoryList";
import Button from "../common/Button";

export default function ProfileRepositories({ repositories = [], isOwner = false }) {
  const [search, setSearch] = useState("");

  const filteredRepos = repositories.filter((repo) => {
    const term = search.toLowerCase();
    return (
      (repo.name && repo.name.toLowerCase().includes(term)) ||
      (repo.description && repo.description.toLowerCase().includes(term)) ||
      (repo.language && repo.language.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a repository..."
            className="input-field pl-9 text-sm"
          />
        </div>

        {isOwner && (
          <Button size="sm" icon={Plus} to="/repositories/create">
            New Repository
          </Button>
        )}
      </div>

      {/* Repos list or empty state */}
      {filteredRepos.length === 0 ? (
        <div className="card-surface p-8 text-center rounded-xl border border-border">
          <BookOpen size={32} className="mx-auto mb-2 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">
            {search ? "No matching repositories found" : "No repositories yet"}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {search
              ? "Try adjusting your search query."
              : isOwner
              ? "Get started by creating your first repository."
              : "This user hasn't published any public repositories yet."}
          </p>
          {isOwner && !search && (
            <Button size="sm" icon={Plus} to="/repositories/create" className="mt-4">
              Create repository
            </Button>
          )}
        </div>
      ) : (
        <RepositoryList repositories={filteredRepos} />
      )}
    </div>
  );
}