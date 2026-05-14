/**
 * TemperatureSlider — per-tenant LLM temperature configuration.
 *
 * Allows tenant admins to adjust the LLM temperature (0.0–1.0)
 * which controls response creativity vs. determinism.
 *
 * Security:
 * - PATCH is admin-only (enforced by backend RBAC)
 * - Tenant ID from AuthContext (JWT), never from user input
 * - No sensitive data logged or displayed
 *
 * API:
 * - GET /api/v1/tenants/{tenantId} → read current config_json
 * - PATCH /api/v1/tenants/{tenantId} → save updated config_json
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getTenantConfig, updateTenantConfig } from '../../api/tenantApi'
import { extractErrorMessage } from '../../api/client'

/** Default temperature when tenant has no config. */
const DEFAULT_TEMPERATURE = 0.2

export default function TemperatureSlider() {
  const { user } = useAuth()
  const tenantId = user?.tenantId || ''

  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE)
  const [savedTemperature, setSavedTemperature] = useState(DEFAULT_TEMPERATURE)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // ── Load current config on mount ─────────────────────────────
  useEffect(() => {
    if (!tenantId) return

    let cancelled = false
    async function loadConfig() {
      try {
        const data = await getTenantConfig(tenantId)
        const saved = data?.config_json?.temperature
        if (!cancelled && typeof saved === 'number' && saved >= 0 && saved <= 1) {
          setTemperature(saved)
          setSavedTemperature(saved)
        }
      } catch {
        // Non-critical — use default
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadConfig()
    return () => { cancelled = true }
  }, [tenantId])

  // ── Auto-dismiss success message ─────────────────────────────
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [success])

  // ── Save handler ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!tenantId || isSaving) return
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Read current config first, then merge temperature into it
      const current = await getTenantConfig(tenantId)
      const mergedConfig = { ...(current?.config_json || {}), temperature }
      await updateTenantConfig(tenantId, mergedConfig)
      setSavedTemperature(temperature)
      setSuccess(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }, [tenantId, temperature, isSaving])

  const hasChanges = temperature !== savedTemperature
  const label = temperature <= 0.2
    ? 'Precise'
    : temperature <= 0.5
      ? 'Balanced'
      : temperature <= 0.8
        ? 'Creative'
        : 'Very Creative'

  if (isLoading) {
    return (
      <div className="admin-temp-card sf-card">
        <div className="admin-temp-loading">Loading configuration…</div>
      </div>
    )
  }

  return (
    <div className="admin-temp-card sf-card">
      <div className="admin-temp-header">
        <div className="admin-temp-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9V3m0 0L9 6m3-3l3 3M12 15v6m0 0l3-3m-3 3l-3-3M21 12h-6m6 0l-3-3m3 3l-3 3M3 12h6M3 12l3 3m-3-3l3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="admin-temp-info">
          <span className="admin-model-label">Response Temperature</span>
          <span className="admin-temp-value">
            {temperature.toFixed(1)}
            <span className="admin-temp-label-tag">{label}</span>
          </span>
        </div>
      </div>

      <div className="admin-temp-slider-wrap">
        <input
          type="range"
          id="admin-temperature-slider"
          className="admin-temp-slider"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          aria-label="LLM temperature"
        />
        <div className="admin-temp-range-labels">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <div className="admin-temp-actions">
        <button
          type="button"
          className="sf-btn sf-btn-primary admin-temp-save-btn"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          id="admin-save-temperature"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>

        {error && (
          <span className="admin-temp-error" role="alert">{error}</span>
        )}
        {success && (
          <span className="admin-temp-success" role="status">Saved ✓</span>
        )}
      </div>
    </div>
  )
}
