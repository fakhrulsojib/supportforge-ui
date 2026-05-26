/**
 * LLMProviderTab — LLM provider and model configuration.
 *
 * Fields: chat_provider, chat_model, embedding_provider,
 *         embedding_model, temperature
 * API key handling via secrets API for Gemini provider.
 */

import { useCallback, useMemo, useState } from 'react'
import { createSecret, listSecrets } from '../../api/settingsApi'
import { extractErrorMessage } from '../../api/client'

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'gemini', label: 'Google Gemini' },
]

const GEMINI_CHAT_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  { value: 'gemma-4-31b-it', label: 'Gemma 4 31B IT' },
  { value: 'gemma-4-26b-a4b-it', label: 'Gemma 4 26B A4B IT' },
]

const GEMINI_EMBEDDING_MODELS = [
  { value: 'gemini-embedding-2', label: 'Gemini Embedding 2' },
  { value: 'gemini-embedding-001', label: 'Gemini Embedding 001' },
  { value: 'gemini-embedding-2-preview', label: 'Gemini Embedding 2 (Preview)' },
]

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean, tenantId: string }} props
 */
export default function LLMProviderTab({ config, onChange, onSave, saving, tenantId }) {
  const [initial] = useState(() => ({
    chat_provider: config.chat_provider,
    chat_model: config.chat_model,
    embedding_provider: config.embedding_provider,
    embedding_model: config.embedding_model,
    temperature: config.temperature,
  }))

  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState(null)
  const [savingKey, setSavingKey] = useState(false)

  const [embedApiKey, setEmbedApiKey] = useState('')
  const [embedApiKeyStatus, setEmbedApiKeyStatus] = useState(null)
  const [savingEmbedKey, setSavingEmbedKey] = useState(false)

  const isDirty = useMemo(() => {
    return (
      config.chat_provider !== initial.chat_provider ||
      config.chat_model !== initial.chat_model ||
      config.embedding_provider !== initial.embedding_provider ||
      config.embedding_model !== initial.embedding_model ||
      config.temperature !== initial.temperature
    )
  }, [config, initial])

  // Check if Gemini API keys are configured
  useState(() => {
    if (!tenantId) return
    listSecrets(tenantId)
      .then((data) => {
        const keys = data.secrets || data.keys || []
        const hasChatKey = keys.some(
          (s) => (typeof s === 'string' ? s : s.key) === 'gemini_api_key',
        )
        const hasEmbedKey = keys.some(
          (s) => (typeof s === 'string' ? s : s.key) === 'gemini_embedding_api_key',
        )
        setApiKeyStatus(hasChatKey ? 'configured' : 'none')
        setEmbedApiKeyStatus(hasEmbedKey ? 'configured' : 'none')
      })
      .catch(() => {
        setApiKeyStatus('none')
        setEmbedApiKeyStatus('none')
      })
  })

  const handleChange = useCallback(
    (field, value) => {
      onChange({ [field]: value })
    },
    [onChange],
  )

  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim() || !tenantId) return
    setSavingKey(true)
    try {
      await createSecret(tenantId, 'gemini_api_key', apiKey.trim())
      setApiKey('')
      setApiKeyStatus('configured')
    } catch (err) {
      setApiKeyStatus('error')
      // Show inline error; suppress console
      void extractErrorMessage(err)
    } finally {
      setSavingKey(false)
    }
  }, [apiKey, tenantId])

  const handleSaveEmbedApiKey = useCallback(async () => {
    if (!embedApiKey.trim() || !tenantId) return
    setSavingEmbedKey(true)
    try {
      await createSecret(tenantId, 'gemini_embedding_api_key', embedApiKey.trim())
      setEmbedApiKey('')
      setEmbedApiKeyStatus('configured')
    } catch (err) {
      setEmbedApiKeyStatus('error')
      void extractErrorMessage(err)
    } finally {
      setSavingEmbedKey(false)
    }
  }, [embedApiKey, tenantId])

  const handleSave = useCallback(() => {
    // Validate: if a provider is selected, a model must be chosen
    if (config.chat_provider === 'gemini' && !config.chat_model) {
      alert('Please select a Chat Model before saving.')
      return
    }
    if (config.embedding_provider === 'gemini' && !config.embedding_model) {
      alert('Please select an Embedding Model before saving.')
      return
    }
    onSave({ ...config })
  }, [config, onSave])

  const isChatChanged = config.chat_provider !== initial.chat_provider || config.chat_model !== initial.chat_model
  const showGeminiChatKey = config.chat_provider === 'gemini' && (apiKeyStatus !== 'configured' || isChatChanged)

  const isEmbedChanged = config.embedding_provider !== initial.embedding_provider || config.embedding_model !== initial.embedding_model
  const showGeminiEmbedKey = config.embedding_provider === 'gemini' && (embedApiKeyStatus !== 'configured' || isEmbedChanged)

  return (
    <div className="settings-panel">
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <fieldset className="settings-fieldset">
          <legend className="settings-legend">Chat Model</legend>

          <div className="settings-field-row">
            {/* Chat Provider */}
            <div className="settings-field">
              <label htmlFor="llm-chat-provider" className="settings-label">
                Chat Provider
              </label>
              <select
                id="llm-chat-provider"
                className="settings-select"
                value={config.chat_provider || 'ollama'}
                onChange={(e) => handleChange('chat_provider', e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chat Model */}
            <div className="settings-field">
              <label htmlFor="llm-chat-model" className="settings-label">
                Chat Model
                {config.chat_provider === 'gemini' && apiKeyStatus === 'configured' && !isChatChanged && (
                  <span className="settings-status-ok" style={{ marginLeft: '8px', fontSize: '0.85em' }}>✓ Key Configured</span>
                )}
              </label>
              {config.chat_provider === 'gemini' ? (
                <select
                  id="llm-chat-model"
                  className="settings-select"
                  value={config.chat_model || ''}
                  onChange={(e) => handleChange('chat_model', e.target.value)}
                >
                  <option value="" disabled>Select a model...</option>
                  {GEMINI_CHAT_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="llm-chat-model"
                  type="text"
                  className="settings-input"
                  value={config.chat_model || ''}
                  onChange={(e) => handleChange('chat_model', e.target.value)}
                  placeholder="e.g. llama3:8b"
                />
              )}
            </div>
          </div>

          {/* Gemini Chat API Key */}
          {showGeminiChatKey && (
            <div className="settings-field sf-animate-fade-in" style={{ marginTop: '1.25rem' }}>
              <label htmlFor="llm-api-key" className="settings-label">
                Gemini API Key
              </label>
              <div className="settings-field-row">
                <input
                  id="llm-api-key"
                  type="password"
                  className="settings-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Gemini Chat API key…"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="sf-btn sf-btn-secondary sf-btn-sm"
                  onClick={handleSaveApiKey}
                  disabled={savingKey || !apiKey.trim()}
                >
                  {savingKey ? 'Saving…' : 'Store Key'}
                </button>
              </div>
              <p className="settings-hint">
                API key stored securely. Current key cannot be displayed.
              </p>
              {apiKeyStatus === 'none' && (
                <span className="settings-status settings-status-warn">
                  No API key set
                </span>
              )}
            </div>
          )}
        </fieldset>

        <fieldset className="settings-fieldset">
          <legend className="settings-legend">Embedding Model</legend>

          <div className="settings-field-row">
            {/* Embedding Provider */}
            <div className="settings-field">
              <label htmlFor="llm-embed-provider" className="settings-label">
                Embedding Provider
              </label>
              <select
                id="llm-embed-provider"
                className="settings-select"
                value={config.embedding_provider || 'ollama'}
                onChange={(e) => handleChange('embedding_provider', e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Embedding Model */}
            <div className="settings-field">
              <label htmlFor="llm-embed-model" className="settings-label">
                Embedding Model
                {config.embedding_provider === 'gemini' && embedApiKeyStatus === 'configured' && !isEmbedChanged && (
                  <span className="settings-status-ok" style={{ marginLeft: '8px', fontSize: '0.85em' }}>✓ Key Configured</span>
                )}
              </label>
              {config.embedding_provider === 'gemini' ? (
                <select
                  id="llm-embed-model"
                  className="settings-select"
                  value={config.embedding_model || ''}
                  onChange={(e) => handleChange('embedding_model', e.target.value)}
                >
                  <option value="" disabled>Select an embedding model...</option>
                  {GEMINI_EMBEDDING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="llm-embed-model"
                  type="text"
                  className="settings-input"
                  value={config.embedding_model || ''}
                  onChange={(e) => handleChange('embedding_model', e.target.value)}
                  placeholder="e.g. nomic-embed-text"
                />
              )}
            </div>
          </div>

          {/* Gemini Embedding API Key */}
          {showGeminiEmbedKey && (
            <div className="settings-field sf-animate-fade-in" style={{ marginTop: '1.25rem' }}>
              <label htmlFor="llm-embed-api-key" className="settings-label">
                Gemini API Key
              </label>
              <div className="settings-field-row">
                <input
                  id="llm-embed-api-key"
                  type="password"
                  className="settings-input"
                  value={embedApiKey}
                  onChange={(e) => setEmbedApiKey(e.target.value)}
                  placeholder="Enter Gemini Embedding API key…"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="sf-btn sf-btn-secondary sf-btn-sm"
                  onClick={handleSaveEmbedApiKey}
                  disabled={savingEmbedKey || !embedApiKey.trim()}
                >
                  {savingEmbedKey ? 'Saving…' : 'Store Key'}
                </button>
              </div>
              <p className="settings-hint">
                API key stored securely. Current key cannot be displayed.
              </p>
              {embedApiKeyStatus === 'none' && (
                <span className="settings-status settings-status-warn">
                  No API key set
                </span>
              )}
            </div>
          )}
        </fieldset>

        <fieldset className="settings-fieldset">
          <legend className="settings-legend">Temperature</legend>

          <div className="settings-field">
            <label htmlFor="llm-temperature" className="settings-label">
              Temperature:{' '}
              <span className="settings-label-value">
                {(config.temperature ?? 0.3).toFixed(1)}
              </span>
            </label>
            <input
              id="llm-temperature"
              type="range"
              className="settings-slider"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature ?? 0.3}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            />
            <div className="settings-slider-labels">
              <span>0.0 — Precise</span>
              <span>1.0 — Creative</span>
            </div>
          </div>
        </fieldset>

        {/* Save */}
        <div className="settings-actions">
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="llm-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save LLM Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
