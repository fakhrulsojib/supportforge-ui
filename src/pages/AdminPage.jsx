/**
 * AdminPage — document management panel (Knowledge Base).
 *
 * Composes:
 * - DocumentUploader (drag-and-drop zone)
 * - IngestionStatus (document table with polling)
 *
 * Model configuration has been moved to Settings → LLM Provider tab.
 *
 * Security:
 * - RBAC guard: only admin/agent roles can access (viewer → redirect)
 * - All data scoped to authenticated user's tenant via backend JWT
 * - Delete button restricted to admin role only
 * - No tokens or sensitive data logged to console
 * - Errors displayed inline, no stack traces
 *
 * Polling:
 * - When any document has pending/processing status, polls every 5s
 * - Cleans up interval on unmount
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { listDocuments, deleteDocument } from '../api/ingestApi'
import { extractErrorMessage } from '../api/client'
import DocumentUploader from '../components/admin/DocumentUploader'
import IngestionStatus from '../components/admin/IngestionStatus'
import '../styles/admin.css'

/** Status values that trigger polling. */
const POLLING_STATUSES = ['pending', 'processing']

/** Polling interval in milliseconds. */
const POLL_INTERVAL_MS = 5000

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── RBAC Guard ──────────────────────────────────────────────
  // Viewer role cannot access admin panel
  const userRole = user?.role || ''
  const hasAccess = userRole === 'admin' || userRole === 'agent'

  // ── Data Loading ────────────────────────────────────────────

  /** Fetch the document list from the API. */
  const loadDocuments = useCallback(async () => {
    try {
      const data = await listDocuments()
      const serverDocs = data.documents || []
      // Merge: keep any optimistic placeholders that the server doesn't
      // know about yet (upload committed but list query hasn't caught up).
      setDocuments((prev) => {
        const serverIds = new Set(serverDocs.map((d) => d.id))
        const optimistic = prev.filter(
          (d) => !serverIds.has(d.id) && POLLING_STATUSES.includes(d.status),
        )
        return [...optimistic, ...serverDocs]
      })
      setError(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** Check if any documents need status polling. */
  const needsPolling = documents.some((doc) =>
    POLLING_STATUSES.includes(doc.status),
  )

  /** Start or stop polling based on document statuses. */
  useEffect(() => {
    if (!hasAccess) return
    if (!needsPolling) return

    // Poll immediately once, then every POLL_INTERVAL_MS
    const timer = setInterval(() => {
      loadDocuments()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [needsPolling, loadDocuments, hasAccess])

  /** Initial load on mount. */
  useEffect(() => {
    if (hasAccess) {
      loadDocuments()
    }
  }, [hasAccess, loadDocuments])

  // ── Event Handlers ──────────────────────────────────────────

  /** Handle successful upload — optimistically add to list. */
  const handleUploadSuccess = useCallback((result) => {
    // Build a placeholder document from the upload response so it
    // appears in the Knowledge Base table immediately with "pending" status.
    // The polling loop (every 5s for pending/processing) will kick in
    // automatically and replace it with the full server record.
    const ext = (result.filename || '').split('.').pop()?.toLowerCase() || ''
    const placeholder = {
      id: result.document_id,
      filename: result.filename,
      file_type: ext,
      chunk_count: 0,
      status: result.status || 'pending',
      created_at: new Date().toISOString(),
    }
    setDocuments((prev) => [placeholder, ...prev])
  }, [])

  /** Handle document deletion. */
  const handleDelete = useCallback(
    async (documentId) => {
      try {
        await deleteDocument(documentId)
        // Remove from local state immediately for responsive UX
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } catch (err) {
        setError(extractErrorMessage(err))
      }
    },
    [],
  )

  /** Handle manual refresh. */
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    loadDocuments()
  }, [loadDocuments])

  // ── Access Denied View ──────────────────────────────────────

  if (!hasAccess) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <svg className="admin-access-denied-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
            <path d="M22 22l20 20M42 22L22 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h2 className="admin-access-denied-title">Access Restricted</h2>
          <p className="admin-access-denied-text">
            The Admin Panel is available to administrators and agents only.
          </p>
          <button
            type="button"
            className="sf-btn sf-btn-primary"
            onClick={() => navigate('/')}
            id="admin-back-to-chat"
          >
            Back to Chat
          </button>
        </div>
      </div>
    )
  }

  // ── Main Admin View ─────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">Knowledge Base</h1>
          <p className="admin-subtitle">
            Upload, monitor, and manage your knowledge base documents
          </p>
        </div>
        <button
          type="button"
          className="sf-btn sf-btn-secondary admin-refresh-btn"
          onClick={handleRefresh}
          disabled={isLoading}
          id="admin-refresh-btn"
          aria-label="Refresh document list"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.353v4.992"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </button>
      </header>

      {/* Error Bar */}
      {error && (
        <div className="admin-error-bar" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Document Upload */}
      <section className="admin-section" aria-labelledby="admin-upload-heading">
        <h2 className="admin-section-title" id="admin-upload-heading">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 12V3m0 0L5.5 6.5M9 3l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 11v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Upload Document
        </h2>
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />
      </section>

      {/* Documents Table */}
      <section className="admin-section" aria-labelledby="admin-docs-heading">
        <h2 className="admin-section-title" id="admin-docs-heading">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7 6h4M7 9h3M7 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Knowledge Base
          {documents.length > 0 && (
            <span className="sf-badge sf-badge-neutral admin-doc-count-badge">
              {documents.length}
            </span>
          )}
        </h2>
        <IngestionStatus
          documents={documents}
          onDelete={handleDelete}
          isLoading={isLoading}
          userRole={userRole}
        />
      </section>
    </div>
  )
}
