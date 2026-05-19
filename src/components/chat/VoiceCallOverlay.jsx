/**
 * VoiceCallOverlay — phone-call-style voice conversation.
 *
 * Provides a seamless voice experience:
 * 1. Opens mic automatically on mount
 * 2. Detects silence (VAD) → sends audio to STT
 * 3. Transcribed text sent as chat message
 * 4. AI response text synthesized to audio → played back
 * 5. After playback → mic re-opens for next turn
 *
 * All conversation is persisted in the chat transcript.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { transcribeAudio, synthesizeAudio } from '../../api/voiceApi'
import '../../styles/voice-call.css'

const LOG = '[VoiceCall]'

// Call states
const CALL_STATE = {
  CONNECTING: 'connecting',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
}

const STATUS_TEXT = {
  connecting: 'Connecting…',
  listening: 'Listening…',
  processing: 'Processing…',
  speaking: 'Agent speaking…',
}

// VAD config
const SILENCE_THRESHOLD = 0.015 // Volume level below which = silence
const SILENCE_DURATION_MS = 1800 // 1.8s of silence triggers send
const MIN_RECORDING_MS = 800 // Don't send recordings shorter than this

/**
 * @param {{
 *   onSendMessage: (text: string) => void,
 *   onEndCall: () => void,
 *   lastAssistantMessage: string|null,
 * }} props
 */
