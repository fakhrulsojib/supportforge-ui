/**
 * StreamingIndicator — typing dots animation during AI response streaming.
 *
 * Uses the sf-bounce-dot keyframe defined in index.css.
 * Shows elapsed time after 10s ("Still thinking...") and a warning
 * message after 30s ("This is taking longer than usual...").
 */

import { useState, useEffect } from 'react'

export default function StreamingIndicator() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const label =
    elapsed >= 30
      ? 'This is taking longer than usual...'
      : elapsed >= 10
        ? `Still thinking... (${elapsed}s)`
        : 'SupportForge is thinking…'

  const showElapsed = elapsed >= 10

  return (
    <div
      className={`chat-streaming-indicator sf-animate-fade-in${showElapsed ? ' chat-streaming-indicator-slow' : ''}`}
      aria-live="polite"
      aria-label="AI is generating a response"
    >
      <div className="chat-streaming-dots">
        <span className="chat-streaming-dot" />
        <span className="chat-streaming-dot" />
        <span className="chat-streaming-dot" />
      </div>
      <span className="chat-streaming-label">{label}</span>
      {showElapsed && (
        <div className="chat-streaming-elapsed" aria-hidden="true" />
      )}
    </div>
  )
}
