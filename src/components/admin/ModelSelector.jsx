/**
 * ModelSelector — interactive chat model switcher + read-only embedding display.
 *
 * Admins can switch between available chat models via a dropdown.
 * The embedding model is display-only (not switchable).
 *
 * On mount, fetches the model list from the API. Model changes are
 * applied immediately via PUT and take effect for all subsequent chats.
 *
 * Security:
 * - Admin-only (parent AdminPage enforces RBAC)
 * - No sensitive data displayed (model names are not secrets)
 * - All API calls through the shared client (JWT auth)
 */

import { useState, useEffect, useCallback } from 'react'
import { listModels, setActiveModel } from '../../api/modelsApi'
import { extractErrorMessage } from '../../api/client'
import { EMBEDDING_MODEL } from '../../utils/constants'

export default function ModelSelector() {
  const [providers, setProviders] = useState([])
  const [activeModel, setActiveModelState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  /** Fetch available models on mount. */
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await listModels()
      setProviders(data.providers || [])
      setActiveModelState(data.active_model || null)
      setError(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  /** Handle model selection change. */
  const handleModelChange = useCallback(async (e) => {
    const selectedId = e.target.value
    if (!selectedId || !activeModel) return
    if (selectedId === activeModel.model_id) return

    try {
      setIsSwitching(true)
      setError(null)
      setSuccessMsg('')

      const result = await setActiveModel(activeModel.provider, selectedId)
      setActiveModelState({
        provider: result.provider,
        model_id: result.model_id,
      })
      setSuccessMsg(`Switched to ${result.model_id}`)

      // Clear success message after 3s
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsSwitching(false)
    }
  }, [activeModel])

  // Flatten all models from all providers for the dropdown
  const allChatModels = providers.flatMap((p) =>
    p.models.map((m) => ({ ...m, provider: p.id, providerName: p.name }))
  )

  return (
    <div>
      <div className="admin-model-grid">
        {/* Chat Model Card — Interactive */}
        <div className="sf-card admin-model-card">
          <div className="admin-model-icon admin-model-icon-chat" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="admin-model-info">
            <span className="admin-model-label">Chat Model</span>
            {isLoading ? (
              <span className="admin-model-name admin-model-loading">Loading…</span>
            ) : (
              <select
                className="admin-model-select"
                id="admin-model-select"
                value={activeModel?.model_id || ''}
                onChange={handleModelChange}
                disabled={isSwitching || allChatModels.length === 0}
                aria-label="Select chat model"
              >
                {allChatModels.length === 0 && (
                  <option value="">No models available</option>
                )}
                {allChatModels.map((m) => (
                  <option key={`${m.provider}-${m.id}`} value={m.id}>
                    {m.name} ({m.size_gb} GB)
                  </option>
                ))}
              </select>
            )}
            {isSwitching && (
              <span className="admin-model-status admin-model-switching">
                Switching…
              </span>
            )}
            {successMsg && (
              <span className="admin-model-status admin-model-success">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {successMsg}
              </span>
            )}
            {error && (
              <span className="admin-model-status admin-model-error">
                {error}
              </span>
            )}
          </div>
        </div>

        {/* Embedding Model Card — Read-only */}
        <div className="sf-card admin-model-card">
          <div className="admin-model-icon admin-model-icon-embed" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="admin-model-info">
            <span className="admin-model-label">Embedding Model</span>
            <span className="admin-model-name">{EMBEDDING_MODEL}</span>
          </div>
        </div>
      </div>

      <div className="admin-model-footer">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="admin-model-footer-text">
          Powered by{' '}
          <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
            Ollama
          </a>{' '}
          (self-hosted)
        </span>
      </div>
    </div>
  )
}
