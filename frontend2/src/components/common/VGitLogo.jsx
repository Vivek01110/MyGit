export default function VGitLogo({ size = 28, className = "" }) {
  const gradientId = `vgit-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${className}`}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="80"
          y1="120"
          x2="430"
          y2="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="25%" stopColor="#7C3AED" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="85%" stopColor="#0091FF" />
          <stop offset="100%" stopColor="#00C0FF" />
        </linearGradient>
      </defs>

      {/* Left Branch */}
      <line
        x1="120"
        y1="140"
        x2="256"
        y2="400"
        stroke={`url(#${gradientId})`}
        strokeWidth="54"
        strokeLinecap="round"
      />

      {/* Right Branch */}
      <polyline
        points="256,400 340,275 415,155"
        stroke={`url(#${gradientId})`}
        strokeWidth="54"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-Left Node Ring */}
      <circle
        cx="120"
        cy="140"
        r="58"
        fill="currentColor"
        className="fill-canvas"
        stroke={`url(#${gradientId})`}
        strokeWidth="32"
      />

      {/* Bottom Node Ring */}
      <circle
        cx="256"
        cy="400"
        r="58"
        fill="currentColor"
        className="fill-canvas"
        stroke={`url(#${gradientId})`}
        strokeWidth="32"
      />

      {/* Mid-Right Node Ring */}
      <circle
        cx="340"
        cy="275"
        r="44"
        fill="currentColor"
        className="fill-canvas"
        stroke={`url(#${gradientId})`}
        strokeWidth="26"
      />

      {/* Top-Right Node Ring */}
      <circle
        cx="415"
        cy="155"
        r="58"
        fill="currentColor"
        className="fill-canvas"
        stroke={`url(#${gradientId})`}
        strokeWidth="32"
      />
    </svg>
  );
}
