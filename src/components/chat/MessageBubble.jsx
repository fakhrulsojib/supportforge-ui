/**
 * MessageBubble — renders a single chat message (user or assistant).
 *
 * User messages: right-aligned with primary accent.
 * Assistant messages: left-aligned with neutral background,
 *   source citations, and feedback buttons.
 *
 * Uses react-markdown for rich formatting (bold, italic, lists,
 * code blocks, inline code, etc.).
 */

import { useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import SourceCitation from './SourceCitation'
import FeedbackButtons from './FeedbackButtons'
import { formatRelativeTime } from '../../utils/formatters'

/**
 * Custom component overrides for react-markdown to apply our CSS classes.
 */
const markdownComponents = {
  // Lists
  ul: ({ children }) => <ul className="chat-list">{children}</ul>,
  ol: ({ children }) => <ol className="chat-list">{children}</ol>,
  // Code blocks
  pre: ({ children }) => <pre className="chat-code-block">{children}</pre>,
  code: ({ inline, children, ...props }) =>
    inline
      ? <code className="chat-inline-code" {...props}>{children}</code>
      : <code {...props}>{children}</code>,
  // Paragraphs — avoid extra margins inside bubble
  p: ({ children }) => <p className="chat-md-paragraph">{children}</p>,
}

/**
 * @param {{
 *   role: 'user' | 'assistant',
 *   content: string,
 *   thinking?: string,
 *   sources?: Array<{content: string, score: number, id: string}>,
 *   messageId?: string,
 *   feedback?: string,
 *   createdAt?: string,
 *   isStreaming?: boolean
 * }} props
 */
export default function MessageBubble({
  role,
  content,
  thinking,
  sources,
  messageId,
  feedback,
  createdAt,
  isStreaming = false,
}) {
  const isUser = role === 'user'
  const thinkingContentRef = useRef(null)

  // Auto-scroll thinking content as new tokens arrive during streaming
  useEffect(() => {
    if (isStreaming && thinking && thinkingContentRef.current) {
      thinkingContentRef.current.scrollTop = thinkingContentRef.current.scrollHeight
    }
  }, [thinking, isStreaming])

  return (
    <div className={`chat-bubble-row ${isUser ? 'chat-bubble-row-user' : 'chat-bubble-row-assistant'} sf-animate-fade-in-up`}>
      {/* Avatar */}
      {!isUser && (
        <div className="chat-avatar chat-avatar-assistant" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {/* Thinking section — collapsible, grayed */}
        {!isUser && thinking && (
          <details className="chat-thinking" open={isStreaming || undefined}>
            <summary className="chat-thinking-toggle">
              <svg className="chat-thinking-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <circle cx="5.5" cy="8" r="1" fill="currentColor" opacity="0.5" />
                <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.5" />
                <circle cx="10.5" cy="8" r="1" fill="currentColor" opacity="0.5" />
              </svg>
              <span>{isStreaming ? 'Thinking…' : 'Thought process'}</span>
              <svg className="chat-thinking-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="chat-thinking-content" ref={thinkingContentRef}>
              <Markdown components={markdownComponents}>{thinking}</Markdown>
            </div>
          </details>
        )}

        <div className="chat-bubble-content">
          {isStreaming && !content && thinking ? (
            <span className="chat-thinking-placeholder">Thinking...</span>
          ) : (
            <>
              <Markdown components={markdownComponents}>{content || ''}</Markdown>
              {isStreaming && <span className="chat-cursor" aria-hidden="true" />}
            </>
          )}
        </div>

        {/* Sources — assistant only */}
        {!isUser && sources && sources.length > 0 && (
          <SourceCitation sources={sources} />
        )}

        {/* Footer: timestamp + feedback */}
        <div className="chat-bubble-footer">
          {createdAt && (
            <span className="chat-bubble-time">{formatRelativeTime(createdAt)}</span>
          )}
          {!isUser && messageId && !isStreaming && (
            <FeedbackButtons messageId={messageId} currentFeedback={feedback} />
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="chat-avatar chat-avatar-user" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
