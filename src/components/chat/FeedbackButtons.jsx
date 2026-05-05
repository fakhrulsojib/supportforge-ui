/**
 * FeedbackButtons — thumbs up/down for assistant messages.
 *
 * Calls updateMessageFeedback via chatApi.js (centralised client).
 *
 * Security:
 * - No tokens or sensitive data logged to console
 * - Error messages shown inline (no stack traces)
 */

import { useState } from 'react'
import { updateMessageFeedback } from '../../api/chatApi'
import { extractErrorMessage } from '../../api/client'

/**
 * @param {{ messageId: string, currentFeedback?: string }} props
 */
export default function FeedbackButtons({ messageId, currentFeedback = 'none' }) {
  const [feedback, setFeedback] = useState(currentFeedback)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)

  async function handleFeedback(type) {
    if (!messageId || isSubmitting) return

    // Toggle off if same feedback clicked again
    if (feedback === type) return

    setIsSubmitting(true)
    setFeedbackError(null)

    try {
      await updateMessageFeedback(messageId, type)
      setFeedback(type)
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="chat-feedback" role="group" aria-label="Message feedback">
      <button
        type="button"
        className={`chat-feedback-btn ${feedback === 'positive' ? 'chat-feedback-btn-active chat-feedback-positive' : ''}`}
        onClick={() => handleFeedback('positive')}
        disabled={isSubmitting}
        aria-label="Helpful"
        aria-pressed={feedback === 'positive'}
        title="Helpful"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M5 14H3a1 1 0 01-1-1V8a1 1 0 011-1h2m0 7V7m0 7h6.586a1 1 0 00.924-.617l1.964-4.91A1 1 0 0013.549 7H10V3.5a1.5 1.5 0 00-1.5-1.5h-.232a1 1 0 00-.894.553L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className={`chat-feedback-btn ${feedback === 'negative' ? 'chat-feedback-btn-active chat-feedback-negative' : ''}`}
        onClick={() => handleFeedback('negative')}
        disabled={isSubmitting}
        aria-label="Not helpful"
        aria-pressed={feedback === 'negative'}
        title="Not helpful"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M11 2h2a1 1 0 011 1v5a1 1 0 01-1 1h-2m0-7V9m0-7H4.414a1 1 0 00-.924.617l-1.964 4.91A1 1 0 002.451 9H6v3.5A1.5 1.5 0 007.5 14h.232a1 1 0 00.894-.553L11 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {feedbackError && (
        <span className="chat-feedback-error" role="alert">{feedbackError}</span>
      )}
    </div>
  )
}
