// A small colored badge/pill for labels, statuses, and tags
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const variants = {
    default: "bg-canvas-subtle text-fg-muted border-border",
    public: "bg-blue-500/10 text-accent-blue border-blue-500/30",
    private: "bg-amber-500/10 text-warning border-amber-500/30",
    open: "bg-green-500/10 text-accent-green border-green-500/30",
    closed: "bg-red-500/10 text-danger border-red-500/30",
    merged: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    label: "bg-canvas-subtle text-fg-muted border-border",
    high: "bg-red-500/10 text-danger border-red-500/30",
    medium: "bg-amber-500/10 text-warning border-amber-500/30",
    low: "bg-green-500/10 text-accent-green border-green-500/30",
    language: "bg-canvas-subtle text-fg border-border",
    topic: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
  };

  const classes = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${classes} ${className}`}
    >
      {children}
    </span>
  );
}