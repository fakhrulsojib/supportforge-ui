/**
 * VoiceButton — microphone toggle with animated states.
 *
 * Visual states:
 * - Disabled: greyed out, no interaction
 * - Idle: microphone icon, ready to record
 * - Listening: pulsing red dot, recording active
 * - Processing: spinner, STT in progress
 * - Speaking: speaker icon with wave animation
 * - Error: red icon with tooltip
 */

import { VOICE_STATE } from '../../hooks/useVoice'
import './VoiceButton.css'

/**
 * @param {Object} props
 * @param {string} props.voiceState - Current voice state from useVoice.
 * @param {boolean} props.isAvailable - Whether voice is available.
 * @param {Function} props.onToggle - Toggle recording callback.
 * @param {string} [props.errorMessage] - Error message to display.
 */
export default function VoiceButton({ voiceState, isAvailable, onToggle, errorMessage }) {
  const isDisabled = !isAvailable || voiceState === VOICE_STATE.DISABLED
  const isListening = voiceState === VOICE_STATE.LISTENING
  const isProcessing = voiceState === VOICE_STATE.PROCESSING
  const isSpeaking = voiceState === VOICE_STATE.SPEAKING
  const isError = voiceState === VOICE_STATE.ERROR

  const buttonLabel = isListening
    ? 'Stop recording'
    : isProcessing
    ? 'Processing...'
    : isSpeaking
    ? 'Speaking...'
    : isDisabled
    ? 'Voice unavailable'
    : 'Start voice input'

  return (
    <div className="sf-voice-button-wrapper">
      <button
        id="voice-toggle-btn"
        className={`sf-voice-button ${
          isListening ? 'sf-voice-button--listening' : ''
        } ${isProcessing ? 'sf-voice-button--processing' : ''} ${
          isSpeaking ? 'sf-voice-button--speaking' : ''
        } ${isError ? 'sf-voice-button--error' : ''} ${
          isDisabled ? 'sf-voice-button--disabled' : ''
        }`}
        onClick={onToggle}
        disabled={isDisabled || isProcessing || isSpeaking}
        aria-label={buttonLabel}
        title={isError ? errorMessage : buttonLabel}
      >
        {/* Microphone icon */}
        {!isProcessing && !isSpeaking && (
          <svg
            className="sf-voice-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}

        {/* Processing spinner */}
        {isProcessing && (
          <svg className="sf-voice-spinner" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="31.416"
              strokeDashoffset="10"
            />
          </svg>
        )}

        {/* Speaking wave */}
        {isSpeaking && (
          <svg
            className="sf-voice-icon sf-voice-icon--speaking"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}

        {/* Listening pulse indicator */}
        {isListening && <span className="sf-voice-pulse" />}
      </button>

      {isError && errorMessage && (
        <span className="sf-voice-error-text">{errorMessage}</span>
      )}
    </div>
  )
}