export default function VoiceCallOverlay({ onSendMessage, onEndCall, lastAssistantMessage }) {
  const [callState, setCallState] = useState(CALL_STATE.CONNECTING)
  const [callDuration, setCallDuration] = useState(0)
  const [lastTranscript, setLastTranscript] = useState('')
  const [volumeBars, setVolumeBars] = useState([3, 3, 3, 3, 3])

  // Refs for audio pipeline
  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const recordingStartRef = useRef(null)
  const vadFrameRef = useRef(null)
  const callStartRef = useRef(Date.now())
  const isMountedRef = useRef(true)
  const isProcessingRef = useRef(false)
  const ttsAudioRef = useRef(null)
  const pendingTTSRef = useRef(null)
  const responseTimeoutRef = useRef(null)

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Format duration as MM:SS
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /**
   * Start listening — open mic with VAD.
   */
  const startListening = useCallback(async () => {
    if (!isMountedRef.current) return
    console.info(LOG, 'Starting mic...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })

      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      mediaStreamRef.current = stream

      // Set up audio analyser for VAD
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)
      audioContextRef.current = ctx

      // Start MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'

      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        console.info(LOG, 'Recorder stopped, chunks:', audioChunksRef.current.length)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        const duration = Date.now() - (recordingStartRef.current || Date.now())
        console.info(LOG, 'Recording duration:', duration, 'ms, blob size:', blob.size)

        if (blob.size > 100 && duration > MIN_RECORDING_MS) {
          processAudio(blob)
        } else {
          console.info(LOG, 'Recording too short, restarting mic')
          if (isMountedRef.current && !isProcessingRef.current) {
            startListening()
          }
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(200)
      recordingStartRef.current = Date.now()
      setCallState(CALL_STATE.LISTENING)
      console.info(LOG, 'Listening — VAD active')

      // Start VAD monitoring
      startVAD(analyser)

    } catch (err) {
      console.error(LOG, 'Mic error:', err.name, err.message)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * VAD — monitor volume levels, detect silence.
   */
  const startVAD = useCallback((analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let silenceStart = null

    function checkVolume() {
      if (!isMountedRef.current) return

      analyser.getByteFrequencyData(dataArray)

      // Calculate RMS volume
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / dataArray.length)

      // Update volume bars for visualization
      const bars = Array.from({ length: 5 }, (_, i) => {
        const threshold = 0.02 + i * 0.04
        return Math.min(20, Math.max(3, rms > threshold ? Math.floor(rms * 100) : 3))
      })
      setVolumeBars(bars)

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now()
        const silenceDuration = Date.now() - silenceStart

        if (silenceDuration >= SILENCE_DURATION_MS) {
          console.info(LOG, 'Silence detected after', silenceDuration, 'ms — stopping recording')
          silenceStart = null
          // Call stopRecording directly via ref-stable pattern
          if (vadFrameRef.current) {
            cancelAnimationFrame(vadFrameRef.current)
            vadFrameRef.current = null
          }
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop())
            mediaStreamRef.current = null
          }
          if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close()
          }
          return
        }
      } else {
        silenceStart = null
      }

      vadFrameRef.current = requestAnimationFrame(checkVolume)
    }

    vadFrameRef.current = requestAnimationFrame(checkVolume)
  }, [])

  /**
   * Stop recording (triggered by VAD or manual).
   */
  const stopRecording = useCallback(() => {
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current)
      vadFrameRef.current = null
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close()
    }
  }, [])

  /**
   * Process recorded audio — STT → send as message.
   */
  const processAudio = useCallback(async (blob) => {
    if (!isMountedRef.current) return
    isProcessingRef.current = true
    setCallState(CALL_STATE.PROCESSING)
    console.info(LOG, 'Transcribing audio...', blob.size, 'bytes')

    try {
      const result = await transcribeAudio(blob)
      console.info(LOG, 'Transcription:', result)

      if (result.text?.trim()) {
        setLastTranscript(result.text.trim())
        console.info(LOG, 'Sending message:', result.text.trim())
        onSendMessage(result.text.trim())
        // Wait for AI response — the parent will pass lastAssistantMessage.
        // Set a timeout to recover if the response never arrives (e.g. WS disconnect).
        setCallState(CALL_STATE.SPEAKING)

        responseTimeoutRef.current = setTimeout(() => {
          console.warn(LOG, 'AI response timeout (30s) — re-listening')
          isProcessingRef.current = false
          if (isMountedRef.current) {
            setCallState(CALL_STATE.LISTENING)
            startListening()
          }
        }, 30_000)
      } else {
        console.info(LOG, 'Empty transcription, re-listening')
        isProcessingRef.current = false
        if (isMountedRef.current) startListening()
      }
    } catch (err) {
      console.error(LOG, 'Transcription failed:', err.message)
      isProcessingRef.current = false
      if (isMountedRef.current) startListening()
    }
  }, [onSendMessage, startListening])

  /**
   * Strip markdown formatting for natural TTS playback.
   * Removes bold/italic markers, headers, links, code blocks, etc.
   */
  function stripMarkdown(text) {
    return text
      .replace(/```[\s\S]*?```/g, '')     // code blocks
      .replace(/`([^`]+)`/g, '$1')        // inline code
      .replace(/!\[.*?\]\(.*?\)/g, '')     // images
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → keep text
      .replace(/^#{1,6}\s+/gm, '')        // headers
      .replace(/(\*\*|__)(.*?)\1/g, '$2')  // bold
      .replace(/(\*|_)(.*?)\1/g, '$2')     // italic
      .replace(/~~(.*?)~~/g, '$1')         // strikethrough
      .replace(/^[\s]*[-*+]\s+/gm, '')    // unordered lists
      .replace(/^[\s]*\d+\.\s+/gm, '')    // ordered lists
      .replace(/^>\s+/gm, '')             // blockquotes
      .replace(/---+/g, '')               // horizontal rules
      .replace(/\n{3,}/g, '\n\n')         // excess newlines
      .trim()
  }

  /**
   * TTS playback when AI response arrives.
   */
  useEffect(() => {
    if (!lastAssistantMessage || callState !== CALL_STATE.SPEAKING) return
    if (pendingTTSRef.current === lastAssistantMessage) return
    pendingTTSRef.current = lastAssistantMessage

    // Clear the response timeout — AI responded
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }

    // Strip markdown for natural speech
    const spokenText = stripMarkdown(lastAssistantMessage)
    if (!spokenText) {
      console.warn(LOG, 'TTS text empty after markdown strip — re-listening')
      isProcessingRef.current = false
      pendingTTSRef.current = null
      if (isMountedRef.current) startListening()
      return
    }

    console.info(LOG, 'Synthesizing TTS for:', spokenText.substring(0, 60))

    const synthesizeAndPlay = async () => {
      try {
        // Use centralized API client (handles auth token injection)
        const audioBlob = await synthesizeAudio(spokenText)

        // Check if we were unmounted during the async call
        if (!isMountedRef.current) return

        console.info(LOG, 'TTS audio received:', audioBlob.size, 'bytes')

        if (audioBlob.size < 100) {
          console.warn(LOG, 'TTS audio too small, skipping playback')
          isProcessingRef.current = false
          if (isMountedRef.current) startListening()
          return
        }

        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        ttsAudioRef.current = audio

        audio.onended = () => {
          console.info(LOG, 'TTS playback finished — restarting mic')
          URL.revokeObjectURL(audioUrl)
          ttsAudioRef.current = null
          isProcessingRef.current = false
          pendingTTSRef.current = null
          if (isMountedRef.current) startListening()
        }

        audio.onerror = (e) => {
          console.error(LOG, 'TTS playback error:', e)
          URL.revokeObjectURL(audioUrl)
          isProcessingRef.current = false
          pendingTTSRef.current = null
          if (isMountedRef.current) startListening()
        }

        await audio.play()
        console.info(LOG, 'TTS playing...')

      } catch (err) {
        console.error(LOG, 'TTS failed:', err.message)
        isProcessingRef.current = false
        pendingTTSRef.current = null
        if (isMountedRef.current) startListening()
      }
    }

    synthesizeAndPlay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAssistantMessage, callState])

  // Auto-start listening on mount
  useEffect(() => {
    const timer = setTimeout(() => startListening(), 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.info(LOG, 'Unmounting — cleanup')
      isMountedRef.current = false
      if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current)
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current)

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause()
        ttsAudioRef.current = null
      }
    }
  }, [])

  const handleEndCall = useCallback(() => {
    console.info(LOG, 'End call clicked')
    // Stop TTS if playing
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current = null
    }
    // Clear AI response timeout
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
    stopRecording()
    onEndCall()
  }, [stopRecording, onEndCall])

  return (
    <div className="voice-call-backdrop" onClick={(e) => e.target === e.currentTarget && handleEndCall()}>
      <div className="voice-call-panel">

        {/* Animated Rings + Center Icon */}
        <div className="voice-call-rings" data-state={callState}>
          <div className="voice-call-ring voice-call-ring-1" />
          <div className="voice-call-ring voice-call-ring-2" />
          <div className="voice-call-ring voice-call-ring-3" />
          <div className="voice-call-icon" data-state={callState}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Status */}
        <div className="voice-call-status" data-state={callState}>
          {STATUS_TEXT[callState]}
        </div>

        {/* Volume Meter (during listening) */}
        {callState === CALL_STATE.LISTENING && (
          <div className="voice-call-volume">
            {volumeBars.map((h, i) => (
              <div key={i} className="voice-call-volume-bar" style={{ height: `${h}px` }} />
            ))}
          </div>
        )}

        {/* Last Transcript */}
        {lastTranscript && (
          <div className="voice-call-transcript">
            <div className="voice-call-transcript-label">You said</div>
            {lastTranscript}
          </div>
        )}

        {/* Timer */}
        <div className="voice-call-timer">{formatDuration(callDuration)}</div>

        {/* End Call */}
        <button
          className="voice-call-end-btn"
          onClick={handleEndCall}
          aria-label="End voice call"
          id="voice-call-end-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M23 16.92c0 .35-.07.71-.22 1.04-.15.33-.37.64-.67.89a4.56 4.56 0 0 1-1.06.66c-.4.17-.84.25-1.3.25-.73 0-1.5-.17-2.3-.52a15.4 15.4 0 0 1-2.47-1.37 24.1 24.1 0 0 1-2.62-1.97 23.6 23.6 0 0 1-2.47-2.47 23.7 23.7 0 0 1-1.96-2.61A15.5 15.5 0 0 1 2.6 8.37c-.35-.8-.52-1.56-.52-2.29 0-.45.08-.88.24-1.28.16-.4.42-.77.79-1.09.44-.38.93-.57 1.44-.57.2 0 .39.04.57.12.18.08.34.2.47.37l1.63 2.3c.13.18.22.35.29.52.07.16.1.32.1.47 0 .2-.06.39-.17.58-.1.18-.26.37-.45.56l-.62.64c-.09.09-.13.2-.13.33 0 .07.01.13.03.19.03.07.05.12.07.17a10 10 0 0 0 1.25 1.74c.56.6 1.15 1.22 1.8 1.83.52.49 1.12.58 1.45.25l.6-.61c.2-.2.39-.36.57-.46.18-.11.37-.17.58-.17.15 0 .31.04.48.11.17.07.34.17.52.3l2.33 1.65c.17.12.3.27.37.45.07.17.11.34.11.55z"
              fill="currentColor" />
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

      </div>
    </div>
  )
}
