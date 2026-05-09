/**
 * LoadingSpinner — reusable spinner with size variants.
 *
 * Usage:
 *   <LoadingSpinner />           — medium (default)
 *   <LoadingSpinner size="sm" /> — small
 *   <LoadingSpinner size="lg" /> — large
 *   <LoadingSpinner label="Loading documents..." /> — custom screen reader text
 */

/** Size configuration map (width, height, border-width). */
const SIZES = {
  sm: { dimension: 16, border: 2 },
  md: { dimension: 24, border: 2.5 },
  lg: { dimension: 40, border: 3 },
}

/**
 * @param {{ size?: 'sm'|'md'|'lg', label?: string, className?: string }} props
 */
export default function LoadingSpinner({
  size = 'md',
  label = 'Loading…',
  className = '',
}) {
  const config = SIZES[size] || SIZES.md

  return (
    <div
      className={`loading-spinner ${className}`}
      role="status"
      aria-label={label}
    >
      <svg
        className="loading-spinner-svg"
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner-track"
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={(config.dimension - config.border * 2) / 2}
          strokeWidth={config.border}
        />
        <circle
          className="loading-spinner-arc"
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={(config.dimension - config.border * 2) / 2}
          strokeWidth={config.border}
          strokeDasharray={`${Math.PI * (config.dimension - config.border * 2) * 0.3} ${Math.PI * (config.dimension - config.border * 2)}`}
        />
      </svg>
      <span className="sf-visually-hidden">{label}</span>
    </div>
  )
}
