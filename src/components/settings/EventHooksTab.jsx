/**
 * EventHooksTab — webhook configuration for tenant events.
 *
 * Events: on_escalation, on_new_conversation, on_tool_failure, on_negative_feedback
 * Each event has a URL, headers JSON, and a test button.
 */

import { useCallback, useMemo, useState } from 'react'
import { testEventHook } from '../../api/settingsApi'
import { extractErrorMessage } from '../../api/client'

const EVENTS = [
  { key: 'on_escalation', label: 'On Escalation', description: 'Triggered when a conversation is escalated to a human agent.' },
  { key: 'on_new_conversation', label: 'On New Conversation', description: 'Triggered when a new conversation is started.' },
  { key: 'on_tool_failure', label: 'On Tool Failure', description: 'Triggered when a tool call fails during a conversation.' },
  { key: 'on_negative_feedback', label: 'On Negative Feedback', description: 'Triggered when a user gives negative feedback.' },
]

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean, tenantId: string }} props
 */
export default function EventHooksTab({ config, onChange, onSave, saving, tenantId }) {
  const hooks = useMemo(() => config.event_hooks || {}, [config.event_hooks])
  const [initial] = useState(() => JSON.stringify(config.event_hooks || {}))
  const [testResults, setTestResults] = useState({})
  const [testingEvent, setTestingEvent] = useState(null)

  const isDirty = useMemo(() => {
    return JSON.stringify(hooks) !== initial
  }, [hooks, initial])

  const handleHookChange = useCallback(
    (eventKey, field, value) => {
      const updated = {
        ...hooks,
        [eventKey]: {
          ...hooks[eventKey],
          [field]: value,
        },
      }
      onChange({ event_hooks: updated })
    },
    [hooks, onChange],
  )

  const handleTest = useCallback(
    async (eventKey) => {
      const hook = hooks[eventKey]
      if (!hook?.url) return

      setTestingEvent(eventKey)
      setTestResults((prev) => ({ ...prev, [eventKey]: null }))

      let headers = {}
      try {
        if (hook.headers) {
          headers = JSON.parse(hook.headers)
        }
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [eventKey]: { success: false, message: 'Invalid headers JSON' },
        }))
        setTestingEvent(null)
        return
      }

      try {
        const result = await testEventHook(tenantId, {
          event: eventKey,
          url: hook.url,
          headers,
        })
        setTestResults((prev) => ({
          ...prev,
          [eventKey]: { success: true, message: `Status ${result.status_code || 200} — OK` },
        }))
      } catch (err) {
        setTestResults((prev) => ({
          ...prev,
          [eventKey]: { success: false, message: extractErrorMessage(err) },
        }))
      } finally {
        setTestingEvent(null)
      }
    },
    [hooks, tenantId],
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
        {EVENTS.map((event) => {
          const hook = hooks[event.key] || {}
          const result = testResults[event.key]

          return (
            <fieldset key={event.key} className="settings-fieldset">
              <legend className="settings-legend">{event.label}</legend>
              <p className="settings-hint">{event.description}</p>

              <div className="settings-field">
                <label htmlFor={`hook-url-${event.key}`} className="settings-label">
                  Webhook URL
                </label>
                <input
                  id={`hook-url-${event.key}`}
                  type="url"
                  className="settings-input"
                  value={hook.url || ''}
                  onChange={(e) => handleHookChange(event.key, 'url', e.target.value)}
                  placeholder="https://hooks.example.com/webhook"
                />
              </div>

              <div className="settings-field">
                <label htmlFor={`hook-headers-${event.key}`} className="settings-label">
                  Headers (JSON)
                </label>
                <textarea
                  id={`hook-headers-${event.key}`}
                  className="settings-textarea settings-textarea-mono"
                  rows={3}
                  value={hook.headers || ''}
                  onChange={(e) => handleHookChange(event.key, 'headers', e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>

              <div className="settings-hook-actions">
                <button
                  type="button"
                  className="sf-btn sf-btn-secondary sf-btn-sm"
                  onClick={() => handleTest(event.key)}
                  disabled={testingEvent === event.key || !hook.url}
                >
                  {testingEvent === event.key ? 'Testing…' : 'Test Hook'}
                </button>

                {result && (
                  <span
                    className={`settings-test-result ${
                      result.success ? 'settings-test-result-ok' : 'settings-test-result-fail'
                    }`}
                  >
                    {result.message}
                  </span>
                )}
              </div>
            </fieldset>
          )
        })}

        {/* Save */}
        <div className="settings-actions">
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="hooks-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Event Hooks'}
          </button>
        </div>
      </form>
    </div>
  )
}
