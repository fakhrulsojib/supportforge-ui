/**
 * ChatWindow — main chat container with message list and input bar.
 *
 * Displays conversation messages with auto-scroll, handles user input,
 * and shows streaming indicators during AI response generation.
 *
 * Accessibility:
 * - Enter to send, Shift+Enter for newline
 * - ARIA labels on all interactive elements
 * - Live region for streaming status
 */

import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import StreamingIndicator from './StreamingIndicator'

/**
 * @param {{
 *   messages: Array<{id?: string, role: string, content: string, sources?: Array, feedback?: string, created_at?: string}>,
 *   onSendMessage: (message: string) => void,
 *   isStreaming: boolean,
 *   streamingText: string,
 *   streamingSources: Array,
 *   isConnected: boolean,
 *   error: string|null
 * }} props
 */
export default function ChatWindow({
  messages,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  streamingText,
  streamingThinking,
  streamingSources,
  isConnected,
  error,
  readOnly = false,
  readOnlyLabel = '',
}) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  /** Auto-scroll to bottom when messages change or during streaming */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, isStreaming])

  /** Auto-resize textarea to content (max 4 lines) */
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = parseInt(getComputedStyle(textarea).lineHeight) * 4 + 16
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [inputValue])

  function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || isStreaming) return

    onSendMessage(trimmed)
    setInputValue('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleStop() {
    if (onStopStreaming) onStopStreaming()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming) {
        handleSend()
      }
    }
  }

  const hasMessages = messages.length > 0 || isStreaming

  return (
    <div className="chat-window">
      {/* Connection status */}
      {!isConnected && (
        <div className="chat-connection-bar chat-connection-disconnected" role="status">
          <span className="chat-connection-dot" />
          <span>Reconnecting to chat server…</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="chat-error-bar sf-animate-fade-in" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Message list */}
      <div className="chat-messages sf-scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages">
        {!hasMessages && (
          <div className="chat-empty-state sf-animate-fade-in-up">
            <div className="chat-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect width="48" height="48" rx="16" fill="url(#chat-empty-grad)" opacity="0.15" />
                <path d="M16 22c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v4c0 2.21-1.79 4-4 4h-2l-4 4v-4h-2c-2.21 0-4-1.79-4-4v-4z" stroke="url(#chat-empty-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="22" cy="24" r="1" fill="url(#chat-empty-grad)" />
                <circle cx="26" cy="24" r="1" fill="url(#chat-empty-grad)" />
                <defs>
                  <linearGradient id="chat-empty-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="hsl(249, 64%, 55%)" />
                    <stop offset="1" stopColor="hsl(254, 55%, 40%)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className="chat-empty-title">Start a conversation</h3>
            <p className="chat-empty-text">
              Ask a question and get AI-powered answers backed by your knowledge base.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || `msg-${index}`}
            role={msg.role}
            content={msg.content}
            thinking={msg.thinking}
            sources={msg.sources_json || msg.sources}
            messageId={msg.id}
            feedback={msg.feedback}
            createdAt={msg.created_at}
          />
        ))}

        {/* Streaming assistant message (in-progress) */}
        {isStreaming && (streamingText || streamingThinking) && (
          <MessageBubble
            role="assistant"
            content={streamingText}
            thinking={streamingThinking}
            sources={streamingSources}
            isStreaming
          />
        )}

        {/* Streaming indicator (before first token) */}
        {isStreaming && !streamingText && !streamingThinking && (
          <StreamingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — hidden in read-only mode */}
      {readOnly ? (
        <div className="chat-readonly-bar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1a4 4 0 0 0-4 4v3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm-2.5 4a2.5 2.5 0 0 1 5 0v3h-5V5z" fill="currentColor" />
          </svg>
          <span>Read-only — Viewing conversation by <strong>{readOnlyLabel || 'another user'}</strong></span>
        </div>
      ) : (
        <div className="chat-input-bar">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input sf-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type your message…' : 'Connecting…'}
              disabled={!isConnected}
              rows={1}
              aria-label="Chat message input"
              id="chat-message-input"
            />
            {isStreaming ? (
              <button
                type="button"
                className="chat-stop-btn sf-btn sf-btn-icon"
                onClick={handleStop}
                aria-label="Stop generation"
                id="chat-stop-btn"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="10" height="10" rx="2" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="chat-send-btn sf-btn sf-btn-primary sf-btn-icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || !isConnected}
                aria-label="Send message"
                id="chat-send-btn"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M2 9l7-7v5h7v4h-7v5L2 9z" fill="currentColor" transform="rotate(-90 9 9)" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
