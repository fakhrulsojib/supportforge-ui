/**
 * TopicCloud — displays top intents as proportionally sized tags.
 *
 * Props:
 * @param {Array<{ name: string, count: number }>} intents
 * @param {boolean} isLoading
 */

import { useMemo } from 'react'

/** Number of color variants defined in analytics.css */
const COLOR_VARIANT_COUNT = 10

/**
 * Map an intent name from a raw filename to a clean Title Case label.
 * Strips leading number prefixes (01-, 02-), file extensions (.md, .pdf),
 * converts hyphens/underscores to spaces, and Title Cases the result.
 * @param {string} name
 * @returns {string}
 */
function formatIntentName(name) {
  if (!name) return ''
  return name
    // Strip common file extensions
    .replace(/\.(md|pdf|csv|txt|docx?)$/i, '')
    // Strip leading number prefix like "01-" or "02_"
    .replace(/^\d+[-_]\s*/, '')
    // Convert hyphens and underscores to spaces
    .replace(/[-_]/g, ' ')
    // Title case each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Compute a font size based on relative frequency.
 * Range: 0.75rem (--sf-text-xs) → 1.5rem (--sf-text-2xl)
 * @param {number} count
 * @param {number} maxCount
 * @param {number} minCount
 * @returns {string}
 */
function computeFontSize(count, minCount, maxCount) {
  if (maxCount === minCount) return '1rem'
  const ratio = (count - minCount) / (maxCount - minCount)
  // Linear interpolation: 0.75rem → 1.5rem
  const size = 0.75 + ratio * 0.75
  return `${size}rem`
}

export default function TopicCloud({ intents = [], isLoading = false }) {
  const { sortedIntents, minCount, maxCount } = useMemo(() => {
    if (!intents.length) return { sortedIntents: [], minCount: 0, maxCount: 0 }
    const sorted = [...intents].sort((a, b) => b.count - a.count)
    return {
      sortedIntents: sorted,
      minCount: sorted[sorted.length - 1].count,
      maxCount: sorted[0].count,
    }
  }, [intents])

  // ── Loading skeleton ────────────────────────────────────────

  if (isLoading) {
    return <div className="analytics-skeleton analytics-skeleton--cloud" />
  }

  // ── Empty state ─────────────────────────────────────────────

  if (!sortedIntents.length) {
    return (
      <div className="analytics-empty">
        <svg className="analytics-empty-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
          <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="analytics-empty-text">
          No intent data available yet.
          <br />
          Topics will appear as conversations are analyzed.
        </p>
      </div>
    )
  }

  return (
    <div className="topic-cloud" role="list" aria-label="Top conversation intents">
      {sortedIntents.map((intent, index) => (
        <span
          key={intent.name}
          className={`topic-tag topic-tag--${index % COLOR_VARIANT_COUNT}`}
          style={{ '--topic-size': computeFontSize(intent.count, minCount, maxCount) }}
          role="listitem"
          title={`${formatIntentName(intent.name)}: ${intent.count} occurrences`}
        >
          <span className="topic-tag-name">{formatIntentName(intent.name)}</span>
          <span className="topic-tag-count">{intent.count}</span>
        </span>
      ))}
    </div>
  )
}
