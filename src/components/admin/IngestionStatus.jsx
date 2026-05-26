/**
 * IngestionStatus — document table with status badges and delete functionality.
 *
 * Features:
 * - Responsive table → card layout on mobile
 * - Status badges: pending (warning), processing (info+pulse), ready (success), failed (error)
 * - Delete button: admin only, inline confirmation prompt
 * - Loading skeleton, empty state
 *
 * Security:
 * - Delete button only visible to admin role
 * - No sensitive data displayed (no tenant_id, uploaded_by shown as-is)
 */

import { useState, useCallback } from 'react'
import { formatDate } from '../../utils/formatters'

/** Map document status to badge CSS class. */
const STATUS_BADGE_MAP = {
  pending: 'sf-badge sf-badge-warning',
  processing: 'sf-badge sf-badge-info admin-doc-status-processing',
  ready: 'sf-badge sf-badge-success',
  failed: 'sf-badge sf-badge-error',
}

/** Map file type to icon CSS class. */
const FILE_ICON_MAP = {
  pdf: 'admin-doc-file-icon admin-doc-file-icon-pdf',
  md: 'admin-doc-file-icon admin-doc-file-icon-md',
  csv: 'admin-doc-file-icon admin-doc-file-icon-csv',
  txt: 'admin-doc-file-icon admin-doc-file-icon-txt',
}

/** Format status for display. */
function formatStatus(status) {
  if (status === 'ready') return 'Ready'
  if (status === 'processing') return 'Processing'
  if (status === 'pending') return 'Pending'
  if (status === 'failed') return 'Failed'
  return status
}

/**
 * @param {{
 *   documents: Array<{id: string, filename: string, file_type: string, chunk_count: number, status: string, created_at: string}>,
 *   onDelete: (documentId: string) => void,
 *   onRetry: (documentId: string) => void,
 *   isLoading: boolean,
 *   userRole: string
 * }} props
 */
export default function IngestionStatus({ documents, onDelete, onRetry, isLoading, userRole }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [retryingId, setRetryingId] = useState(null)

  const handleRetryClick = useCallback(
    async (docId) => {
      setRetryingId(docId)
      try {
        await onRetry(docId)
      } finally {
        setRetryingId(null)
      }
    },
    [onRetry],
  )

  const handleDeleteClick = useCallback((docId) => {
    setConfirmDeleteId(docId)
  }, [])

  const handleConfirmDelete = useCallback(
    async (docId) => {
      setDeletingId(docId)
      try {
        await onDelete(docId)
      } finally {
        setDeletingId(null)
        setConfirmDeleteId(null)
      }
    },
    [onDelete],
  )

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null)
  }, [])

  const isAdmin = userRole === 'admin'

  // Loading skeleton
  if (isLoading && documents.length === 0) {
    return (
      <div className="admin-doc-table-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
            <div className="admin-skeleton-block admin-skeleton-medium" />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!isLoading && documents.length === 0) {
    return (
      <div className="admin-empty-state">
        <svg className="admin-empty-icon" viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true">
          <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <path d="M24 22h16M24 32h12M24 42h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h3 className="admin-empty-title">No documents yet</h3>
        <p className="admin-empty-text">
          Upload your first document above to start building your knowledge base.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-doc-table-wrap sf-scrollbar-thin">
      <table className="admin-doc-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Type</th>
            <th>Chunks</th>
            <th>Status</th>
            <th>Uploaded</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const fileType = (doc.file_type || '').toLowerCase()
            const iconClass = FILE_ICON_MAP[fileType] || FILE_ICON_MAP.txt
            const badgeClass = STATUS_BADGE_MAP[doc.status] || STATUS_BADGE_MAP.pending
            const isDeleting = deletingId === doc.id
            const isConfirming = confirmDeleteId === doc.id

            return (
              <tr key={doc.id}>
                <td data-label="File">
                  <div className="admin-doc-file">
                    <div className={iconClass}>
                      {fileType.toUpperCase()}
                    </div>
                    <span className="admin-doc-filename" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </div>
                </td>
                <td data-label="Type">
                  <span className="admin-upload-format-tag">.{fileType}</span>
                </td>
                <td data-label="Chunks">{doc.chunk_count}</td>
                <td data-label="Status">
                  <span className={badgeClass}>
                    {formatStatus(doc.status)}
                  </span>
                </td>
                <td data-label="Uploaded">
                  {doc.created_at ? formatDate(doc.created_at) : '—'}
                </td>
                {isAdmin && (
                  <td data-label="Actions">
                    <div className="admin-doc-actions">
                      {doc.status === 'failed' && !isConfirming && (
                        <button
                          type="button"
                          className={`sf-btn sf-btn-ghost sf-btn-sm admin-retry-btn${retryingId === doc.id ? ' admin-retry-spinning' : ''}`}
                          onClick={() => handleRetryClick(doc.id)}
                          disabled={retryingId === doc.id}
                          aria-label={`Retry ingestion for ${doc.filename}`}
                          title="Retry ingestion"
                          id={`admin-retry-${doc.id}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M13.5 8a5.5 5.5 0 11-1.3-3.56" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.5 3v1.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {!isConfirming && (
                        <button
                          type="button"
                          className="sf-btn sf-btn-ghost sf-btn-sm"
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={isDeleting}
                          aria-label={`Delete ${doc.filename}`}
                          id={`admin-delete-${doc.id}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {isConfirming && (
                        <div className="admin-delete-confirm">
                          <span className="admin-delete-confirm-text">Delete?</span>
                          <button
                            type="button"
                            className="sf-btn sf-btn-danger sf-btn-sm"
                            onClick={() => handleConfirmDelete(doc.id)}
                            disabled={isDeleting}
                            id={`admin-confirm-delete-${doc.id}`}
                          >
                            {isDeleting ? '…' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            className="sf-btn sf-btn-ghost sf-btn-sm"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                            id={`admin-cancel-delete-${doc.id}`}
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
