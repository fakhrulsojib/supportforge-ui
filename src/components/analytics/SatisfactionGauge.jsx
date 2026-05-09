/**
 * SatisfactionGauge — SVG donut ring showing positive feedback percentage.
 *
 * The ring animates on mount via CSS transition on stroke-dashoffset.
 * Displays positive, negative, and total counts below the ring.
 *
 * Props:
 * @param {{ positive: number, negative: number, total: number, rate: number }|null} data
 * @param {boolean} isLoading
 */

import { useMemo, useState, useEffect } from 'react'

/** Ring geometry */
const RING_RADIUS = 70
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const CENTER = 90

export default function SatisfactionGauge({ data = null, isLoading = false }) {
  const [mounted, setMounted] = useState(false)

  // Trigger animation after initial mount.
  // Intentionally empty deps — animation plays once on first render.
  // Subsequent data changes update the ring instantly (no re-animation).
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const { positiveOffset, negativeOffset, negativeRotation, percentage } = useMemo(() => {
    if (!data || data.total === 0) {
      return {
        positiveOffset: RING_CIRCUMFERENCE,
        negativeOffset: RING_CIRCUMFERENCE,
        negativeRotation: 0,
        percentage: 0,
      }
    }

    const posRatio = data.positive / data.total
    const negRatio = data.negative / data.total
    const posLen = posRatio * RING_CIRCUMFERENCE
    const negLen = negRatio * RING_CIRCUMFERENCE

    return {
      positiveOffset: RING_CIRCUMFERENCE - posLen,
      negativeOffset: RING_CIRCUMFERENCE - negLen,
      negativeRotation: posRatio * 360,
      percentage: Math.round(data.rate * 100),
    }
  }, [data])

  // ── Loading skeleton ────────────────────────────────────────

  if (isLoading) {
    return <div className="analytics-skeleton analytics-skeleton--gauge" />
  }

  // ── Empty state ─────────────────────────────────────────────

  if (!data || data.total === 0) {
    return (
      <div className="analytics-empty">
        <svg className="analytics-empty-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
          <path d="M16 28c2 3 5 4 8 4s6-1 8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="20" r="1.5" fill="currentColor" />
          <circle cx="30" cy="20" r="1.5" fill="currentColor" />
        </svg>
        <p className="analytics-empty-text">
          No feedback data available yet.
          <br />
          Satisfaction metrics will appear once users submit feedback.
        </p>
      </div>
    )
  }

  return (
    <div className="gauge-container" role="figure" aria-label={`Satisfaction rate: ${percentage}%`}>
      {/* Ring Chart */}
      <div className="gauge-ring-wrapper">
        <svg className="gauge-svg" viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
          {/* Background track */}
          <circle
            className="gauge-track"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
          />

          {/* Positive arc */}
          <circle
            className="gauge-fill-positive"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={mounted ? positiveOffset : RING_CIRCUMFERENCE}
          />

          {/* Negative arc (rotated to start after positive) */}
          <circle
            className="gauge-fill-negative"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={mounted ? negativeOffset : RING_CIRCUMFERENCE}
            style={{ '--gauge-rotate': `${negativeRotation}deg` }}
          />
        </svg>

        {/* Center percentage */}
        <div className="gauge-center">
          <div className="gauge-percentage">{percentage}%</div>
          <div className="gauge-label">satisfaction</div>
        </div>
      </div>

      {/* Stats below ring */}
      <div className="gauge-stats">
        <div className="gauge-stat">
          <span className="gauge-stat-value">{data.positive}</span>
          <span className="gauge-stat-label">
            <span className="gauge-stat-dot gauge-stat-dot--positive" />
            Positive
          </span>
        </div>
        <div className="gauge-stat">
          <span className="gauge-stat-value">{data.negative}</span>
          <span className="gauge-stat-label">
            <span className="gauge-stat-dot gauge-stat-dot--negative" />
            Negative
          </span>
        </div>
        <div className="gauge-stat">
          <span className="gauge-stat-value">{data.total}</span>
          <span className="gauge-stat-label">
            <span className="gauge-stat-dot gauge-stat-dot--total" />
            Total
          </span>
        </div>
      </div>
    </div>
  )
}
