/**
 * ReviewPage — Admin-only feedback review queue.
 *
 * Tabs: Negative Feedback | Escalations | Flagged Messages
 * Each tab shows a paginated, filterable table with "Mark Reviewed" actions.
 * Rows are expandable to reveal full Q&A, sources, and reviewer info.
 *
 * Security:
 * - Role guard: only admin users can view this page
 * - No tokens or sensitive data rendered or logged
 * - Tenant isolation enforced by the API layer
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getNegativeFeedback,
  getEscalations,
  getFlaggedMessages,
  markReviewed,
  getReviewStats,
} from '../api/reviewApi'
import '../styles/review.css'

const TABS = [
  { key: 'negative', label: 'Negative Feedback' },
  { key: 'escalations', label: 'Escalations' },
  { key: 'flagged', label: 'Flagged Messages' },
]

const PAGE_SIZE = 20

/**
 * Format a UTC date string to a human-readable local date/time.
 * @param {string|null} iso — ISO date string
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate text to a max length with ellipsis.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max = 80) {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/**
 * Format an escalation trigger value for display.
 * @param {string} trigger
 * @returns {string}
 */
function formatTrigger(trigger) {
  if (!trigger) return '—'
  return trigger
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ReviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState('negative')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reviewedFilter, setReviewedFilter] = useState('unreviewed')
  const [stats, setStats] = useState(null)
  const [markingIds, setMarkingIds] = useState(new Set())
  const [expandedId, setExpandedId] = useState(null)

  // ── Fetch Stats ──────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const data = await getReviewStats()
      setStats(data)
    } catch {
      // stats badge is non-critical
    }
  }, [])

  // ── Fetch Tab Data ───────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')

    const reviewed =
      reviewedFilter === 'all' ? undefined :
      reviewedFilter === 'reviewed' ? true : false

    try {
      let data
      if (activeTab === 'negative') {
        data = await getNegativeFeedback({ reviewed, limit: PAGE_SIZE, offset })
      } else if (activeTab === 'escalations') {
        data = await getEscalations({ limit: PAGE_SIZE, offset })
      } else {
        data = await getFlaggedMessages({ reviewed, limit: PAGE_SIZE, offset })
      }
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load review data')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, reviewedFilter, offset])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
      fetchStats()
    }
  }, [isAdmin, fetchData, fetchStats])

  // Reset offset and collapse when switching tabs or filters
  useEffect(() => {
    setOffset(0)
    setExpandedId(null)
  }, [activeTab, reviewedFilter])

  // ── Mark Reviewed ────────────────────────────────────────────

  async function handleMarkReviewed(messageId) {
    setMarkingIds((prev) => new Set(prev).add(messageId))
    try {
      await markReviewed(messageId)
      // Refresh data and stats
      await Promise.all([fetchData(), fetchStats()])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to mark as reviewed')
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    }
  }

  // ── Toggle Row Expand ────────────────────────────────────────

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ── Access Denied ────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <svg className="admin-access-denied-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h2 className="admin-access-denied-title">Access Denied</h2>
          <p className="admin-access-denied-text">
            The Review Queue is only available to administrators.
          </p>
        </div>
      </div>
    )
  }

  // ── Tab Badge Counts ─────────────────────────────────────────

  function getTabBadge(tabKey) {
    if (!stats) return null
    const counts = {
      negative: stats.unreviewed_negative,
      escalations: stats.open_escalations,
      flagged: stats.unreviewed_flagged,
    }
    const count = counts[tabKey]
    if (!count) return null
    return (
      <span
        className={`review-tab-badge ${count > 0 ? 'review-tab-badge-alert' : ''}`}
      >
        {count}
      </span>
    )
  }

  // ── Pagination ───────────────────────────────────────────────

  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const pageStart = total > 0 ? offset + 1 : 0
  const pageEnd = Math.min(offset + PAGE_SIZE, total)

  // ── Detail Panel for Negative/Flagged ────────────────────────

  function renderDetailPanel(item) {
    const sources = item.sources_json || []
    return (
      <tr className="review-detail-row" key={`${item.message_id}-detail`}>
        <td colSpan={6} className="review-detail-cell">
          <div className="review-detail-panel">
            {/* Full Question */}
            <div className="review-detail-section">
              <h4 className="review-detail-label">User Question</h4>
              <p className="review-detail-text">{item.user_question || '—'}</p>
            </div>

            {/* Full AI Answer */}
            <div className="review-detail-section">
              <h4 className="review-detail-label">AI Answer</h4>
              <p className="review-detail-text review-detail-answer">{item.ai_answer || '—'}</p>
            </div>

            {/* Source Citations */}
            {sources.length > 0 && (
              <div className="review-detail-section">
                <h4 className="review-detail-label">Sources Referenced</h4>
                <div className="review-detail-sources">
                  {sources.map((s, i) => (
                    <span key={i} className="review-detail-source-tag">
                      📄 {s.filename || `Doc ${i + 1}`}
                      {s.score != null && (
                        <span className="review-detail-source-score">
                          {(s.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Moderation Reason (Flagged only) */}
            {item.moderation_reason && (
              <div className="review-detail-section">
                <h4 className="review-detail-label">Moderation Reason</h4>
                <p className="review-detail-text review-detail-moderation">
                  {item.moderation_reason}
                  {item.moderation_matched_term && (
                    <span className="review-detail-matched-term">
                      Matched: &quot;{item.moderation_matched_term}&quot;
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Reviewer Info */}
            {item.reviewed_at && (
              <div className="review-detail-section">
                <h4 className="review-detail-label">Review Audit</h4>
                <p className="review-detail-text review-detail-audit">
                  ✓ Reviewed on {formatDate(item.reviewed_at)}
                  {item.reviewed_by && (
                    <span className="review-detail-reviewer"> by {item.reviewed_by.slice(0, 8)}…</span>
                  )}
                </p>
              </div>
            )}

            {/* Conversation Link */}
            <div className="review-detail-actions">
              <a
                href={`/chat?conversation=${item.conversation_id}`}
                className="review-detail-link"
                title="View full conversation in chat"
              >
                💬 View Conversation
              </a>
              {!item.reviewed_at && (
                <button
                  type="button"
                  className="review-mark-btn review-mark-btn-lg"
                  onClick={() => handleMarkReviewed(item.message_id)}
                  disabled={markingIds.has(item.message_id)}
                  id={`review-detail-mark-${item.message_id}`}
                >
                  {markingIds.has(item.message_id) ? '…' : '✓ Mark Reviewed'}
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
    )
  }

  // ── Detail Panel for Escalations ─────────────────────────────

  function renderEscalationDetail(item) {
    return (
      <tr className="review-detail-row" key={`${item.conversation_id}-detail`}>
        <td colSpan={5} className="review-detail-cell">
          <div className="review-detail-panel">
            {/* Full First Message */}
            <div className="review-detail-section">
              <h4 className="review-detail-label">First Message</h4>
              <p className="review-detail-text">{item.first_message || '—'}</p>
            </div>

            {/* Escalation Info */}
            <div className="review-detail-section">
              <h4 className="review-detail-label">Escalation Details</h4>
              <div className="review-detail-meta-grid">
                <div className="review-detail-meta-item">
                  <span className="review-detail-meta-label">Trigger</span>
                  <span className="review-badge review-badge-escalated">
                    {formatTrigger(item.trigger)}
                  </span>
                </div>
                <div className="review-detail-meta-item">
                  <span className="review-detail-meta-label">Status</span>
                  <span className="review-badge review-badge-flagged">
                    {item.status}
                  </span>
                </div>
                <div className="review-detail-meta-item">
                  <span className="review-detail-meta-label">Started</span>
                  <span className="review-cell-time">{formatDate(item.started_at)}</span>
                </div>
              </div>
            </div>

            {/* Conversation Link */}
            <div className="review-detail-actions">
              <button
                type="button"
                className="review-detail-link"
                title="View full conversation in chat"
                onClick={() => navigate(`/chat?conversation=${item.conversation_id}`)}
              >
                💬 View Full Conversation
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="admin-page" id="review-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">Review Queue</h1>
          <p className="admin-subtitle">
            Review negative feedback, escalations, and flagged messages
          </p>
        </div>
        <button
          type="button"
          className="sf-button sf-button-secondary admin-refresh-btn"
          onClick={() => { fetchData(); fetchStats() }}
          disabled={loading}
          id="review-refresh-btn"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 8a6 6 0 0 1 10-4.47"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M14 8a6 6 0 0 1-10 4.47"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M14 14v-4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error Bar */}
      {error && (
        <div className="admin-error-bar" role="alert" id="review-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="review-tabs" role="tablist" aria-label="Review categories">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`review-tab ${activeTab === tab.key ? 'review-tab-active' : ''}`}
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            id={`review-tab-${tab.key}`}
          >
            {tab.label}
            {getTabBadge(tab.key)}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== 'escalations' && (
        <div className="review-filters">
          <div className="review-filter-group">
            <span className="review-filter-label">Status</span>
            <select
              className="review-filter-select"
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value)}
              id="review-filter-status"
            >
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="admin-empty-state" id="review-loading">
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <div className="admin-empty-state" id="review-empty">
          <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="admin-empty-title">All clear!</h3>
          <p className="admin-empty-text">No items to review in this category.</p>
        </div>
      )}

      {/* Table: Negative / Flagged */}
      {!loading && items.length > 0 && activeTab !== 'escalations' && (
        <>
          <p className="review-hint">Click a row to expand details</p>
          <div className="review-table-wrap">
            <table className="review-table" id="review-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}></th>
                  <th>Question</th>
                  <th>AI Answer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Reviewed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isExpanded = expandedId === item.message_id
                  return [
                    <tr
                      key={item.message_id}
                      className={`review-row-clickable ${isExpanded ? 'review-row-expanded' : ''}`}
                      onClick={() => toggleExpand(item.message_id)}
                    >
                      <td className="review-cell-chevron" data-label="">
                        <span className={`review-chevron ${isExpanded ? 'review-chevron-open' : ''}`}>
                          ›
                        </span>
                      </td>
                      <td data-label="Question">
                        <span className="review-cell-question" title={item.user_question}>
                          {truncate(item.user_question, 60)}
                        </span>
                      </td>
                      <td data-label="Answer">
                        <span className="review-cell-answer" title={item.ai_answer}>
                          {truncate(item.ai_answer, 80)}
                        </span>
                      </td>
                      <td data-label="Status">
                        {activeTab === 'negative' && (
                          <span className="review-badge review-badge-negative">👎 Negative</span>
                        )}
                        {activeTab === 'flagged' && (
                          <span className="review-badge review-badge-flagged">⚠ Flagged</span>
                        )}
                      </td>
                      <td data-label="Date">
                        <span className="review-cell-time">{formatDate(item.created_at)}</span>
                      </td>
                      <td data-label="Reviewed">
                        {item.reviewed_at ? (
                          <span className="review-badge review-badge-reviewed">✓ Reviewed</span>
                        ) : (
                          <span className="review-badge review-badge-pending">⏳ Pending</span>
                        )}
                      </td>
                      <td data-label="Action">
                        {item.reviewed_at ? (
                          <button
                            type="button"
                            className="review-mark-btn review-mark-btn-done"
                            disabled
                          >
                            ✓ Done
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="review-mark-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkReviewed(item.message_id)
                            }}
                            disabled={markingIds.has(item.message_id)}
                            id={`review-mark-${item.message_id}`}
                          >
                            {markingIds.has(item.message_id) ? '…' : '✓ Mark Reviewed'}
                          </button>
                        )}
                      </td>
                    </tr>,
                    isExpanded && renderDetailPanel(item),
                  ]
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="review-pagination">
            <span className="review-pagination-info">
              Showing {pageStart}–{pageEnd} of {total}
            </span>
            <div className="review-pagination-controls">
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canPrev}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                id="review-page-prev"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canNext}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                id="review-page-next"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Table: Escalations */}
      {!loading && items.length > 0 && activeTab === 'escalations' && (
        <>
          <p className="review-hint">Click a row to expand details</p>
          <div className="review-table-wrap">
            <table className="review-table" id="review-table-escalations">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}></th>
                  <th>First Message</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isExpanded = expandedId === item.conversation_id
                  return [
                    <tr
                      key={item.conversation_id}
                      className={`review-row-clickable ${isExpanded ? 'review-row-expanded' : ''}`}
                      onClick={() => toggleExpand(item.conversation_id)}
                    >
                      <td className="review-cell-chevron" data-label="">
                        <span className={`review-chevron ${isExpanded ? 'review-chevron-open' : ''}`}>
                          ›
                        </span>
                      </td>
                      <td data-label="Message">
                        <span className="review-cell-question" title={item.first_message}>
                          {truncate(item.first_message, 80)}
                        </span>
                      </td>
                      <td data-label="Trigger">
                        <span className="review-badge review-badge-escalated">
                          {formatTrigger(item.trigger)}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className="review-badge review-badge-flagged">
                          {item.status}
                        </span>
                      </td>
                      <td data-label="Started">
                        <span className="review-cell-time">{formatDate(item.started_at)}</span>
                      </td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="review-mark-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/chat?conversation=${item.conversation_id}`) }}
                        >
                          💬 View Chat
                        </button>
                      </td>
                    </tr>,
                    isExpanded && renderEscalationDetail(item),
                  ]
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="review-pagination">
            <span className="review-pagination-info">
              Showing {pageStart}–{pageEnd} of {total}
            </span>
            <div className="review-pagination-controls">
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canPrev}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                id="review-esc-page-prev"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canNext}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                id="review-esc-page-next"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
