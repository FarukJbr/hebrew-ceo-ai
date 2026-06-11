interface LogoProps {
  size?: number
  spin?: boolean
  className?: string
}

export function Logo({ size = 40, spin = false, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${spin ? 'animate-spin-logo' : ''} ${className}`}
      style={{ display: 'block' }}
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="47" stroke="url(#goldRing)" strokeWidth="2" fill="none" />

      {/* Inner glow circle */}
      <circle cx="50" cy="50" r="38" fill="url(#goldBg)" opacity="0.9" />

      {/* Star of David / Magen David style hexagram - spiritual touch */}
      <polygon
        points="50,18 62,38 82,38 70,55 76,75 50,63 24,75 30,55 18,38 38,38"
        fill="none"
        stroke="url(#goldAccent)"
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* Hebrew letter Peh (פ) stylized as "PL" monogram */}
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="28"
        fontWeight="bold"
        fill="url(#goldText)"
        letterSpacing="-1"
      >
        PL
      </text>

      {/* Small decorative dots */}
      <circle cx="50" cy="10" r="2.5" fill="#d4af37" opacity="0.7" />
      <circle cx="50" cy="90" r="2.5" fill="#d4af37" opacity="0.7" />
      <circle cx="10" cy="50" r="2.5" fill="#d4af37" opacity="0.7" />
      <circle cx="90" cy="50" r="2.5" fill="#d4af37" opacity="0.7" />

      {/* Gradients */}
      <defs>
        <linearGradient id="goldRing" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5d060" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a07820" />
        </linearGradient>
        <radialGradient id="goldBg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2a2010" />
          <stop offset="100%" stopColor="#1a1508" />
        </radialGradient>
        <linearGradient id="goldAccent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5d060" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <linearGradient id="goldText" x1="0" y1="30" x2="0" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5e070" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8922a" />
        </linearGradient>
      </defs>
    </svg>
  )
}
