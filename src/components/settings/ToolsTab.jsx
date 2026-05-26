/**
 * ToolsTab — tool definitions editor.
 *
 * Fields: tools_enabled, tools_base_url, max_tool_rounds
 * Plus collapsible tool cards with full configuration.
 */

import { useCallback, useMemo, useState } from 'react'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const EMPTY_TOOL = {
  name: '',
  description: '',
  http_method: 'POST',
  endpoint: '',
  timeout: 30,
  auth_header: '',
  requires_confirmation: false,
  parameters: '{}',
}

/**
 * @param {{ config: object, onChange: Function, onSave: Function, saving: boolean }} props
 */
export default function ToolsTab({ config, onChange, onSave, saving }) {
  const tools = useMemo(() => config.tools || [], [config.tools])
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [initial] = useState(() => JSON.stringify({
    tools_enabled: config.tools_enabled,
    tools_base_url: config.tools_base_url,
    max_tool_rounds: config.max_tool_rounds,
    tools: config.tools,
  }))

  const isDirty = useMemo(() => {
    return JSON.stringify({
      tools_enabled: config.tools_enabled,
      tools_base_url: config.tools_base_url,
      max_tool_rounds: config.max_tool_rounds,
      tools: config.tools,
    }) !== initial
  }, [config, initial])

  const handleGlobalChange = useCallback(
    (field, value) => {
      onChange({ [field]: value })
    },
    [onChange],
  )

  const handleToolChange = useCallback(
    (index, field, value) => {
      const updated = tools.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
      )
      onChange({ tools: updated })
    },
    [tools, onChange],
  )

  const handleAddTool = useCallback(() => {
    const updated = [...tools, { ...EMPTY_TOOL }]
    onChange({ tools: updated })
    setExpandedIdx(updated.length - 1)
  }, [tools, onChange])

  const handleDeleteTool = useCallback(
    (index) => {
      const updated = tools.filter((_, i) => i !== index)
      onChange({ tools: updated })
      setDeleteConfirm(null)
      setExpandedIdx(null)
    },
    [tools, onChange],
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
        {/* Global Tool Settings */}
        <fieldset className="settings-fieldset">
          <legend className="settings-legend">Tool Configuration</legend>

          <div className="settings-field settings-field-inline">
            <input
              id="tools-enabled"
              type="checkbox"
              className="settings-checkbox"
              checked={config.tools_enabled || false}
              onChange={(e) => handleGlobalChange('tools_enabled', e.target.checked)}
            />
            <label htmlFor="tools-enabled" className="settings-label settings-label-inline">
              Enable Tools
            </label>
          </div>

          <div className="settings-field-row">
            <div className="settings-field">
              <label htmlFor="tools-base-url" className="settings-label">
                Base URL
              </label>
              <input
                id="tools-base-url"
                type="text"
                className="settings-input"
                value={config.tools_base_url || ''}
                onChange={(e) => handleGlobalChange('tools_base_url', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="tools-max-rounds" className="settings-label">
                Max Tool Rounds
              </label>
              <input
                id="tools-max-rounds"
                type="number"
                className="settings-input"
                min={1}
                max={10}
                value={config.max_tool_rounds ?? 3}
                onChange={(e) =>
                  handleGlobalChange('max_tool_rounds', parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
          </div>
        </fieldset>

        {/* Tool Cards */}
        <fieldset className="settings-fieldset">
          <legend className="settings-legend">
            Tool Definitions
            <span className="settings-count-badge">{tools.length}</span>
          </legend>

          {tools.map((tool, index) => {
            const isExpanded = expandedIdx === index
            return (
              <div key={index} className="settings-tool-card sf-card">
                <button
                  type="button"
                  className="settings-tool-header"
                  onClick={() => setExpandedIdx(isExpanded ? null : index)}
                  aria-expanded={isExpanded}
                >
                  <span className={`settings-tool-chevron ${isExpanded ? 'settings-tool-chevron-open' : ''}`}>
                    ›
                  </span>
                  <span className="settings-tool-name">
                    {tool.name || `Tool ${index + 1}`}
                  </span>
                  <span className="settings-tool-method">{tool.http_method || 'POST'}</span>
                </button>

                {isExpanded && (
                  <div className="settings-tool-body">
                    <div className="settings-field-row">
                      <div className="settings-field">
                        <label htmlFor={`tool-name-${index}`} className="settings-label">
                          Name
                        </label>
                        <input
                          id={`tool-name-${index}`}
                          type="text"
                          className="settings-input"
                          value={tool.name || ''}
                          onChange={(e) => handleToolChange(index, 'name', e.target.value)}
                          placeholder="create_ticket"
                        />
                      </div>
                      <div className="settings-field">
                        <label htmlFor={`tool-method-${index}`} className="settings-label">
                          HTTP Method
                        </label>
                        <select
                          id={`tool-method-${index}`}
                          className="settings-select"
                          value={tool.http_method || 'POST'}
                          onChange={(e) => handleToolChange(index, 'http_method', e.target.value)}
                        >
                          {HTTP_METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="settings-field">
                      <label htmlFor={`tool-desc-${index}`} className="settings-label">
                        Description
                      </label>
                      <input
                        id={`tool-desc-${index}`}
                        type="text"
                        className="settings-input"
                        value={tool.description || ''}
                        onChange={(e) => handleToolChange(index, 'description', e.target.value)}
                        placeholder="Creates a support ticket in the system"
                      />
                    </div>

                    <div className="settings-field-row">
                      <div className="settings-field">
                        <label htmlFor={`tool-endpoint-${index}`} className="settings-label">
                          Endpoint
                        </label>
                        <input
                          id={`tool-endpoint-${index}`}
                          type="text"
                          className="settings-input"
                          value={tool.endpoint || ''}
                          onChange={(e) => handleToolChange(index, 'endpoint', e.target.value)}
                          placeholder="/v1/tickets"
                        />
                      </div>
                      <div className="settings-field">
                        <label htmlFor={`tool-timeout-${index}`} className="settings-label">
                          Timeout (seconds)
                        </label>
                        <input
                          id={`tool-timeout-${index}`}
                          type="number"
                          className="settings-input"
                          min={1}
                          max={300}
                          value={tool.timeout ?? 30}
                          onChange={(e) =>
                            handleToolChange(index, 'timeout', parseInt(e.target.value, 10) || 30)
                          }
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label htmlFor={`tool-auth-${index}`} className="settings-label">
                        Auth Header
                      </label>
                      <input
                        id={`tool-auth-${index}`}
                        type="text"
                        className="settings-input"
                        value={tool.auth_header || ''}
                        onChange={(e) => handleToolChange(index, 'auth_header', e.target.value)}
                        placeholder="Bearer ${SECRET_KEY}"
                      />
                    </div>

                    <div className="settings-field settings-field-inline">
                      <input
                        id={`tool-confirm-${index}`}
                        type="checkbox"
                        className="settings-checkbox"
                        checked={tool.requires_confirmation || false}
                        onChange={(e) =>
                          handleToolChange(index, 'requires_confirmation', e.target.checked)
                        }
                      />
                      <label htmlFor={`tool-confirm-${index}`} className="settings-label settings-label-inline">
                        Requires user confirmation
                      </label>
                    </div>

                    <div className="settings-field">
                      <label htmlFor={`tool-params-${index}`} className="settings-label">
                        Parameters (JSON)
                      </label>
                      <textarea
                        id={`tool-params-${index}`}
                        className="settings-textarea settings-textarea-mono"
                        rows={4}
                        value={
                          typeof tool.parameters === 'string'
                            ? tool.parameters
                            : JSON.stringify(tool.parameters, null, 2)
                        }
                        onChange={(e) => handleToolChange(index, 'parameters', e.target.value)}
                        placeholder='{"ticket_subject": {"type": "string"}}'
                      />
                    </div>

                    {/* Delete */}
                    <div className="settings-tool-footer">
                      {deleteConfirm === index ? (
                        <div className="settings-confirm-group">
                          <span className="settings-confirm-text">Delete this tool?</span>
                          <button
                            type="button"
                            className="sf-btn sf-btn-danger sf-btn-sm"
                            onClick={() => handleDeleteTool(index)}
                          >
                            Confirm
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
                          onClick={() => setDeleteConfirm(index)}
                        >
                          Delete Tool
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            className="sf-btn sf-btn-secondary settings-add-btn"
            onClick={handleAddTool}
          >
            + Add Tool
          </button>
        </fieldset>

        {/* Save */}
        <div className="settings-actions">
          <button
            type="submit"
            className="sf-btn sf-btn-primary"
            disabled={saving}
            id="tools-save-btn"
          >
            {isDirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Tool Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
