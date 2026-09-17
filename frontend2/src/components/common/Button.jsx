import { Link } from "react-router-dom";

// Reusable button supporting variants, sizes, icons, and link mode
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  to,
  type = "button",
  onClick,
  className = "",
  disabled = false,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "border border-transparent bg-accent-green text-white hover:bg-accent-green-hover",
    secondary:
      "border border-border bg-canvas-subtle text-fg hover:bg-border",
    outline:
      "border border-border bg-transparent text-fg hover:bg-canvas-subtle",
    danger:
      "border border-transparent bg-danger text-white hover:bg-red-600",
    blue:
      "border border-transparent bg-accent-blue text-white hover:bg-accent-blue-hover",
    ghost:
      "border border-transparent bg-transparent text-fg-muted hover:bg-canvas-subtle",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const classes = [
    base,
    variants[variant] ?? variants.primary,
    sizes[size] ?? sizes.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 14 : 16;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {Icon && <Icon size={iconSize} />}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
}