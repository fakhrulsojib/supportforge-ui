/**
 * WidgetTab — widget branding and embed configuration with live preview.
 *
 * Fields: embed_key, embed_domains, brand_name, logo_url,
 *         welcome_message, placeholder_text, primary_color
 */

import { useCallback, useMemo, useState } from 'react'

/**
 * Generate a random embed key with pk_live_ prefix.
 * @returns {string}
 */
function generateEmbedKey() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `pk_live_${hex}`
}

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean }} props
 */
export default function WidgetTab({ config, onChange, onSave, saving }) {
  const uiConfig = useMemo(() => config.ui_config || {}, [config.ui_config])
  const theme = useMemo(() => uiConfig.theme || {}, [uiConfig.theme])
  const [initial] = useState(() => JSON.stringify({
    embed_key: config.embed_key,
    embed_domains: config.embed_domains,
    ui_config: config.ui_config,
  }))
  const [copied, setCopied] = useState(false)

  const isDirty = useMemo(() => {
    return JSON.stringify({
      embed_key: config.embed_key,
      embed_domains: config.embed_domains,
      ui_config: config.ui_config,
    }) !== initial
  }, [config, initial])

  const handleUiChange = useCallback(
    (field, value) => {
      onChange({
        ui_config: {
          ...uiConfig,
          [field]: value,
        },
      })
    },
    [uiConfig, onChange],
  )

  const handleThemeChange = useCallback(
    (field, value) => {
      onChange({
        ui_config: {
          ...uiConfig,
          theme: {
            ...theme,
            [field]: value,
          },
        },
      })
    },
    [uiConfig, theme, onChange],
  )

  const handleDomainChange = useCallback(
    (index, value) => {
      const domains = [...(config.embed_domains || [])]
      domains[index] = value
      onChange({ embed_domains: domains })
    },
    [config.embed_domains, onChange],
  )

  const handleAddDomain = useCallback(() => {
    const domains = [...(config.embed_domains || []), '']
    onChange({ embed_domains: domains })
  }, [config.embed_domains, onChange])

  const handleRemoveDomain = useCallback(
    (index) => {
      const domains = (config.embed_domains || []).filter((_, i) => i !== index)
      onChange({ embed_domains: domains })
    },
    [config.embed_domains, onChange],
  )

  const handleRegenerate = useCallback(() => {
    onChange({ embed_key: generateEmbedKey() })
  }, [onChange])

  const handleCopy = useCallback(() => {
    if (!config.embed_key) return
    navigator.clipboard.writeText(config.embed_key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [config.embed_key])

  const handleSave = useCallback(() => {
    onSave({ ...config })
  }, [config, onSave])

  // Preview values
  const previewColor = theme.primary_color || '#6366f1'
  const previewName = uiConfig.brand_name || 'SupportForge'
  const previewMessage = uiConfig.welcome_message || 'Hi! How can I help you today?'
  const previewPlaceholder = uiConfig.placeholder_text || 'Type a message…'

  return (
    <div className="settings-panel">
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <div className="settings-widget-layout">
          {/* Left: Form Fields (60%) */}
          <div className="settings-widget-form">
            {/* Embed Key */}
            <fieldset className="settings-fieldset">
              <legend className="settings-legend">Embed Key</legend>
              <div className="settings-field">
                <label htmlFor="widget-embed-key" className="settings-label">
                  Key
                </label>
                <div className="settings-field-row">
                  <input
                    id="widget-embed-key"
                    type="text"
                    className="settings-input settings-input-mono"
                    value={config.embed_key ? `${config.embed_key.slice(0, 20)}…` : '—'}
                    readOnly
                    title={config.embed_key || ''}
                  />
                  <button
                    type="button"
                    className="sf-btn sf-btn-secondary sf-btn-sm"
                    onClick={handleCopy}
                    disabled={!config.embed_key}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    className="sf-btn sf-btn-ghost sf-btn-sm"
                    onClick={handleRegenerate}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </fieldset>

            {/* Embed Domains */}
            <fieldset className="settings-fieldset">
              <legend className="settings-legend">Allowed Domains</legend>
              {(config.embed_domains || []).map((domain, index) => (
                <div key={index} className="settings-field-row settings-domain-row">
                  <div className="settings-field">
                    <label htmlFor={`widget-domain-${index}`} className="sf-visually-hidden">
                      Domain {index + 1}
                    </label>
                    <input
                      id={`widget-domain-${index}`}
                      type="text"
                      className="settings-input"
                      value={domain}
                      onChange={(e) => handleDomainChange(index, e.target.value)}
                      placeholder="example.com"
                    />
                  </div>
                  <button
                    type="button"
                    className="sf-btn sf-btn-ghost sf-btn-sm"
                    onClick={() => handleRemoveDomain(index)}
                    aria-label={`Remove domain ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="sf-btn sf-btn-secondary sf-btn-sm settings-add-btn"
                onClick={handleAddDomain}
              >
                + Add Domain
              </button>
            </fieldset>

            {/* Branding */}
            <fieldset className="settings-fieldset">
              <legend className="settings-legend">Branding</legend>

              <div className="settings-field">
                <label htmlFor="widget-brand-name" className="settings-label">
                  Brand Name
                </label>
                <input
                  id="widget-brand-name"
                  type="text"
                  className="settings-input"
                  value={uiConfig.brand_name || ''}
                  onChange={(e) => handleUiChange('brand_name', e.target.value)}
                  placeholder="Your Company"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="widget-logo-url" className="settings-label">
                  Logo URL
                </label>
                <input
                  id="widget-logo-url"
                  type="url"
                  className="settings-input"
                  value={uiConfig.logo_url || ''}
                  onChange={(e) => handleUiChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="widget-welcome" className="settings-label">
                  Welcome Message
                </label>
                <textarea
                  id="widget-welcome"
                  className="settings-textarea"
                  rows={3}
                  value={uiConfig.welcome_message || ''}
                  onChange={(e) => handleUiChange('welcome_message', e.target.value)}
                  placeholder="Hi! How can I help you today?"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="widget-placeholder" className="settings-label">
                  Input Placeholder
                </label>
                <input
                  id="widget-placeholder"
                  type="text"
                  className="settings-input"
                  value={uiConfig.placeholder_text || ''}
                  onChange={(e) => handleUiChange('placeholder_text', e.target.value)}
                  placeholder="Type a message…"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="widget-primary-color" className="settings-label">
                  Primary Color
                </label>
                <div className="settings-color-row">
                  <input
                    id="widget-primary-color"
                    type="text"
                    className="settings-input settings-input-color-text"
                    value={theme.primary_color || '#6366f1'}
                    onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                    placeholder="#6366f1"
                  />
                  <input
                    type="color"
                    className="settings-color-picker"
                    value={theme.primary_color || '#6366f1'}
                    onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                    aria-label="Pick primary color"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {/* Right: Live Preview (40%) */}
          <div className="settings-widget-preview">
            <h3 className="settings-subheading">Preview</h3>
            <div className="settings-preview-mockup">
              {/* Header */}
              <div
                className="settings-preview-header"
                style={{ backgroundColor: previewColor }}
              >
                {uiConfig.logo_url && (
                  <div className="settings-preview-logo">
                    <img
                      src={uiConfig.logo_url}
                      alt=""
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </div>
                )}
                <span className="settings-preview-brand">{previewName}</span>
              </div>
              {/* Body */}
              <div className="settings-preview-body">
                <div className="settings-preview-message">
                  <div
                    className="settings-preview-bubble"
                    style={{ backgroundColor: `${previewColor}15` }}
                  >
                    {previewMessage}
                  </div>
                </div>
              </div>
              {/* Input */}
              <div className="settings-preview-input">
                <span className="settings-preview-placeholder">{previewPlaceholder}</span>
                <span
                  className="settings-preview-send"
                  style={{ backgroundColor: previewColor }}
                >
                  →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="settings-actions">
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="widget-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Widget Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
