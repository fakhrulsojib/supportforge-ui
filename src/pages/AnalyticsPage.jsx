/**
 * AnalyticsPage — dashboard composing chart, topic cloud, and satisfaction gauge.
 *
 * Composes:
 * - ConversationChart (line chart — conversations/messages per day)
 * - TopicCloud (sized intent tags)
 * - SatisfactionGauge (donut ring)
 *
 * Security:
 * - RBAC guard: only admin/agent roles can access (viewer → redirect)
 * - All data scoped to authenticated user's tenant via backend JWT
 * - No tokens or sensitive data logged to console
 * - Errors displayed inline, no stack traces
 *
 * The API layer handles errors gracefully and displays empty-state UI
 * when endpoints return 404 or are unavailable.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDailyStats, getTopIntents, getSatisfactionRate } from '../api/analyticsApi'
import { extractErrorMessage } from '../api/client'
import ConversationChart from '../components/analytics/ConversationChart'
import TopicCloud from '../components/analytics/TopicCloud'
import SatisfactionGauge from '../components/analytics/SatisfactionGauge'
import '../styles/analytics.css'

/** Date range options for the picker. */
const RANGE_OPTIONS = [
  { label: '1d', days: 1 },
  { label: '3d', days: 3 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

/** Default range: 30 days. */
const DEFAULT_DAYS = 30

export default function AnalyticsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [days, setDays] = useState(DEFAULT_DAYS)
  const [dailyStats, setDailyStats] = useState([])
  const [intents, setIntents] = useState([])
  const [satisfaction, setSatisfaction] = useState(null)
  const [isLoadingChart, setIsLoadingChart] = useState(true)
  const [isLoadingIntents, setIsLoadingIntents] = useState(true)
  const [isLoadingGauge, setIsLoadingGauge] = useState(true)
  const [error, setError] = useState(null)

  // ── RBAC Guard ──────────────────────────────────────────────
  const userRole = user?.role || ''
  const hasAccess = userRole === 'admin' || userRole === 'agent'

  // ── Data Loading ────────────────────────────────────────────

  const loadDailyStats = useCallback(async (rangeDays) => {
    setIsLoadingChart(true)
    try {
      const data = await getDailyStats(rangeDays)
      setDailyStats(data.stats || [])
    } catch (err) {
      // Gracefully handle missing backend endpoints
      if (err.response?.status === 404) {
        setDailyStats([])
      } else {
        setError(extractErrorMessage(err))
      }
    } finally {
      setIsLoadingChart(false)
    }
  }, [])

  const loadIntents = useCallback(async () => {
    setIsLoadingIntents(true)
    try {
      const data = await getTopIntents(10)
      setIntents(data.intents || [])
    } catch (err) {
      if (err.response?.status === 404) {
        setIntents([])
      } else {
        setError(extractErrorMessage(err))
      }
    } finally {
      setIsLoadingIntents(false)
    }
  }, [])

  const loadSatisfaction = useCallback(async () => {
    setIsLoadingGauge(true)
    try {
      const data = await getSatisfactionRate()
      setSatisfaction(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setSatisfaction(null)
      } else {
        setError(extractErrorMessage(err))
      }
    } finally {
      setIsLoadingGauge(false)
    }
  }, [])

  /** Load all analytics data. */
  const loadAll = useCallback((rangeDays) => {
    setError(null)
    loadDailyStats(rangeDays)
    loadIntents()
    loadSatisfaction()
  }, [loadDailyStats, loadIntents, loadSatisfaction])

  /** Initial load + reload on date range change. */
  useEffect(() => {
    if (hasAccess) {
      loadAll(days)
    }
  }, [hasAccess, days, loadAll])

  // ── Date Range Handler ──────────────────────────────────────

  const handleRangeChange = useCallback((newDays) => {
    setDays(newDays)
  }, [])

  // ── Access Denied View ──────────────────────────────────────

  if (!hasAccess) {
    return (
      <div className="analytics-page">
        <div className="analytics-access-denied">
          <svg className="analytics-access-denied-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
            <path d="M22 22l20 20M42 22L22 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h2 className="analytics-access-denied-title">Access Restricted</h2>
          <p className="analytics-access-denied-text">
            The Analytics Dashboard is available to administrators and agents only.
          </p>
          <button
            type="button"
            className="sf-btn sf-btn-primary"
            onClick={() => navigate('/')}
            id="analytics-back-to-chat"
          >
            Back to Chat
          </button>
        </div>
      </div>
    )
  }

  // ── Main Dashboard View ─────────────────────────────────────

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div className="analytics-header-left">
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            Conversation insights, trending topics, and customer satisfaction
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="analytics-range-picker" role="group" aria-label="Date range selector">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              className={`analytics-range-btn ${days === opt.days ? 'analytics-range-btn--active' : ''}`}
              onClick={() => handleRangeChange(opt.days)}
              aria-pressed={days === opt.days}
              id={`analytics-range-${opt.days}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* Error Bar */}
      {error && (
        <div className="analytics-error-bar" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="analytics-grid">
        {/* Conversation Chart — Full Width */}
        <section className="analytics-card analytics-card--full" aria-labelledby="analytics-chart-heading">
          <div className="analytics-card-header">
            <svg className="analytics-card-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5 14l4-5 3 3 4-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="analytics-card-title" id="analytics-chart-heading">
              Conversation Activity
            </h2>
          </div>
          <ConversationChart data={dailyStats} isLoading={isLoadingChart} />
        </section>

        {/* Topic Cloud — Half Width */}
        <section className="analytics-card" aria-labelledby="analytics-topics-heading">
          <div className="analytics-card-header">
            <svg className="analytics-card-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 8h6M7 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <h2 className="analytics-card-title" id="analytics-topics-heading">
              Trending Topics
            </h2>
          </div>
          <TopicCloud intents={intents} isLoading={isLoadingIntents} />
        </section>

        {/* Satisfaction Gauge — Half Width */}
        <section className="analytics-card" aria-labelledby="analytics-satisfaction-heading">
          <div className="analytics-card-header">
            <svg className="analytics-card-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6.5 12.5c1 1.5 2.5 2 3.5 2s2.5-.5 3.5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
              <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
            </svg>
            <h2 className="analytics-card-title" id="analytics-satisfaction-heading">
              Customer Satisfaction
            </h2>
          </div>
          <SatisfactionGauge data={satisfaction} isLoading={isLoadingGauge} />
        </section>
      </div>
    </div>
  )
}
