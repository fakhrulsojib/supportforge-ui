/**
 * MessageBubble — renders a single chat message (user or assistant).
 *
 * User messages: right-aligned with primary accent.
 * Assistant messages: left-aligned with neutral background,
 *   source citations, and feedback buttons.
 *
 * Includes basic inline markdown rendering (bold, italic, code, code blocks).
 */

import SourceCitation from './SourceCitation'
import FeedbackButtons from './FeedbackButtons'
import { formatRelativeTime } from '../../utils/formatters'

/**
 * Basic markdown-to-HTML renderer.
 * Handles: **bold**, *italic*, `inline code`, ```code blocks```, and line breaks.
 *
 * Security: Uses textContent-safe replacement — no raw HTML injection.
 *
 * @param {string} text
 * @returns {Array<JSX.Element>}
 */
function renderMarkdown(text) {
  if (!text) return [<span key="empty" />]

  // Split by code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code-block', lang: match[1], content: match[2].trimEnd() })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last code block
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.map((part, idx) => {
    if (part.type === 'code-block') {
      return (
        <pre className="chat-code-block" key={idx}>
          <code>{part.content}</code>
        </pre>
      )
    }

    // Render inline markdown for text parts
    return <span key={idx}>{renderInlineMarkdown(part.content)}</span>
  })
}

/**
 * Render inline markdown: bold, italic, inline code, line breaks.
 * @param {string} text
 * @returns {Array<JSX.Element|string>}
 */
function renderInlineMarkdown(text) {
  // Split by inline code first to avoid processing markdown inside code
  const inlineCodeRegex = /`([^`]+)`/g
  const segments = []
  let lastIdx = 0
  let codeMatch
  let keyCounter = 0

  while ((codeMatch = inlineCodeRegex.exec(text)) !== null) {
    if (codeMatch.index > lastIdx) {
      segments.push(...renderBoldItalic(text.slice(lastIdx, codeMatch.index), keyCounter))
      keyCounter += 10
    }
    segments.push(
      <code className="chat-inline-code" key={`code-${keyCounter}`}>{codeMatch[1]}</code>
    )
    keyCounter += 1
    lastIdx = codeMatch.index + codeMatch[0].length
  }

  if (lastIdx < text.length) {
    segments.push(...renderBoldItalic(text.slice(lastIdx), keyCounter))
  }

  return segments
}

/**
 * Render bold and italic within text, preserving line breaks.
 * @param {string} text
 * @param {number} baseKey
 * @returns {Array<JSX.Element|string>}
 */
function renderBoldItalic(text, baseKey = 0) {
  // Replace **bold** and *italic*
  const combined = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g
  const result = []
  let last = 0
  let m
  let k = baseKey

  while ((m = combined.exec(text)) !== null) {
    if (m.index > last) {
      result.push(...splitNewlines(text.slice(last, m.index), k))
      k += 5
    }
    if (m[2]) {
      result.push(<strong key={`b-${k}`}>{m[2]}</strong>)
    } else if (m[4]) {
      result.push(<em key={`i-${k}`}>{m[4]}</em>)
    }
    k += 1
    last = m.index + m[0].length
  }

  if (last < text.length) {
    result.push(...splitNewlines(text.slice(last), k))
  }

  return result
}

/**
 * Split text by newlines and insert <br /> elements.
 * @param {string} text
 * @param {number} baseKey
 * @returns {Array<JSX.Element|string>}
 */
function splitNewlines(text, baseKey = 0) {
  const lines = text.split('\n')
  const result = []
  lines.forEach((line, i) => {
    if (i > 0) result.push(<br key={`br-${baseKey}-${i}`} />)
    if (line) result.push(line)
  })
  return result
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
          <details className="chat-thinking">
            <summary className="chat-thinking-toggle">
              <svg className="chat-thinking-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <circle cx="5.5" cy="8" r="1" fill="currentColor" opacity="0.5" />
                <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.5" />
                <circle cx="10.5" cy="8" r="1" fill="currentColor" opacity="0.5" />
              </svg>
              <span>Thinking…</span>
              <svg className="chat-thinking-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="chat-thinking-content">
              {renderMarkdown(thinking)}
            </div>
          </details>
        )}

        <div className="chat-bubble-content">
          {renderMarkdown(content)}
          {isStreaming && <span className="chat-cursor" aria-hidden="true" />}
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
