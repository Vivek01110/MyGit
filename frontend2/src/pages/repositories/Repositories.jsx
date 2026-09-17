import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Globe, BookOpen, Loader2 } from "lucide-react";

import PageLayout from "../../components/layout/PageLayout";
import RepositoryList from "../../components/repository/RepositoryList";
import Button from "../../components/common/Button";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Repositories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [tab, setTab] = useState(urlSearch ? "explore" : "mine"); // "mine" | "explore"
  const [myRepos, setMyRepos] = useState([]);
  const [publicRepos, setPublicRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [error, setError] = useState("");

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
      setTab("explore");
    }
  }, [urlSearch]);

  useEffect(() => {
    // If not logged in, default to explore public
    if (!isAuthenticated) {
      setTab("explore");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRepositories();
  }, [tab, isAuthenticated, search]);

  const fetchRepositories = async () => {
    setLoading(true);
    setError("");

    try {
      if (tab === "mine" && isAuthenticated) {
        const res = await api.repositories.getUserRepos();
        setMyRepos(res.repositories || []);
      } else {
        const res = await api.repositories.getPublic({ search });
        setPublicRepos(res.repositories || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load repositories.");
    } finally {
      setLoading(false);
    }
  };

  const currentList = tab === "mine" ? myRepos : publicRepos;

  const filtered = currentList.filter((repo) => {
    const query = search.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  });

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-fg">
              Repositories
            </h1>
            <p className="text-sm text-fg-muted">
              Manage your code repositories and explore open source projects.
            </p>
          </div>

          <Button
            icon={Plus}
            to="/repositories/create"
          >
            New Repository
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-2 border-b border-border pb-3">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === "mine"
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-fg-muted hover:text-fg hover:bg-canvas"
              }`}
            >
              <BookOpen size={16} />
              Your Repositories ({myRepos.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab("explore")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === "explore"
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-fg-muted hover:text-fg hover:bg-canvas"
            }`}
          >
            <Globe size={16} />
            Explore Public Repositories
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search repositories by name, description, or language..."
            aria-label="Search repositories"
            className="input-field pl-9"
          />
        </div>

        {/* Results count or error */}
        {error && (
          <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-fg-muted">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span>Loading repositories...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <BookOpen size={36} className="mx-auto mb-3 text-fg-subtle" />
            <h3 className="text-lg font-medium text-fg">No repositories found</h3>
            <p className="mt-1 text-sm text-fg-muted">
              {search
                ? `No repositories match "${search}". Try searching something else.`
                : tab === "mine"
                ? "You haven't created any repositories yet."
                : "No public repositories available."}
            </p>
            {tab === "mine" && (
              <div className="mt-4">
                <Button to="/repositories/create" icon={Plus}>
                  Create your first repository
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-fg-muted">
              {filtered.length}{" "}
              {filtered.length === 1 ? "repository" : "repositories"}
            </p>
            <RepositoryList repositories={filtered} />
          </>
        )}
      </div>
    </PageLayout>
  );
}