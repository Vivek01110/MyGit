import RepositoryCard from "./RepositoryCard";

export default function RepositoryList({ repositories }) {
  if (!repositories?.length) {
    return (
      <div className="py-8 text-center text-fg-muted">
        <p>No repositories found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {repositories.map((repo) => (
        <RepositoryCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}