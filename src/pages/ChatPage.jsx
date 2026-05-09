/**
 * ChatPage — full chat interface with conversation sidebar and streaming chat.
 *
 * Composes:
 * - Conversation sidebar (list past conversations, start new chats)
 * - ChatWindow (messages + input)
 * - useWebSocket hook (real-time streaming)
 *
 * Security:
 * - All data scoped to authenticated user's tenant via backend JWT
 * - No tokens logged or exposed in the UI
 * - Errors displayed inline, no stack traces
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWebSocket } from '../hooks/useWebSocket'
import { listConversations, getConversation } from '../api/chatApi'
import { extractErrorMessage } from '../api/client'
import { formatRelativeTime } from '../utils/formatters'
import ChatWindow from '../components/chat/ChatWindow'
import '../styles/chat.css'

export default function ChatPage() {
  const { user } = useAuth()

  // WebSocket
  const {
    isConnected,
    isStreaming,
    streamingText,
    streamingThinking,
    sources: streamingSources,
    error: wsError,
    lastConversationId,
    sendMessage: wsSendMessage,
    connect,
    disconnect,
    setOnMessageComplete,
  } = useWebSocket()

  // Conversation state
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarLoading, setSidebarLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Track conversation ID for sending messages
  const conversationIdRef = useRef(null)

  /** Connect WebSocket on mount */
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  /** Load conversation list on mount */
  useEffect(() => {
    loadConversations()
  }, [])


  /** Register the message-complete callback */
  useEffect(() => {
    setOnMessageComplete((text, msgSources, convId, doneData, thinkingText) => {
      // Update conversation ID for subsequent messages
      if (convId) {
        conversationIdRef.current = convId
        setActiveConversationId(convId)
      }

      // Add completed assistant message to message list
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: text,
          thinking: thinkingText || '',
          sources_json: msgSources,
          feedback: 'none',
          created_at: new Date().toISOString(),
        },
      ])

      // Refresh sidebar to include new conversation
      loadConversations()
    })
  }, [setOnMessageComplete])

  /** Load the conversation list from the API */
  async function loadConversations() {
    setSidebarLoading(true)
    try {
      const data = await listConversations(50, 0)
      setConversations(data.conversations || [])
    } catch (err) {
      setLoadError(extractErrorMessage(err))
    } finally {
      setSidebarLoading(false)
    }
  }

  /** Load a specific conversation's messages */
  const loadConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId)
    conversationIdRef.current = conversationId
    setIsSidebarOpen(false)
    setLoadError(null)

    try {
      const data = await getConversation(conversationId)
      setMessages(data.messages || [])
    } catch (err) {
      setLoadError(extractErrorMessage(err))
      setMessages([])
    }
  }, [])

  /** Auto-load conversation from URL ?conversation=<id> (e.g. from Review Queue) */
  const [searchParams] = useSearchParams()
  const urlConversationId = searchParams.get('conversation')
  const urlLoadedRef = useRef(false)
  useEffect(() => {
    if (urlConversationId && !urlLoadedRef.current) {
      urlLoadedRef.current = true
      loadConversation(urlConversationId)
    }
  }, [urlConversationId, loadConversation])

  /** Start a new conversation */
  function handleNewChat() {
    setActiveConversationId(null)
    conversationIdRef.current = null
    setMessages([])
    setIsSidebarOpen(false)
  }

  /** Send a user message */
  function handleSendMessage(text) {
    // Add user message to the local state immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      },
    ])

    // Send via WebSocket
    wsSendMessage(text, conversationIdRef.current)
  }

  // Update conversation ID when WebSocket reports a new one
  useEffect(() => {
    if (lastConversationId && !conversationIdRef.current) {
      conversationIdRef.current = lastConversationId
      setActiveConversationId(lastConversationId)
    }
  }, [lastConversationId])

  return (
    <div className="chat-page">
      {/* Mobile sidebar overlay */}
      <div
        className={`chat-sidebar-overlay ${isSidebarOpen ? 'chat-sidebar-overlay-visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        role="presentation"
      />

      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className="chat-sidebar-toggle"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        id="chat-sidebar-toggle"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Conversation Sidebar */}
      <aside
        className={`chat-sidebar ${isSidebarOpen ? 'chat-sidebar-open' : ''}`}
        aria-label="Conversations"
      >
        <div className="chat-sidebar-header">
          <span className="chat-sidebar-title">Conversations</span>
          <button
            type="button"
            className="sf-btn sf-btn-primary chat-new-btn"
            onClick={handleNewChat}
            id="chat-new-conversation"
          >
            + New
          </button>
        </div>

        <div className="chat-sidebar-list sf-scrollbar-thin">
          {sidebarLoading && conversations.length === 0 && (
            <div className="chat-sidebar-empty">
              <span className="sf-animate-pulse">Loading…</span>
            </div>
          )}

          {!sidebarLoading && conversations.length === 0 && (
            <div className="chat-sidebar-empty">
              <p>No conversations yet.</p>
              <p>Start chatting to create one!</p>
            </div>
          )}

          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              className={`chat-sidebar-item ${activeConversationId === conv.id ? 'chat-sidebar-item-active' : ''}`}
              onClick={() => loadConversation(conv.id)}
              aria-current={activeConversationId === conv.id ? 'true' : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="chat-sidebar-item-icon">
                <path d="M3 4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H8l-3 3v-3H5c-1.1 0-2-.9-2-2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="chat-sidebar-item-text sf-truncate">
                {conv.title || (conv.status === 'active' ? 'New conversation' : conv.status === 'resolved' ? 'Resolved' : 'Escalated')}
              </span>
              {conv.started_at && (
                <span className="chat-sidebar-item-time">
                  {formatRelativeTime(conv.started_at)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User info */}
        {user && (
          <div className="chat-sidebar-footer">
            <span className="chat-sidebar-role">
              {user.role}
            </span>
            <span className="sf-badge sf-badge-info chat-sidebar-status">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        )}
      </aside>

      {/* Chat Main Area */}
      <main className="chat-main">
        {loadError && (
          <div className="chat-error-bar sf-animate-fade-in" role="alert">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
            <span>{loadError}</span>
          </div>
        )}
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          streamingText={streamingText}
          streamingThinking={streamingThinking}
          streamingSources={streamingSources}
          isConnected={isConnected}
          error={wsError}
        />
      </main>
    </div>
  )
}
