/**
 * ConversationChart — SVG line chart showing conversations & messages per day.
 *
 * Uses pure SVG (no chart library) per the implementation plan.
 * Renders a dual-line chart with area fills, grid lines, axis labels,
 * and hover tooltips.
 *
 * Props:
 * @param {Array<{ date: string, total_conversations: number, total_messages: number }>} data
 * @param {boolean} isLoading
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import { formatDate } from '../../utils/formatters'

/** SVG layout constants */
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 }
const SVG_WIDTH = 700
const SVG_HEIGHT = 280
const CHART_W = SVG_WIDTH - PADDING.left - PADDING.right
const CHART_H = SVG_HEIGHT - PADDING.top - PADDING.bottom

/** Number of horizontal grid lines. */
const GRID_LINES = 5

/**
 * Compute an aesthetically pleasing maximum for the Y axis.
 * @param {number} maxVal
 * @returns {number}
 */
function niceMax(maxVal) {
  if (maxVal <= 0) return 10
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)))
  const residual = maxVal / magnitude
  if (residual <= 1) return magnitude
  if (residual <= 2) return 2 * magnitude
  if (residual <= 5) return 5 * magnitude
  return 10 * magnitude
}

export default function ConversationChart({ data = [], isLoading = false }) {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, item: null })

  // ── Compute chart geometry ──────────────────────────────────

  const { maxY, points, xLabels } = useMemo(() => {
    if (!data.length) {
      return { maxY: 10, points: [], xLabels: [] }
    }

    const maxConv = Math.max(...data.map((d) => d.total_conversations), 0)
    const maxMsg = Math.max(...data.map((d) => d.total_messages), 0)
    const yMax = niceMax(Math.max(maxConv, maxMsg))

    const pts = data.map((d, i) => {
      const x = PADDING.left + (data.length === 1 ? CHART_W / 2 : (i / (data.length - 1)) * CHART_W)
      const yConv = PADDING.top + CHART_H - (d.total_conversations / yMax) * CHART_H
      const yMsg = PADDING.top + CHART_H - (d.total_messages / yMax) * CHART_H
      return { ...d, x, yConv, yMsg, index: i }
    })

    // Sample ~6 labels along X axis
    const step = Math.max(1, Math.floor(data.length / 6))
    const labels = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d, _, arr) => {
        const idx = data.indexOf(d)
        const x = PADDING.left + (data.length === 1 ? CHART_W / 2 : (idx / (data.length - 1)) * CHART_W)
        return { x, label: formatDate(d.date, { month: 'short', day: 'numeric' }) }
      })

    return { maxY: yMax, points: pts, xLabels: labels }
  }, [data])

  // ── Build path strings ──────────────────────────────────────

  const convLine = useMemo(() => {
    if (!points.length) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yConv}`).join(' ')
  }, [points])

  const msgLine = useMemo(() => {
    if (!points.length) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yMsg}`).join(' ')
  }, [points])

  const convArea = useMemo(() => {
    if (!points.length) return ''
    const baseline = PADDING.top + CHART_H
    return `${convLine} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`
  }, [points, convLine])

  const msgArea = useMemo(() => {
    if (!points.length) return ''
    const baseline = PADDING.top + CHART_H
    return `${msgLine} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`
  }, [points, msgLine])

  // ── Tooltip handlers ────────────────────────────────────────

  const handleDotEnter = useCallback((e, item) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientRect = e.target.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: clientRect.left + clientRect.width / 2 - rect.left,
      y: clientRect.top - rect.top,
      item,
    })
  }, [])

  const handleDotLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  // ── Loading skeleton ────────────────────────────────────────

  if (isLoading) {
    return <div className="analytics-skeleton analytics-skeleton--chart" />
  }

  // ── Empty state ─────────────────────────────────────────────

  if (!data.length) {
    return (
      <div className="analytics-empty">
        <svg className="analytics-empty-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="6" y="6" width="36" height="36" rx="6" stroke="currentColor" strokeWidth="2" />
          <path d="M14 34L22 22L28 28L38 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="analytics-empty-text">
          No conversation data available yet.
          <br />
          Analytics will appear once conversations are recorded.
        </p>
      </div>
    )
  }

  // ── Y-axis labels ───────────────────────────────────────────

  const yLabels = Array.from({ length: GRID_LINES + 1 }, (_, i) => {
    const value = Math.round((maxY / GRID_LINES) * (GRID_LINES - i))
    const y = PADDING.top + (i / GRID_LINES) * CHART_H
    return { value, y }
  })

  return (
    <div className="chart-container" ref={containerRef}>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Conversations and messages per day chart"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="chart-gradient-primary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sf-color-primary-500)" />
            <stop offset="100%" stopColor="var(--sf-color-primary-500)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chart-gradient-secondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sf-color-secondary-500)" />
            <stop offset="100%" stopColor="var(--sf-color-secondary-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {yLabels.map((l) => (
          <g key={l.value}>
            <line
              className="chart-grid-line"
              x1={PADDING.left}
              y1={l.y}
              x2={PADDING.left + CHART_W}
              y2={l.y}
            />
            <text className="chart-axis-label" x={PADDING.left - 8} y={l.y + 4} textAnchor="end">
              {l.value}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            className="chart-axis-label"
            x={l.x}
            y={PADDING.top + CHART_H + 24}
            textAnchor="middle"
          >
            {l.label}
          </text>
        ))}

        {/* Area fills */}
        <path className="chart-area-conversations" d={convArea} />
        <path className="chart-area-messages" d={msgArea} />

        {/* Lines */}
        <path className="chart-line-conversations" d={convLine} />
        <path className="chart-line-messages" d={msgLine} />

        {/* Data points */}
        {points.map((p) => (
          <g key={`dot-${p.index}`}>
            <circle
              className="chart-dot chart-dot--conversations"
              cx={p.x}
              cy={p.yConv}
              r={3.5}
              onMouseEnter={(e) => handleDotEnter(e, p)}
              onMouseLeave={handleDotLeave}
            />
            <circle
              className="chart-dot chart-dot--messages"
              cx={p.x}
              cy={p.yMsg}
              r={3}
              onMouseEnter={(e) => handleDotEnter(e, p)}
              onMouseLeave={handleDotLeave}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      <div
        className={`chart-tooltip ${tooltip.visible ? 'chart-tooltip--visible' : ''}`}
        style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        aria-hidden="true"
      >
        {tooltip.item && (
          <>
            <div className="chart-tooltip-date">
              {formatDate(tooltip.item.date, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-dot chart-tooltip-dot--conversations" />
              {tooltip.item.total_conversations} conversations
            </div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-dot chart-tooltip-dot--messages" />
              {tooltip.item.total_messages} messages
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-swatch chart-legend-swatch--conversations" />
          Conversations
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-swatch chart-legend-swatch--messages" />
          Messages
        </div>
      </div>
    </div>
  )
}
