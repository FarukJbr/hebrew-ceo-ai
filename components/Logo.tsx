interface LogoProps {
  size?: number
  spin?: boolean
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* 4 ascending bars — light blue */}
      <rect x="15" y="57" width="9" height="15" rx="2" fill="#80d4f0" />
      <rect x="27" y="48" width="9" height="24" rx="2" fill="#6dcce8" />
      <rect x="39" y="38" width="9" height="34" rx="2" fill="#5ac2e0" />
      <rect x="51" y="27" width="9" height="45" rx="2" fill="#48b8d8" />

      {/* Orbit ring: center(37,55) r=26, clockwise 315° from right(0°) to upper-right(-45°) */}
      <path
        d="M 63 55 A 26 26 0 1 1 55 36"
        stroke="#4488cc"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Arrow line from ring tip extending upper-right */}
      <line x1="55" y1="36" x2="76" y2="12" stroke="#4488cc" strokeWidth="7" strokeLinecap="round" />

      {/* Filled arrowhead */}
      <polygon points="76,12 64,17 73,25" fill="#4488cc" />
    </svg>
  )
}
