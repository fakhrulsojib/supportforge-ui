/**
 * ModelSelector — interactive chat model & embedding model switcher.
 *
 * Admins can switch between available chat and embedding models via
 * dropdowns. Both selections persist per-tenant in the database.
 *
 * On mount, fetches the model list from the API. Model changes are
 * applied immediately via PUT and take effect for subsequent requests.
 *
 * Embedding model change shows a warning: future ingestions will use
 * the newly selected model; existing embeddings are NOT re-processed.
 *
 * Security:
 * - Admin-only (parent AdminPage enforces RBAC)
 * - All API calls through the shared client (JWT auth)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { listModels, setActiveModel } from '../../api/modelsApi'
import { extractErrorMessage } from '../../api/client'

export default function ModelSelector() {
  const [providers, setProviders] = useState([])
  const [activeModel, setActiveModelState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Chat model state
  const [isSwitchingChat, setIsSwitchingChat] = useState(false)
  const [chatSuccess, setChatSuccess] = useState('')
  const [chatError, setChatError] = useState(null)
  const chatTimerRef = useRef(null)

  // Embedding model state
  const [isSwitchingEmbed, setIsSwitchingEmbed] = useState(false)
  const [embedSuccess, setEmbedSuccess] = useState('')
  const [embedError, setEmbedError] = useState(null)
  const embedTimerRef = useRef(null)

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(chatTimerRef.current)
    clearTimeout(embedTimerRef.current)
  }, [])

  /** Fetch available models on mount. */
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await listModels()
      setProviders(data.providers || [])
      setActiveModelState(data.active_model || null)
      setChatError(null)
      setEmbedError(null)
    } catch (err) {
      setChatError(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  /** Handle chat model selection change. */
  const handleChatModelChange = useCallback(async (e) => {
    const selectedId = e.target.value
    if (!selectedId || !activeModel) return
    if (selectedId === activeModel.model_id) return

    try {
      setIsSwitchingChat(true)
      setChatError(null)
      setChatSuccess('')
      clearTimeout(chatTimerRef.current)

      const result = await setActiveModel(activeModel.provider, selectedId, 'chat')
      setActiveModelState(prev => ({
        ...prev,
        model_id: result.model_id,
      }))
      setChatSuccess(`Switched to ${result.model_id}`)
      chatTimerRef.current = setTimeout(() => setChatSuccess(''), 3000)
    } catch (err) {
      setChatError(extractErrorMessage(err))
    } finally {
      setIsSwitchingChat(false)
    }
  }, [activeModel])

  /** Handle embedding model selection change. */
  const handleEmbedModelChange = useCallback(async (e) => {
    const selectedId = e.target.value
    if (!selectedId || !activeModel) return
    if (selectedId === activeModel.embedding_model_id) return

    try {
      setIsSwitchingEmbed(true)
      setEmbedError(null)
      setEmbedSuccess('')
      clearTimeout(embedTimerRef.current)

      const result = await setActiveModel(activeModel.provider, selectedId, 'embedding')
      setActiveModelState(prev => ({
        ...prev,
        embedding_model_id: result.model_id,
      }))
      setEmbedSuccess(`Switched to ${result.model_id}`)
      embedTimerRef.current = setTimeout(() => setEmbedSuccess(''), 3000)
    } catch (err) {
      setEmbedError(extractErrorMessage(err))
    } finally {
      setIsSwitchingEmbed(false)
    }
  }, [activeModel])

  // Flatten models from all providers
  const allChatModels = providers.flatMap((p) =>
    p.models.map((m) => ({ ...m, provider: p.id, providerName: p.name }))
  )
  const allEmbedModels = providers.flatMap((p) =>
    (p.embedding_models || []).map((m) => ({ ...m, provider: p.id, providerName: p.name }))
  )

  const SuccessIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
                id="admin-chat-model-select"
                value={activeModel?.model_id || ''}
                onChange={handleChatModelChange}
                disabled={isSwitchingChat || allChatModels.length === 0}
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
            {isSwitchingChat && (
              <span className="admin-model-status admin-model-switching">Switching…</span>
            )}
            {chatSuccess && (
              <span className="admin-model-status admin-model-success">
                <SuccessIcon />{chatSuccess}
              </span>
            )}
            {chatError && (
              <span className="admin-model-status admin-model-error">{chatError}</span>
            )}
          </div>
        </div>

        {/* Embedding Model Card — Interactive */}
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
            {isLoading ? (
              <span className="admin-model-name admin-model-loading">Loading…</span>
            ) : (
              <>
                <select
                  className="admin-model-select"
                  id="admin-embed-model-select"
                  value={activeModel?.embedding_model_id || ''}
                  onChange={handleEmbedModelChange}
                  disabled={isSwitchingEmbed || allEmbedModels.length === 0}
                  aria-label="Select embedding model"
                >
                  {allEmbedModels.length === 0 && (
                    <option value="">No models available</option>
                  )}
                  {allEmbedModels.map((m) => (
                    <option key={`${m.provider}-${m.id}`} value={m.id}>
                      {m.name} ({m.size_gb} GB)
                    </option>
                  ))}
                </select>
                <span className="admin-model-hint">
                  Only future ingestions will use the newly selected model
                </span>
              </>
            )}
            {isSwitchingEmbed && (
              <span className="admin-model-status admin-model-switching">Switching…</span>
            )}
            {embedSuccess && (
              <span className="admin-model-status admin-model-success">
                <SuccessIcon />{embedSuccess}
              </span>
            )}
            {embedError && (
              <span className="admin-model-status admin-model-error">{embedError}</span>
            )}
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
