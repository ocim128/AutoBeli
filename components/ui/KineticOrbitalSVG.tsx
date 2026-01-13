/**
 * Reusable Kinetic Orbital SVG Component
 *
 * Extracts the common orbital animation pattern used across:
 * - CheckoutSkeleton
 * - ProductGridSkeleton
 * - Checkout page
 * - Order page (pending/success/error states)
 *
 * This consolidates ~200 lines of duplicate SVG code into a single component.
 */

interface KineticOrbitalSVGProps {
  /** Center X coordinate */
  cx?: number;
  /** Center Y coordinate */
  cy?: number;
  /** Color theme */
  variant?: "indigo" | "pending" | "success" | "error";
  /** Size multiplier (1 = default radii of 350, 250, 150) */
  scale?: number;
  /** Whether to include the central glow gradient */
  withGlow?: boolean;
  /** Glow gradient ID (must be unique per page if multiple instances) */
  glowId?: string;
  /** Additional class name */
  className?: string;
}

const colorThemes = {
  indigo: {
    primary: "#6366f1",
    secondary: "#818cf8",
    tertiary: "#a5b4fc",
  },
  pending: {
    primary: "#eab308",
    secondary: "#f59e0b",
    tertiary: "#fbbf24",
  },
  success: {
    primary: "#22c55e",
    secondary: "#4ade80",
    tertiary: "#86efac",
  },
  error: {
    primary: "#ef4444",
    secondary: "#f87171",
    tertiary: "#fca5a5",
  },
} as const;

export function KineticOrbitalSVG({
  cx = 500,
  cy = 500,
  variant = "indigo",
  scale = 1,
  withGlow = true,
  glowId = "kineticGlow",
  className = "",
}: KineticOrbitalSVGProps) {
  const colors = colorThemes[variant];
  const r1 = 350 * scale;
  const r2 = 250 * scale;
  const r3 = 150 * scale;
  const glowRadius = 400 * scale;

  return (
    <g className={className}>
      {/* Central glow */}
      {withGlow && (
        <>
          <defs>
            <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.08" />
              <stop offset="50%" stopColor={colors.primary} stopOpacity="0.03" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={glowRadius} fill={`url(#${glowId})`} />
        </>
      )}

      {/* Outer orbit - slow */}
      <g className="animate-orbit-slow" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={r1}
          fill="none"
          stroke={colors.primary}
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />
        <circle cx={cx + r1} cy={cy} r={6 * scale} fill={colors.primary} fillOpacity="0.15" />
      </g>

      {/* Middle orbit - medium speed, dashed */}
      <g className="animate-orbit-medium" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={r2}
          fill="none"
          stroke={colors.secondary}
          strokeWidth="0.5"
          strokeOpacity="0.1"
          strokeDasharray="15 8"
        />
        <circle cx={cx + r2} cy={cy} r={8 * scale} fill={colors.secondary} fillOpacity="0.2" />
      </g>

      {/* Inner orbit - reverse direction */}
      <g className="animate-orbit-reverse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={r3}
          fill="none"
          stroke={colors.tertiary}
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />
        <circle cx={cx - r3} cy={cy} r={5 * scale} fill={colors.tertiary} fillOpacity="0.15" />
      </g>
    </g>
  );
}

/**
 * Mini orbital for use in smaller containers (cards, icons, etc)
 */
interface MiniOrbitalProps {
  cx?: number;
  cy?: number;
  variant?: "indigo" | "pending" | "success" | "error";
  size?: number;
}

export function MiniOrbitalSVG({
  cx = 32,
  cy = 32,
  variant = "indigo",
  size = 64,
}: MiniOrbitalProps) {
  const colors = colorThemes[variant];
  const scale = size / 64;
  const r1 = 20 * scale;

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
      <g className="animate-orbit-fast" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={r1}
          fill="none"
          stroke={colors.primary}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        <circle cx={cx + r1} cy={cy} r={2 * scale} fill={colors.primary} fillOpacity="0.5" />
      </g>
    </svg>
  );
}

/**
 * Orbital icon wrapper - adds orbiting ring around an icon
 */
interface OrbitalIconWrapperProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "indigo" | "pending" | "success" | "error";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
} as const;

const sizePx = {
  sm: 40,
  md: 64,
  lg: 96,
} as const;

export function OrbitalIconWrapper({
  children,
  size = "md",
  variant = "indigo",
  className = "",
}: OrbitalIconWrapperProps) {
  const colors = colorThemes[variant];
  const px = sizePx[size];
  const center = px / 2;
  const outerR = px / 2 - 4;
  const innerR = px / 2 - 14;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Orbiting rings */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${px} ${px}`}>
        <g className="animate-orbit-slow" style={{ transformOrigin: `${center}px ${center}px` }}>
          <circle
            cx={center}
            cy={center}
            r={outerR}
            fill="none"
            stroke={colors.primary}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          <circle
            cx={center + outerR}
            cy={center}
            r={px / 24}
            fill={colors.primary}
            fillOpacity="0.5"
          />
        </g>
        <g className="animate-orbit-reverse" style={{ transformOrigin: `${center}px ${center}px` }}>
          <circle
            cx={center}
            cy={center}
            r={innerR}
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeDasharray="6 4"
          />
          <circle
            cx={center - innerR}
            cy={center}
            r={px / 32}
            fill={colors.secondary}
            fillOpacity="0.6"
          />
        </g>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
