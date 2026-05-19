/**
 * useVoice hook — manages voice recording, STT/TTS state.
 *
 * Handles:
 * - Checking voice availability via API
 * - Recording audio via MediaRecorder (webm/opus codec)
 * - Sending recorded audio blob for STT processing
 * - Receiving TTS audio for playback
 * - Visual states (idle, listening, processing, speaking)
 *
 * Note: Codec conversion (webm → PCM Int16) is handled at the
 * transport layer (Pipecat WebRTC) — not in this hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { getVoiceConfig } from '../api/voiceApi'

/**
 * Voice session states.
 */
export const VOICE_STATE = {
  DISABLED: 'disabled',
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
}

/**
 * Custom hook for voice interaction.
 *
 * @param {Object} options
 * @param {Function} [options.onTranscript] - Called with transcribed text.
 * @param {Function} [options.onError] - Called on voice errors.
 * @returns {Object} Voice state and controls.
 */
export function useVoice({ onTranscript, onError } = {}) {
  const [voiceState, setVoiceState] = useState(VOICE_STATE.DISABLED)
  const [voiceConfig, setVoiceConfig] = useState(null)
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Check voice availability on mount
  useEffect(() => {
    let cancelled = false

    async function checkVoice() {
      try {
        const config = await getVoiceConfig()
        if (!cancelled) {
          setVoiceConfig(config)
          setIsVoiceAvailable(config.voice_enabled)
          setVoiceState(config.voice_enabled ? VOICE_STATE.IDLE : VOICE_STATE.DISABLED)
        }
      } catch {
        if (!cancelled) {
          setIsVoiceAvailable(false)
          setVoiceState(VOICE_STATE.DISABLED)
        }
      }
    }

    checkVoice()
    return () => { cancelled = true }
  }, [])

  /**
   * Start recording audio from the microphone.
   */
  const startListening = useCallback(async () => {
    if (voiceState !== VOICE_STATE.IDLE) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        setVoiceState(VOICE_STATE.PROCESSING)

        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
        }

        // Notify parent with audio blob for processing
        if (onTranscript) {
          onTranscript(audioBlob)
        }

        setVoiceState(VOICE_STATE.IDLE)
      }

      recorder.onerror = () => {
        setVoiceState(VOICE_STATE.ERROR)
        setErrorMessage('Recording failed')
        if (onError) onError('Recording failed')
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // 250ms chunks
      setVoiceState(VOICE_STATE.LISTENING)
      setErrorMessage(null)
    } catch (err) {
      setVoiceState(VOICE_STATE.ERROR)
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone access denied'
        : 'Failed to start recording'
      setErrorMessage(msg)
      if (onError) onError(msg)
    }
  }, [voiceState, onTranscript, onError])

  /**
   * Stop recording and trigger processing.
   */
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  /**
   * Toggle voice recording on/off.
   */
  const toggleVoice = useCallback(() => {
    if (voiceState === VOICE_STATE.LISTENING) {
      stopListening()
    } else if (voiceState === VOICE_STATE.IDLE) {
      startListening()
    }
  }, [voiceState, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    voiceState,
    voiceConfig,
    isVoiceAvailable,
    errorMessage,
    startListening,
    stopListening,
    toggleVoice,
  }
}
