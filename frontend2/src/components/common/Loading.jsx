export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-blue"
        role="status"
        aria-label="Loading"
      />

      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  );
}