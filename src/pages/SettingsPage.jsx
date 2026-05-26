/**
 * SettingsPage — Tenant admin configuration panel.
 *
 * Tabs: Agent | LLM Provider | Tools | Secrets | Event Hooks | Widget & Branding | Moderation
 *
 * Security:
 * - Admin-only access guard
 * - Tenant scoping via user.tenantId from JWT
 * - No secrets or tokens rendered or logged
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTenantConfig, updateTenantConfig } from '../api/settingsApi'
import { extractErrorMessage } from '../api/client'
import AgentTab from '../components/settings/AgentTab'
import LLMProviderTab from '../components/settings/LLMProviderTab'
import ToolsTab from '../components/settings/ToolsTab'
import SecretsTab from '../components/settings/SecretsTab'
import EventHooksTab from '../components/settings/EventHooksTab'
import WidgetTab from '../components/settings/WidgetTab'
import ModerationTab from '../components/settings/ModerationTab'
import '../styles/settings.css'

const TABS = [
  { key: 'agent', label: 'Agent' },
  { key: 'llm', label: 'LLM Provider' },
  { key: 'tools', label: 'Tools' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'hooks', label: 'Event Hooks' },
  { key: 'widget', label: 'Widget & Branding' },
  { key: 'moderation', label: 'Moderation' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [activeTab, setActiveTab] = useState('agent')
  const [configJson, setConfigJson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  // ── Fetch Config ──────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    if (!user?.tenantId) return
    setLoading(true)
    setError('')
    try {
      const data = await getTenantConfig(user.tenantId)
      setConfigJson(data.config_json || {})
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [user?.tenantId])

  useEffect(() => {
    if (isAdmin) {
      fetchConfig()
    }
  }, [isAdmin, fetchConfig])

  // ── Toast Auto-dismiss ────────────────────────────────────────

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // ── Config Update Handler ─────────────────────────────────────

  const handleChange = useCallback((updates) => {
    setConfigJson((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleSave = useCallback(
    async (updatedConfig) => {
      if (!user?.tenantId) return
      setSaving(true)
      try {
        const payload = updatedConfig || configJson
        const data = await updateTenantConfig(user.tenantId, payload)
        setConfigJson(data.config_json || {})
        setToast({ type: 'success', message: 'Settings saved successfully' })
      } catch (err) {
        setToast({ type: 'error', message: extractErrorMessage(err) })
      } finally {
        setSaving(false)
      }
    },
    [user?.tenantId, configJson],
  )

  // ── Tab Props ─────────────────────────────────────────────────
  const tabProps = useMemo(() => ({
    config: configJson || {},
    onChange: handleChange,
    onSave: handleSave,
    saving,
    tenantId: user?.tenantId,
  }), [configJson, handleChange, handleSave, saving, user?.tenantId])

  // ── Access Denied ─────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <svg className="admin-access-denied-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
            <path d="M22 22l20 20M42 22L22 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h2 className="admin-access-denied-title">Access Restricted</h2>
          <p className="admin-access-denied-text">
            Settings are only available to administrators.
          </p>
          <button
            type="button"
            className="sf-btn sf-btn-primary"
            onClick={() => navigate('/')}
            id="settings-back-to-chat"
          >
            Back to Chat
          </button>
        </div>
      </div>
    )
  }



  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="admin-page" id="settings-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">Settings</h1>
          <p className="admin-subtitle">
            Configure your tenant's agent, LLM, tools, and branding
          </p>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          className={`settings-toast settings-toast-${toast.type}`}
          role="status"
          aria-live="polite"
          id="settings-toast"
        >
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            className="settings-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Bar */}
      {error && (
        <div className="admin-error-bar" role="alert" id="settings-error">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="admin-empty-state" id="settings-loading">
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      {!loading && !error && configJson && (
        <>
          <div className="settings-tabs" role="tablist" aria-label="Settings categories">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                className={`settings-tab ${activeTab === tab.key ? 'settings-tab-active' : ''}`}
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                id={`settings-tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="settings-tab-content" role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`}>
            {activeTab === 'agent' && <AgentTab {...tabProps} />}
            {activeTab === 'llm' && <LLMProviderTab {...tabProps} />}
            {activeTab === 'tools' && <ToolsTab {...tabProps} />}
            {activeTab === 'secrets' && <SecretsTab {...tabProps} />}
            {activeTab === 'hooks' && <EventHooksTab {...tabProps} />}
            {activeTab === 'widget' && <WidgetTab {...tabProps} />}
            {activeTab === 'moderation' && <ModerationTab {...tabProps} />}
          </div>
        </>
      )}
    </div>
  )
}
