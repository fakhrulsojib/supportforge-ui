/**
 * ModelSelector — multi-provider chat model & embedding model switcher.
 *
 * Admins can:
 * - Switch between Ollama and Gemini providers for chat
 * - Select models from each provider's catalog
 * - Enter/update a Gemini API key (securely stored encrypted server-side)
 * - Switch embedding models (Ollama or Gemini with separate API key)
 *
 * On mount, fetches the model list from the API. Model changes are
 * applied immediately via PUT and take effect for subsequent requests.
 *
 * Security:
 * - Admin-only (parent AdminPage enforces RBAC)
 * - Gemini API keys sent via HTTPS, encrypted at rest, never exposed
 * - Key preview shows masked version (e.g. "AIza...****")
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { listModels, setActiveModel } from '../../api/modelsApi'
import { getVoiceConfig, getVoiceHealth, toggleVoice, saveVoiceConfig } from '../../api/voiceApi'
import { extractErrorMessage } from '../../api/client'

export default function ModelSelector() {
  const [providers, setProviders] = useState([])
  const [activeModel, setActiveModelState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Provider tab state
  const [selectedProvider, setSelectedProvider] = useState('ollama')

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

  // Voice state
  const [voiceConfig, setVoiceConfig] = useState(null)
  const [voiceHealth, setVoiceHealth] = useState(null)
  const [isTogglingVoice, setIsTogglingVoice] = useState(false)
  const [voiceError, setVoiceError] = useState(null)

  // Voice provider config state
  const [voiceProvider, setVoiceProvider] = useState('local') // 'local' | 'azure'
  const [azureKeyInput, setAzureKeyInput] = useState('')
  const [showAzureKey, setShowAzureKey] = useState(false)
  const [azureRegion, setAzureRegion] = useState('eastus')
  const [azureTtsVoice, setAzureTtsVoice] = useState('en-US-AriaNeural')
  const [isSavingVoice, setIsSavingVoice] = useState(false)
  const [voiceSaveSuccess, setVoiceSaveSuccess] = useState('')
  const voiceSaveTimerRef = useRef(null)

  // Gemini chat state
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [pendingGeminiModel, setPendingGeminiModel] = useState(null)

  // Gemini embedding state (separate key from chat)
  const [embedApiKeyInput, setEmbedApiKeyInput] = useState('')
  const [showEmbedApiKey, setShowEmbedApiKey] = useState(false)
  const [pendingGeminiEmbedModel, setPendingGeminiEmbedModel] = useState(null)
  const [selectedEmbedProvider, setSelectedEmbedProvider] = useState('ollama')

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(chatTimerRef.current)
    clearTimeout(embedTimerRef.current)
    clearTimeout(voiceSaveTimerRef.current)
  }, [])

  /** Fetch available models on mount. */
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await listModels()
      setProviders(data.providers || [])
      setActiveModelState(data.active_model || null)
      // Sync provider tab with server state
      if (data.active_model?.provider) {
        setSelectedProvider(data.active_model.provider)
      }
      if (data.active_model?.embedding_provider) {
        setSelectedEmbedProvider(data.active_model.embedding_provider)
      } else {
        // Default to first provider that has embedding models
        const provs = data.providers || []
        const withEmbeds = provs.find(p => p.embedding_models?.length > 0)
        if (withEmbeds) setSelectedEmbedProvider(withEmbeds.id)
      }
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
    loadVoiceState()
  }, [loadModels])

  /** Load voice config and health. */
  async function loadVoiceState() {
    try {
      const [config, health] = await Promise.all([getVoiceConfig(), getVoiceHealth()])
      setVoiceConfig(config)
      setVoiceHealth(health)
      // Sync provider UI with current config
      if (config?.stt_provider === 'azure' || config?.tts_provider === 'azure') {
        setVoiceProvider('azure')
      } else {
        setVoiceProvider('local')
      }
      if (config?.azure_region) setAzureRegion(config.azure_region)
      if (config?.tts_voice && config.tts_voice !== 'en_US-lessac-medium') {
        setAzureTtsVoice(config.tts_voice)
      }
    } catch { /* voice not available */ }
  }

  /** Toggle voice on/off. */
  const handleToggleVoice = useCallback(async () => {
    try {
      setIsTogglingVoice(true)
      setVoiceError(null)
      const result = await toggleVoice()
      setVoiceConfig(result)
    } catch (err) {
      setVoiceError(extractErrorMessage(err))
    } finally {
      setIsTogglingVoice(false)
    }
  }, [])

  /** Save voice provider config. */
  const handleSaveVoiceConfig = useCallback(async () => {
    try {
      setIsSavingVoice(true)
      setVoiceError(null)
      setVoiceSaveSuccess('')

      const payload = {}
      if (voiceProvider === 'azure') {
        payload.stt_provider = 'azure'
        payload.tts_provider = 'azure'
        if (azureKeyInput) payload.api_key = azureKeyInput
        payload.azure_region = azureRegion
        payload.tts_voice = azureTtsVoice
      } else {
        payload.stt_provider = 'whisper'
        payload.tts_provider = 'piper'
        payload.tts_voice = 'en_US-lessac-medium'
      }

      const result = await saveVoiceConfig(payload)
      setVoiceConfig(result)
      setAzureKeyInput('')
      setVoiceSaveSuccess('Voice config saved ✓')
      clearTimeout(voiceSaveTimerRef.current)
      voiceSaveTimerRef.current = setTimeout(() => setVoiceSaveSuccess(''), 3000)
    } catch (err) {
      setVoiceError(extractErrorMessage(err))
    } finally {
      setIsSavingVoice(false)
    }
  }, [voiceProvider, azureKeyInput, azureRegion, azureTtsVoice])

  /** Get models for a specific provider. */
  const getProviderModels = (providerId, type = 'chat') => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return []
    return type === 'chat' ? (provider.models || []) : (provider.embedding_models || [])
  }

  /** Handle chat model selection change. */
  const handleChatModelChange = useCallback(async (e) => {
    const selectedId = e.target.value
    if (!selectedId) return

    // For Gemini: just update local state — user must click Save & Activate
    if (selectedProvider === 'gemini') {
      setPendingGeminiModel(selectedId)
      return
    }

    // For Ollama: auto-save on select
    if (selectedId === activeModel?.model_id && selectedProvider === activeModel?.provider) return

    try {
      setIsSwitchingChat(true)
      setChatError(null)
      setChatSuccess('')
      clearTimeout(chatTimerRef.current)

      const result = await setActiveModel(selectedProvider, selectedId, 'chat', null)
      setActiveModelState(prev => ({
        ...prev,
        provider: selectedProvider,
        model_id: result.model_id,
      }))
      setChatSuccess(`Switched to ${result.model_id}`)
      chatTimerRef.current = setTimeout(() => setChatSuccess(''), 3000)
    } catch (err) {
      setChatError(extractErrorMessage(err))
    } finally {
      setIsSwitchingChat(false)
    }
  }, [activeModel, selectedProvider])

  /** Handle provider tab switch. */
  const handleProviderSwitch = useCallback((providerId) => {
    setSelectedProvider(providerId)
    setChatError(null)
    setChatSuccess('')
  }, [])

  /** Save Gemini config: API key + selected model together. */
  const handleSaveGemini = useCallback(async () => {
    const chatModels = getProviderModels('gemini', 'chat')
    const modelToSave = pendingGeminiModel
      || (activeModel?.provider === 'gemini' ? activeModel.model_id : null)
      || chatModels[0]?.id
      || 'gemini-2.5-flash'

    // Must have either a new key or an existing key + model change
    const hasKeyChange = apiKeyInput.trim().length > 0
    const hasModelChange = modelToSave !== activeModel?.model_id || activeModel?.provider !== 'gemini'
    if (!hasKeyChange && !hasModelChange) return

    // If switching to Gemini for the first time, key is required
    if (!hasKeyChange && !activeModel?.has_api_key) {
      setChatError('Please enter your Gemini API key')
      return
    }

    try {
      setIsSwitchingChat(true)
      setChatError(null)
      setChatSuccess('')
      clearTimeout(chatTimerRef.current)

      const result = await setActiveModel('gemini', modelToSave, 'chat', apiKeyInput || null)
      setActiveModelState(prev => ({
        ...prev,
        provider: 'gemini',
        model_id: result.model_id,
        has_api_key: true,
      }))
      setApiKeyInput('')
      setPendingGeminiModel(null)
      setChatSuccess(`Saved — now using ${result.model_id}`)
      chatTimerRef.current = setTimeout(() => setChatSuccess(''), 3000)
    } catch (err) {
      setChatError(extractErrorMessage(err))
    } finally {
      setIsSwitchingChat(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyInput, activeModel, pendingGeminiModel])

  /** Handle embedding model selection change. */
  const handleEmbedModelChange = useCallback(async (e) => {
    const selectedId = e.target.value
    if (!selectedId) return

    // For Gemini: just update local state — user must click Save & Activate
    if (selectedEmbedProvider === 'gemini') {
      setPendingGeminiEmbedModel(selectedId)
      return
    }

    // For Ollama: auto-save on select
    if (selectedId === activeModel?.embedding_model_id) return

    try {
      setIsSwitchingEmbed(true)
      setEmbedError(null)
      setEmbedSuccess('')
      clearTimeout(embedTimerRef.current)

      const result = await setActiveModel('ollama', selectedId, 'embedding')
      setActiveModelState(prev => ({
        ...prev,
        embedding_model_id: result.model_id,
        embedding_provider: 'ollama',
      }))
      setEmbedSuccess(`Switched to ${result.model_id}`)
      embedTimerRef.current = setTimeout(() => setEmbedSuccess(''), 3000)
    } catch (err) {
      setEmbedError(extractErrorMessage(err))
    } finally {
      setIsSwitchingEmbed(false)
    }
  }, [activeModel, selectedEmbedProvider])

  /** Save Gemini embedding config: API key + selected model together. */
  const handleSaveGeminiEmbed = useCallback(async () => {
    const embedModels = getProviderModels('gemini', 'embedding')
    const modelToSave = pendingGeminiEmbedModel
      || (activeModel?.embedding_provider === 'gemini' ? activeModel.embedding_model_id : null)
      || embedModels[0]?.id
      || 'gemini-embedding-2'

    const hasKeyChange = embedApiKeyInput.trim().length > 0
    const hasModelChange = modelToSave !== activeModel?.embedding_model_id || activeModel?.embedding_provider !== 'gemini'
    if (!hasKeyChange && !hasModelChange) return

    if (!hasKeyChange && !activeModel?.has_embedding_api_key) {
      setEmbedError('Please enter your Gemini embedding API key')
      return
    }

    try {
      setIsSwitchingEmbed(true)
      setEmbedError(null)
      setEmbedSuccess('')
      clearTimeout(embedTimerRef.current)

      const result = await setActiveModel('gemini', modelToSave, 'embedding', embedApiKeyInput || null)
      setActiveModelState(prev => ({
        ...prev,
        embedding_model_id: result.model_id,
        embedding_provider: 'gemini',
        has_embedding_api_key: true,
      }))
      setEmbedApiKeyInput('')
      setPendingGeminiEmbedModel(null)
      setEmbedSuccess(`Saved — now using ${result.model_id}`)
      embedTimerRef.current = setTimeout(() => setEmbedSuccess(''), 3000)
    } catch (err) {
      setEmbedError(extractErrorMessage(err))
    } finally {
      setIsSwitchingEmbed(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedApiKeyInput, activeModel, pendingGeminiEmbedModel])

  // Get models for selected provider
  const chatModels = getProviderModels(selectedProvider, 'chat')
  const embedModels = getProviderModels(selectedEmbedProvider, 'embedding')

  const SuccessIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const KeyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 010-7.778zM15.5 7.5l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <div>
      <div className="admin-model-grid">
        {/* Chat Model Card — Multi-Provider */}
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

            {/* Provider Tabs */}
            {!isLoading && providers.filter(p => p.models?.length > 0).length > 0 && (
              <div className="admin-provider-tabs" role="tablist">
                {providers.filter(p => p.models?.length > 0).map(p => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={selectedProvider === p.id}
                    className={`admin-provider-tab${selectedProvider === p.id ? ' admin-provider-tab-active' : ''}`}
                    onClick={() => handleProviderSwitch(p.id)}
                    id={`provider-tab-${p.id}`}
                  >
                    {p.id === 'gemini' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {p.name}
                    {p.id === activeModel?.provider && (
                      <span className="admin-provider-active-dot" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Model Selector */}
            {isLoading ? (
              <span className="admin-model-name admin-model-loading">Loading…</span>
            ) : (
              <select
                className="admin-model-select"
                id="admin-chat-model-select"
                value={
                  selectedProvider === 'gemini'
                    ? (pendingGeminiModel || (activeModel?.provider === 'gemini' ? activeModel?.model_id : '') || '')
                    : (selectedProvider === activeModel?.provider ? (activeModel?.model_id || '') : '')
                }
                onChange={handleChatModelChange}
                disabled={isSwitchingChat || chatModels.length === 0}
                aria-label="Select chat model"
              >
                {chatModels.length === 0 && (
                  <option value="">No models available</option>
                )}
                {selectedProvider !== activeModel?.provider && (
                  <option value="">Select a model…</option>
                )}
                {chatModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.size_gb > 0 ? ` (${m.size_gb} GB)` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Gemini API Key Input */}
            {selectedProvider === 'gemini' && !isLoading && (
              <div className="admin-apikey-section">
                <div className="admin-apikey-row">
                  <div className="admin-apikey-input-wrap">
                    <KeyIcon />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      className="admin-apikey-input"
                      id="admin-gemini-api-key"
                      placeholder={activeModel?.has_api_key
                        ? `Key configured (${activeModel.api_key_preview || '****'})`
                        : 'Enter your Gemini API key…'
                      }
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      autoComplete="off"
                      aria-label="Gemini API key"
                    />
                    <button
                      type="button"
                      className="admin-apikey-toggle"
                      onClick={() => setShowApiKey(v => !v)}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="sf-btn sf-btn-primary admin-apikey-save"
                    onClick={handleSaveGemini}
                    disabled={
                      isSwitchingChat || (
                        !apiKeyInput.trim() &&
                        !pendingGeminiModel &&
                        activeModel?.provider === 'gemini'
                      )
                    }
                  >
                    {isSwitchingChat ? 'Saving…' : 'Save & Activate'}
                  </button>
                </div>
                {activeModel?.has_api_key && (
                  <span className="admin-apikey-status">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" fill="currentColor" />
                    </svg>
                    Key configured
                  </span>
                )}
              </div>
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

        {/* Embedding Model Card */}
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

            {/* Embedding Provider Tabs */}
            {!isLoading && providers.filter(p => p.embedding_models?.length > 0).length > 0 && (
              <div className="admin-provider-tabs">
                {providers.filter(p => p.embedding_models?.length > 0).map((p) => (
                  <button
                    key={`embed-${p.id}`}
                    type="button"
                    className={`admin-provider-tab${selectedEmbedProvider === p.id ? ' admin-provider-tab-active' : ''}`}
                    onClick={() => {
                      setSelectedEmbedProvider(p.id)
                      setPendingGeminiEmbedModel(null)
                      setEmbedError(null)
                      setEmbedSuccess('')
                    }}
                    disabled={isSwitchingEmbed}
                  >
                    {p.name}
                    {activeModel?.embedding_provider === p.id && (
                      <span className="admin-provider-active-dot" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <span className="admin-model-name admin-model-loading">Loading…</span>
            ) : (
              <>
                <select
                  className="admin-model-select"
                  id="admin-embed-model-select"
                  value={
                    selectedEmbedProvider === 'gemini'
                      ? (pendingGeminiEmbedModel || (activeModel?.embedding_provider === 'gemini' ? activeModel?.embedding_model_id : '') || '')
                      : (activeModel?.embedding_model_id || '')
                  }
                  onChange={handleEmbedModelChange}
                  disabled={isSwitchingEmbed || embedModels.length === 0}
                  aria-label="Select embedding model"
                >
                  {embedModels.length === 0 && (
                    <option value="">No models available</option>
                  )}
                  {selectedEmbedProvider !== activeModel?.embedding_provider && (
                    <option value="">Select a model…</option>
                  )}
                  {embedModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.size_gb > 0 ? ` (${m.size_gb} GB)` : ''}
                    </option>
                  ))}
                </select>
                <span className="admin-model-hint">
                  Only future ingestions will use the newly selected model
                </span>
              </>
            )}

            {/* Gemini Embedding API Key Input */}
            {selectedEmbedProvider === 'gemini' && !isLoading && (
              <div className="admin-apikey-section">
                <div className="admin-apikey-row">
                  <div className="admin-apikey-input-wrap">
                    <KeyIcon />
                    <input
                      type={showEmbedApiKey ? 'text' : 'password'}
                      className="admin-apikey-input"
                      id="admin-gemini-embed-api-key"
                      placeholder={activeModel?.has_embedding_api_key
                        ? `Key configured (${activeModel.embedding_api_key_preview || '****'})`
                        : 'Enter your Gemini embedding API key…'
                      }
                      value={embedApiKeyInput}
                      onChange={(e) => setEmbedApiKeyInput(e.target.value)}
                      autoComplete="off"
                      aria-label="Gemini embedding API key"
                    />
                    <button
                      type="button"
                      className="admin-apikey-toggle"
                      onClick={() => setShowEmbedApiKey(v => !v)}
                      aria-label={showEmbedApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showEmbedApiKey ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="sf-btn sf-btn-primary admin-apikey-save"
                    onClick={handleSaveGeminiEmbed}
                    disabled={
                      isSwitchingEmbed || (
                        !embedApiKeyInput.trim() &&
                        !pendingGeminiEmbedModel &&
                        activeModel?.embedding_provider === 'gemini'
                      )
                    }
                  >
                    {isSwitchingEmbed ? 'Saving…' : 'Save & Activate'}
                  </button>
                </div>
                {activeModel?.has_embedding_api_key && (
                  <span className="admin-apikey-status">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" fill="currentColor" />
                    </svg>
                    Key configured
                  </span>
                )}
              </div>
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

        {/* Voice Pipeline Card */}
        {voiceHealth && (
          <div className="sf-card admin-model-card">
            <div className="admin-model-icon" style={{ background: 'linear-gradient(135deg, hsl(160,60%,25%), hsl(200,60%,30%))' }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="admin-model-info">
              <span className="admin-model-label">Voice Pipeline</span>

              {/* Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                <button
                  type="button"
                  id="admin-voice-toggle"
                  className={`sf-btn ${voiceConfig?.voice_enabled ? 'sf-btn-primary' : ''}`}
                  style={{ minWidth: '120px' }}
                  onClick={handleToggleVoice}
                  disabled={isTogglingVoice || (!voiceHealth?.stt_available && !voiceConfig?.voice_enabled && voiceProvider === 'local')}
                >
                  {isTogglingVoice ? 'Saving…' : voiceConfig?.voice_enabled ? '✓ Enabled' : 'Enable Voice'}
                </button>
                {!voiceHealth?.stt_available && !voiceHealth?.tts_available && voiceProvider === 'local' && (
                  <span className="admin-model-hint">Voice providers not loaded on server</span>
                )}
              </div>

              {/* Provider Selection */}
              <div style={{ margin: '12px 0' }}>
                <label className="admin-model-hint" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem' }}>
                  Voice Provider
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    id="voice-provider-local"
                    className={`sf-btn sf-btn-sm ${voiceProvider === 'local' ? 'sf-btn-primary' : ''}`}
                    onClick={() => setVoiceProvider('local')}
                  >
                    🏠 Local (Whisper + Piper)
                  </button>
                  <button
                    type="button"
                    id="voice-provider-azure"
                    className={`sf-btn sf-btn-sm ${voiceProvider === 'azure' ? 'sf-btn-primary' : ''}`}
                    onClick={() => setVoiceProvider('azure')}
                  >
                    ☁️ Azure Speech
                  </button>
                </div>
              </div>

              {/* Azure Config (shown when Azure selected) */}
              {voiceProvider === 'azure' && (
                <div style={{ margin: '12px 0', padding: '12px', background: 'var(--sf-color-bg-tertiary, rgba(255,255,255,0.03))', borderRadius: '8px' }}>
                  {/* API Key */}
                  <div style={{ marginBottom: '10px' }}>
                    <label className="admin-model-hint" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>
                      Azure Speech Key
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        id="azure-speech-key"
                        type={showAzureKey ? 'text' : 'password'}
                        value={azureKeyInput}
                        onChange={e => setAzureKeyInput(e.target.value)}
                        placeholder={voiceConfig?.has_api_key ? '••••••••  (key saved)' : 'Enter Azure subscription key'}
                        className="sf-input"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px' }}
                      />
                      <button
                        type="button"
                        className="sf-btn sf-btn-sm"
                        onClick={() => setShowAzureKey(v => !v)}
                        style={{ minWidth: '50px' }}
                      >
                        {showAzureKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Region */}
                  <div style={{ marginBottom: '10px' }}>
                    <label className="admin-model-hint" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>
                      Azure Region
                    </label>
                    <select
                      id="azure-speech-region"
                      value={azureRegion}
                      onChange={e => setAzureRegion(e.target.value)}
                      className="sf-input"
                      style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                    >
                      <option value="eastus">East US</option>
                      <option value="westus2">West US 2</option>
                      <option value="westeurope">West Europe</option>
                      <option value="northeurope">North Europe</option>
                      <option value="southeastasia">Southeast Asia</option>
                      <option value="eastasia">East Asia</option>
                      <option value="australiaeast">Australia East</option>
                      <option value="centralindia">Central India</option>
                    </select>
                  </div>

                  {/* TTS Voice */}
                  <div style={{ marginBottom: '10px' }}>
                    <label className="admin-model-hint" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>
                      TTS Voice
                    </label>
                    <select
                      id="azure-tts-voice"
                      value={azureTtsVoice}
                      onChange={e => setAzureTtsVoice(e.target.value)}
                      className="sf-input"
                      style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                    >
                      <option value="en-US-AriaNeural">Aria (US English, Female)</option>
                      <option value="en-US-GuyNeural">Guy (US English, Male)</option>
                      <option value="en-US-JennyNeural">Jenny (US English, Female)</option>
                      <option value="en-GB-SoniaNeural">Sonia (UK English, Female)</option>
                      <option value="en-GB-RyanNeural">Ryan (UK English, Male)</option>
                      <option value="en-AU-NatashaNeural">Natasha (Australian English, Female)</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    id="voice-config-save"
                    className="sf-btn sf-btn-primary"
                    onClick={handleSaveVoiceConfig}
                    disabled={isSavingVoice || (!azureKeyInput && !voiceConfig?.has_api_key)}
                    style={{ width: '100%' }}
                  >
                    {isSavingVoice ? 'Saving…' : 'Save Azure Config'}
                  </button>
                </div>
              )}

              {/* Save for Local */}
              {voiceProvider === 'local' && voiceConfig?.stt_provider === 'azure' && (
                <button
                  type="button"
                  id="voice-config-revert-local"
                  className="sf-btn sf-btn-primary"
                  onClick={handleSaveVoiceConfig}
                  disabled={isSavingVoice}
                  style={{ margin: '8px 0' }}
                >
                  {isSavingVoice ? 'Saving…' : 'Switch to Local Providers'}
                </button>
              )}

              {/* Provider info */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--sf-color-text-secondary)', marginTop: '8px' }}>
                <span>
                  STT: {voiceConfig?.stt_provider
                    ? <span style={{ color: 'var(--sf-color-success, #10b981)' }}>{voiceConfig.stt_provider}</span>
                    : voiceHealth?.stt_available
                      ? <span style={{ color: 'var(--sf-color-success, #10b981)' }}>{voiceHealth.stt_provider}</span>
                      : <span style={{ opacity: 0.5 }}>unavailable</span>}
                </span>
                <span>
                  TTS: {voiceConfig?.tts_provider
                    ? <span style={{ color: 'var(--sf-color-success, #10b981)' }}>{voiceConfig.tts_provider}</span>
                    : voiceHealth?.tts_available
                      ? <span style={{ color: 'var(--sf-color-success, #10b981)' }}>{voiceHealth.tts_provider}</span>
                      : <span style={{ opacity: 0.5 }}>unavailable</span>}
                </span>
              </div>

              {voiceSaveSuccess && (
                <span className="admin-model-status admin-model-success">{voiceSaveSuccess}</span>
              )}
              {voiceError && (
                <span className="admin-model-status admin-model-error">{voiceError}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
