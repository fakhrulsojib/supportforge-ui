/**
 * StreamingIndicator — typing dots animation during AI response streaming.
 *
 * Uses the sf-bounce-dot keyframe defined in index.css.
 */

export default function StreamingIndicator() {
  return (
    <div className="chat-streaming-indicator sf-animate-fade-in" aria-live="polite" aria-label="AI is generating a response">
      <div className="chat-streaming-dots">
        <span className="chat-streaming-dot" />
        <span className="chat-streaming-dot" />
        <span className="chat-streaming-dot" />
      </div>
      <span className="chat-streaming-label">SupportForge is thinking…</span>
    </div>
  )
}
