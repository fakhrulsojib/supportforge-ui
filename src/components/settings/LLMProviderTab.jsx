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

  const isDirty = useMemo(() => {
    return (
      config.chat_provider !== initial.chat_provider ||
      config.chat_model !== initial.chat_model ||
      config.embedding_provider !== initial.embedding_provider ||
      config.embedding_model !== initial.embedding_model ||
      config.temperature !== initial.temperature
    )
  }, [config, initial])

  // Check if Gemini API key is configured
  useState(() => {
    if (!tenantId) return
    listSecrets(tenantId)
      .then((data) => {
        const keys = data.secrets || data.keys || []
        const hasKey = keys.some(
          (s) => (typeof s === 'string' ? s : s.key) === 'gemini_api_key',
        )
        setApiKeyStatus(hasKey ? 'configured' : 'none')
      })
      .catch(() => setApiKeyStatus('none'))
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

  const handleSave = useCallback(() => {
    onSave({ ...config })
  }, [config, onSave])

  const showGeminiKey = config.chat_provider === 'gemini' || config.embedding_provider === 'gemini'

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
              </label>
              <input
                id="llm-chat-model"
                type="text"
                className="settings-input"
                value={config.chat_model || ''}
                onChange={(e) => handleChange('chat_model', e.target.value)}
                placeholder="e.g. gemini-1.5-flash"
              />
            </div>
          </div>
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
              </label>
              <input
                id="llm-embed-model"
                type="text"
                className="settings-input"
                value={config.embedding_model || ''}
                onChange={(e) => handleChange('embedding_model', e.target.value)}
                placeholder="e.g. text-embedding-004"
              />
            </div>
          </div>
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

        {/* Gemini API Key */}
        {showGeminiKey && (
          <fieldset className="settings-fieldset">
            <legend className="settings-legend">Gemini API Key</legend>

            <div className="settings-field">
              <label htmlFor="llm-api-key" className="settings-label">
                API Key
              </label>
              <div className="settings-field-row">
                <input
                  id="llm-api-key"
                  type="password"
                  className="settings-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Gemini API key…"
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
              {apiKeyStatus === 'configured' && (
                <span className="settings-status settings-status-ok">
                  ✓ API key configured
                </span>
              )}
              {apiKeyStatus === 'none' && (
                <span className="settings-status settings-status-warn">
                  No API key set
                </span>
              )}
            </div>
          </fieldset>
        )}

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
