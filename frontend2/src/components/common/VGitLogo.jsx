export default function VGitLogo({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${className}`}
    >
      {/* Outer Circle Background & White Ring */}
      <circle
        cx="256"
        cy="256"
        r="244"
        fill="#09090b"
        stroke="#FFFFFF"
        strokeWidth="18"
      />

      {/* Main Vertical Stem Line */}
      <line
        x1="218"
        y1="145"
        x2="218"
        y2="360"
        stroke="#FFFFFF"
        strokeWidth="26"
        strokeLinecap="round"
      />

      {/* Diagonal Branch Line */}
      <line
        x1="218"
        y1="340"
        x2="338"
        y2="235"
        stroke="#FFFFFF"
        strokeWidth="26"
        strokeLinecap="round"
      />

      {/* Top Left Node (Filled Circle) */}
      <circle
        cx="218"
        cy="145"
        r="40"
        fill="#FFFFFF"
      />

      {/* Bottom Node (Filled Circle) */}
      <circle
        cx="218"
        cy="360"
        r="44"
        fill="#FFFFFF"
      />

      {/* Top Right Branch Node (Ring with Black Hole Cutout) */}
      <circle
        cx="338"
        cy="235"
        r="41"
        fill="#FFFFFF"
      />
      <circle
        cx="338"
        cy="235"
        r="18"
        fill="#09090b"
      />
    </svg>
  );
}
