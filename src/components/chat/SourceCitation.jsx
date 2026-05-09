/**
 * SourceCitation — collapsible source cards showing RAG citation details.
 *
 * Displays document-level sources (grouped by filename) with the
 * highest relevance score per document. Shows a compact summary
 * by default, expanding to show details on click.
 */

import { useState, useId } from 'react'

/**
 * @param {{ sources: Array<{filename?: string, content?: string, score: number, id: string}> }} props
 */
export default function SourceCitation({ sources }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const listId = useId()

  if (!sources || sources.length === 0) return null

  return (
    <div className="chat-sources">
      <button
        type="button"
        className="chat-sources-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={listId}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="chat-sources-icon">
          <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`chat-sources-chevron ${isExpanded ? 'chat-sources-chevron-open' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isExpanded && (
        <div className="chat-sources-list sf-animate-fade-in" id={listId} role="region" aria-label="Source citations">
          {sources.map((source, index) => (
            <div className="chat-source-card" key={source.id || index}>
              <div className="chat-source-content">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <span className="sf-truncate">{source.filename || source.content || 'Unknown source'}</span>
              </div>
              <div className="chat-source-meta">
                <span className="sf-badge sf-badge-info chat-source-score">
                  {Math.round(source.score * 100)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
