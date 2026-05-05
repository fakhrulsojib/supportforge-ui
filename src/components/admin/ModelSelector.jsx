/**
 * ModelSelector — read-only display of current LLM model configuration.
 *
 * Shows the chat and embedding model names from environment variables.
 * This is a display-only component — editing is Phase 4.1 (A/B Testing).
 *
 * Security:
 * - No sensitive data displayed (model names are not secrets)
 * - No API calls — reads from environment constants only
 */

import { CHAT_MODEL, EMBEDDING_MODEL } from '../../utils/constants'

export default function ModelSelector() {
  return (
    <div>
      <div className="admin-model-grid">
        {/* Chat Model Card */}
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
            <span className="admin-model-name">{CHAT_MODEL}</span>
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
