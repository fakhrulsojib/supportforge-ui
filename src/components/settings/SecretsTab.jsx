/**
 * SecretsTab — secret key management.
 *
 * Lists secret key names, allows adding new secrets and deleting existing ones.
 * Secrets are saved immediately via API (no per-tab save button).
 */

import { useCallback, useEffect, useState } from 'react'
import { listSecrets, createSecret, deleteSecret } from '../../api/settingsApi'
import { extractErrorMessage } from '../../api/client'

/**
 * @param {{ tenantId: string }} props
 */
export default function SecretsTab({ tenantId }) {
  const [secrets, setSecrets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingKey, setDeletingKey] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Fetch Secrets ──────────────────────────────────────────────

  const fetchSecrets = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const data = await listSecrets(tenantId)
      const keys = data.secrets || data.keys || []
      // Normalize to array of strings
      setSecrets(keys.map((k) => (typeof k === 'string' ? k : k.key)))
      setError('')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchSecrets()
  }, [fetchSecrets])

  // ── Add Secret ─────────────────────────────────────────────────

  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault()
      if (!newKey.trim() || !newValue.trim()) return
      setAdding(true)
      try {
        await createSecret(tenantId, newKey.trim(), newValue.trim())
        setNewKey('')
        setNewValue('')
        await fetchSecrets()
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setAdding(false)
      }
    },
    [tenantId, newKey, newValue, fetchSecrets],
  )

  // ── Delete Secret ──────────────────────────────────────────────

  const handleDelete = useCallback(
    async (key) => {
      setDeletingKey(key)
      try {
        await deleteSecret(tenantId, key)
        setDeleteConfirm(null)
        await fetchSecrets()
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setDeletingKey(null)
      }
    },
    [tenantId, fetchSecrets],
  )

  return (
    <div className="settings-panel">
      <div className="settings-info-box">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
        <p>
          Secrets are encrypted at rest. Values cannot be displayed after creation.
          Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="admin-error-bar" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Secrets Table */}
      {loading ? (
        <div className="admin-empty-state">
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
        </div>
      ) : (
        <div className="settings-secrets-table-wrap">
          <table className="settings-secrets-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {secrets.length === 0 && (
                <tr>
                  <td colSpan={3} className="settings-secrets-empty">
                    No secrets configured yet.
                  </td>
                </tr>
              )}
              {secrets.map((key) => (
                <tr key={key}>
                  <td>
                    <code className="settings-secret-key">{key}</code>
                  </td>
                  <td>
                    <span className="settings-secret-masked">••••••••</span>
                  </td>
                  <td>
                    {deleteConfirm === key ? (
                      <div className="settings-confirm-group">
                        <button
                          type="button"
                          className="sf-btn sf-btn-danger sf-btn-sm"
                          onClick={() => handleDelete(key)}
                          disabled={deletingKey === key}
                        >
                          {deletingKey === key ? '…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="sf-btn sf-btn-ghost sf-btn-sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="sf-btn sf-btn-ghost sf-btn-sm settings-delete-btn"
                        onClick={() => setDeleteConfirm(key)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Secret Form */}
      <form className="settings-secrets-add" onSubmit={handleAdd}>
        <h3 className="settings-subheading">Add Secret</h3>
        <div className="settings-field-row">
          <div className="settings-field">
            <label htmlFor="secret-new-key" className="settings-label">
              Key
            </label>
            <input
              id="secret-new-key"
              type="text"
              className="settings-input"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="api_key"
              autoComplete="off"
            />
          </div>
          <div className="settings-field">
            <label htmlFor="secret-new-value" className="settings-label">
              Value
            </label>
            <input
              id="secret-new-value"
              type="password"
              className="settings-input"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter secret value…"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="sf-btn sf-btn-primary sf-btn-sm settings-secrets-add-btn"
            disabled={adding || !newKey.trim() || !newValue.trim()}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
