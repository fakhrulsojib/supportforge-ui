/**
 * AgentTab — agent personality configuration.
 *
 * Fields: system_prompt, persona, instructions
 * All stored under config.agent_prompt.*
 */

import { useCallback, useMemo, useState } from 'react'

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean }} props
 */
export default function AgentTab({ config, onChange, onSave, saving }) {
  const agentPrompt = useMemo(() => config.agent_prompt || {}, [config.agent_prompt])
  const [initialPrompt] = useState(() => config.agent_prompt || {})

  const isDirty = useMemo(() => {
    return JSON.stringify(agentPrompt) !== JSON.stringify(initialPrompt)
  }, [agentPrompt, initialPrompt])

  const handleFieldChange = useCallback(
    (field, value) => {
      onChange({
        agent_prompt: {
          ...agentPrompt,
          [field]: value,
        },
      })
    },
    [agentPrompt, onChange],
  )

  const handleReset = useCallback(() => {
    onChange({ agent_prompt: {} })
  }, [onChange])

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
          <legend className="settings-legend">Agent Personality</legend>

          {/* System Prompt */}
          <div className="settings-field">
            <label htmlFor="agent-system-prompt" className="settings-label">
              System Prompt
            </label>
            <textarea
              id="agent-system-prompt"
              className="settings-textarea settings-textarea-mono"
              rows={8}
              value={agentPrompt.system_prompt || ''}
              onChange={(e) => handleFieldChange('system_prompt', e.target.value)}
              placeholder="You are a helpful customer support agent..."
            />
            <span className="settings-char-count">
              {(agentPrompt.system_prompt || '').length} characters
            </span>
          </div>

          {/* Persona */}
          <div className="settings-field">
            <label htmlFor="agent-persona" className="settings-label">
              Persona
            </label>
            <input
              id="agent-persona"
              type="text"
              className="settings-input"
              value={agentPrompt.persona || ''}
              onChange={(e) => handleFieldChange('persona', e.target.value)}
              placeholder="Friendly and professional support agent"
            />
            <span className="settings-char-count">
              {(agentPrompt.persona || '').length} characters
            </span>
          </div>

          {/* Instructions */}
          <div className="settings-field">
            <label htmlFor="agent-instructions" className="settings-label">
              Instructions
            </label>
            <textarea
              id="agent-instructions"
              className="settings-textarea"
              rows={4}
              value={agentPrompt.instructions || ''}
              onChange={(e) => handleFieldChange('instructions', e.target.value)}
              placeholder="Always be polite. Escalate billing issues..."
            />
            <span className="settings-char-count">
              {(agentPrompt.instructions || '').length} characters
            </span>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="settings-actions">
          <button
            type="button"
            className="sf-btn sf-btn-ghost"
            onClick={handleReset}
          >
            Reset to Default
          </button>
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="agent-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Agent Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
