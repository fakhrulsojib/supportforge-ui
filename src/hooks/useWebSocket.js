/**
 * useWebSocket — custom hook for WebSocket-based chat streaming.
 *
 * Manages the WebSocket lifecycle: connect, send, receive, reconnect.
 *
 * Security:
 * - JWT token read from in-memory store (getAccessToken), never localStorage
 * - No tokens or sensitive data logged to console
 *
 * Protocol (matches backend chat_ws.py):
 *   Client → Server: {"message": "...", "conversation_id": "..."}
 *   Server → Client:
 *     {"type": "source",   "data": {"content": "...", "score": 0.9, "id": "..."}}
 *     {"type": "thinking", "data": "reasoning text"}
 *     {"type": "token",    "data": "partial text"}
 *     {"type": "done",     "data": {"conversation_id": "...", "thinking_text": "...", ...}}
 *     {"type": "error",    "data": {"message": "..."}}
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { getAccessToken } from '../api/client'
import { WS_URL } from '../utils/constants'

/** Reconnection config */
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

/**
 * @typedef {object} UseWebSocketReturn
 * @property {boolean} isConnected
 * @property {boolean} isStreaming
 * @property {string} streamingText
 * @property {Array<{content: string, score: number, id: string}>} sources
 * @property {string|null} error
 * @property {string|null} lastConversationId
 * @property {Function} sendMessage
 * @property {Function} connect
 * @property {Function} disconnect
 */

/**
 * Hook for managing WebSocket chat streaming.
 *
 * @returns {UseWebSocketReturn}
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingThinking, setStreamingThinking] = useState('')
  const [sources, setSources] = useState([])
  const [error, setError] = useState(null)
  const [lastConversationId, setLastConversationId] = useState(null)

  const wsRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const shouldReconnectRef = useRef(true)

  /**
   * Refs to accumulate streaming state without relying on
   * React state setter callbacks (which are double-invoked
   * by StrictMode, causing duplicate side effects).
   */
  const streamingTextRef = useRef('')
  const streamingThinkingRef = useRef('')
  const sourcesRef = useRef([])

  /** Callbacks that consumers can register for completed messages */
  const onMessageCompleteRef = useRef(null)

  /**
   * Register a callback for when a streaming message completes.
   * @param {Function|null} callback - (text, sources, conversationId) => void
   */
  const setOnMessageComplete = useCallback((callback) => {
    onMessageCompleteRef.current = callback
  }, [])

  /**
   * Establish the WebSocket connection.
   */
  const connect = useCallback(() => {
    const token = getAccessToken()
    if (!token) {
      setError('Authentication required')
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Ensure auto-reconnect is enabled on fresh connect
    shouldReconnectRef.current = true

    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      reconnectAttemptRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)

        switch (frame.type) {
          case 'thinking':
            streamingThinkingRef.current += frame.data
            setStreamingThinking(streamingThinkingRef.current)
            break

          case 'token':
            streamingTextRef.current += frame.data
            setStreamingText(streamingTextRef.current)
            break

          case 'source':
            sourcesRef.current = [...sourcesRef.current, frame.data]
            setSources(sourcesRef.current)
            break

          case 'done': {
            const convId = frame.data?.conversation_id || null
            setLastConversationId(convId)
            setIsStreaming(false)

            // Notify consumer with the ref-accumulated values (safe from StrictMode)
            if (onMessageCompleteRef.current) {
              onMessageCompleteRef.current(
                streamingTextRef.current,
                sourcesRef.current,
                convId,
                frame.data,
                streamingThinkingRef.current,
              )
            }
            break
          }

          case 'error':
            setError(frame.data?.message || 'An unexpected error occurred')
            setIsStreaming(false)
            break

          default:
            break
        }
      } catch {
        // Malformed frame — ignore silently
      }
    }

    ws.onclose = () => {
      // Only update state and reconnect if this is still the active connection.
      // In StrictMode, the cleanup effect closes the old WS, but its onclose
      // fires asynchronously after a new connection has already been opened.
      if (wsRef.current !== ws) return

      setIsConnected(false)

      // Auto-reconnect with exponential backoff
      if (shouldReconnectRef.current) {
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(2, reconnectAttemptRef.current),
          RECONNECT_MAX_MS,
        )
        reconnectAttemptRef.current += 1

        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }

    ws.onerror = () => {
      // onerror is always followed by onclose, so reconnection is handled there
      if (wsRef.current === ws) {
        setError('Connection error')
      }
    }

    wsRef.current = ws
  }, [])

  /**
   * Disconnect and stop auto-reconnection.
   */
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  /**
   * Send a chat message over the WebSocket.
   *
   * @param {string} message - The user's message text.
   * @param {string|null} [conversationId=null] - Optional existing conversation ID.
   */
  const sendMessage = useCallback((message, conversationId = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to chat server')
      return
    }

    // Reset streaming state for new message
    streamingTextRef.current = ''
    streamingThinkingRef.current = ''
    sourcesRef.current = []
    setStreamingText('')
    setStreamingThinking('')
    setSources([])
    setError(null)
    setIsStreaming(true)

    const payload = { message }
    if (conversationId) {
      payload.conversation_id = conversationId
    }

    wsRef.current.send(JSON.stringify(payload))
  }, [])

  /**
   * Send a stop command to abort the current LLM stream.
   * The backend will break the generation loop and send a done frame.
   */
  const stopStreaming = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!isStreaming) return

    wsRef.current.send(JSON.stringify({ type: 'stop' }))
    setIsStreaming(false)
  }, [isStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    isConnected,
    isStreaming,
    streamingText,
    streamingThinking,
    sources,
    error,
    lastConversationId,
    sendMessage,
    stopStreaming,
    connect,
    disconnect,
    setOnMessageComplete,
  }
}
