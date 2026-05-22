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

const LOG_PREFIX = '[Voice]'

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
      console.info(LOG_PREFIX, 'Checking voice availability...')
      console.info(LOG_PREFIX, 'Secure context:', window.isSecureContext)
      console.info(LOG_PREFIX, 'MediaDevices available:', !!navigator.mediaDevices)
      try {
        const config = await getVoiceConfig()
        console.info(LOG_PREFIX, 'Voice config received:', config)
        if (!cancelled) {
          setVoiceConfig(config)
          setIsVoiceAvailable(config.voice_enabled)
          setVoiceState(config.voice_enabled ? VOICE_STATE.IDLE : VOICE_STATE.DISABLED)
          console.info(LOG_PREFIX, 'Voice state →', config.voice_enabled ? 'IDLE' : 'DISABLED')
        }
      } catch (err) {
        console.warn(LOG_PREFIX, 'Voice config fetch failed:', err.message)
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
    if (voiceState !== VOICE_STATE.IDLE) {
      console.warn(LOG_PREFIX, 'startListening blocked — state is:', voiceState)
      return
    }

    console.info(LOG_PREFIX, 'Starting microphone capture...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      console.info(LOG_PREFIX, 'Microphone stream acquired:', {
        tracks: stream.getAudioTracks().length,
        settings: stream.getAudioTracks()[0]?.getSettings(),
      })

      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      console.info(LOG_PREFIX, 'MediaRecorder mimeType:', mimeType)

      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.debug(LOG_PREFIX, 'Audio chunk received:', event.data.size, 'bytes, total chunks:', audioChunksRef.current.length)
        }
      }

      recorder.onstop = async () => {
        console.info(LOG_PREFIX, 'Recording stopped, processing...')
        setVoiceState(VOICE_STATE.PROCESSING)

        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const chunkCount = audioChunksRef.current.length
        audioChunksRef.current = []

        console.info(LOG_PREFIX, 'Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunkCount,
        })

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
          console.debug(LOG_PREFIX, 'Media tracks stopped')
        }

        // Notify parent with audio blob for processing
        if (onTranscript) {
          console.info(LOG_PREFIX, 'Sending audio blob to onTranscript callback')
          onTranscript(audioBlob)
        }

        setVoiceState(VOICE_STATE.IDLE)
        console.info(LOG_PREFIX, 'Voice state → IDLE')
      }

      recorder.onerror = (event) => {
        console.error(LOG_PREFIX, 'MediaRecorder error:', event.error)
        setVoiceState(VOICE_STATE.ERROR)
        setErrorMessage('Recording failed')
        if (onError) onError('Recording failed')
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // 250ms chunks
      setVoiceState(VOICE_STATE.LISTENING)
      setErrorMessage(null)
      console.info(LOG_PREFIX, 'Voice state → LISTENING (recording at 250ms intervals)')
    } catch (err) {
      console.error(LOG_PREFIX, 'getUserMedia failed:', {
        name: err.name,
        message: err.message,
        isSecureContext: window.isSecureContext,
      })
      setVoiceState(VOICE_STATE.ERROR)
      let msg = 'Failed to start recording'
      if (err.name === 'NotAllowedError') {
        msg = 'Microphone access denied'
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone found'
      } else if (!window.isSecureContext) {
        msg = 'Microphone requires HTTPS (use localhost or enable HTTPS)'
      }
      setErrorMessage(msg)
      if (onError) onError(msg)
    }
  }, [voiceState, onTranscript, onError])

  /**
   * Stop recording and trigger processing.
   */
  const stopListening = useCallback(() => {
    console.info(LOG_PREFIX, 'stopListening called, recorder state:', mediaRecorderRef.current?.state)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      console.info(LOG_PREFIX, 'MediaRecorder.stop() called')
    }
  }, [])

  /**
   * Toggle voice recording on/off.
   */
  const toggleVoice = useCallback(() => {
    console.info(LOG_PREFIX, 'toggleVoice called, current state:', voiceState)
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
        console.info(LOG_PREFIX, 'Cleanup: stopping media tracks on unmount')
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
