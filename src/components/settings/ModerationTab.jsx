/**
 * ModerationTab — blocklist editor for content moderation.
 *
 * Stores a newline-separated list of blocked terms.
 * Key: moderation_blocklist (stored as array in config_json)
 */

import { useCallback, useMemo, useState } from 'react'

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean }} props
 */
export default function ModerationTab({ config, onChange, onSave, saving }) {
  const blocklist = config.moderation_blocklist || []
  const blocklistText = Array.isArray(blocklist) ? blocklist.join('\n') : blocklist
  const [initial] = useState(() =>
    JSON.stringify(config.moderation_blocklist || []),
  )

  const termCount = blocklistText
    .split('\n')
    .filter((line) => line.trim()).length

  const isDirty = useMemo(() => {
    return JSON.stringify(config.moderation_blocklist || []) !== initial
  }, [config.moderation_blocklist, initial])

  const handleChange = useCallback(
    (value) => {
      const terms = value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      onChange({ moderation_blocklist: terms })
    },
    [onChange],
  )

  const handleSave = useCallback(() => {
    onSave({ ...config })
  }, [config, onSave])

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
          <legend className="settings-legend">Moderation Blocklist</legend>

          <div className="settings-field">
            <label htmlFor="moderation-blocklist" className="settings-label">
              Blocked Terms
              <span className="settings-count-badge">{termCount}</span>
            </label>
            <textarea
              id="moderation-blocklist"
              className="settings-textarea"
              rows={10}
              value={blocklistText}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter one term per line&#10;competitor_name&#10;inappropriate_word"
            />
            <span className="settings-char-count">
              {termCount} {termCount === 1 ? 'term' : 'terms'}
            </span>
          </div>

          <div className="settings-info-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
            <p>
              Messages containing these terms will be flagged automatically.
              Built-in jailbreak detection is always active regardless of this list.
            </p>
          </div>
        </fieldset>

        {/* Save */}
        <div className="settings-actions">
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="moderation-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Moderation Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
