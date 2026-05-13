/**
 * PlatformTenantsPage — Superadmin-only tenant provisioning and lifecycle management.
 *
 * Features:
 * - Paginated tenant table with status badges and contextual actions
 * - Create Tenant modal with name, slug, and optional config_json
 * - Status transitions with confirmation dialogs for destructive actions
 * - Status filter dropdown
 *
 * Security:
 * - Role guard: only superadmin users can view this page
 * - No tokens or sensitive data rendered or logged
 * - Tenant data is read-only display from API responses
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { listTenants, createTenant, updateTenantStatus } from '../api/platformApi'
import { extractErrorMessage } from '../api/client'
import '../styles/platform.css'
import '../styles/admin.css'

const PAGE_SIZE = 20

/**
 * Format a UTC date string to a human-readable local date/time.
 * @param {string|null} iso — ISO date string
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a status string for display with proper casing.
 * @param {string} status
 * @returns {string}
 */
function formatStatus(status) {
  if (!status) return '—'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function PlatformTenantsPage() {
  const { user } = useAuth()
  const isSuperadmin = user?.role === 'superadmin'

  // ── Data State ──────────────────────────────────────────────
  const [tenants, setTenants] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // ── Create Modal State ──────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createConfig, setCreateConfig] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // ── Confirm Dialog State ────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirming, setConfirming] = useState(false)

  // ── Transition in-progress tracking ─────────────────────────
  const [transitioningIds, setTransitioningIds] = useState(new Set())

  // ── Fetch Tenants ───────────────────────────────────────────

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: PAGE_SIZE, offset }
      if (statusFilter !== 'all') params.status = statusFilter
      const data = await listTenants(params)
      setTenants(data.tenants || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(extractErrorMessage(err))
      setTenants([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [offset, statusFilter])

  useEffect(() => {
    if (isSuperadmin) fetchTenants()
  }, [isSuperadmin, fetchTenants])

  // Reset offset when filter changes
  useEffect(() => {
    setOffset(0)
  }, [statusFilter])

  // ── Create Tenant ───────────────────────────────────────────

  function openCreateModal() {
    setCreateName('')
    setCreateSlug('')
    setCreateConfig('')
    setCreateError('')
    setShowCreateModal(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!createName.trim() || !createSlug.trim()) {
      setCreateError('Name and slug are required')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      let configJson = null
      if (createConfig.trim()) {
        configJson = JSON.parse(createConfig)
      }
      await createTenant({
        name: createName.trim(),
        slug: createSlug.trim(),
        config_json: configJson,
      })
      setShowCreateModal(false)
      await fetchTenants()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setCreateError('Invalid JSON in configuration field')
      } else {
        setCreateError(extractErrorMessage(err))
      }
    } finally {
      setCreating(false)
    }
  }

  // ── Status Transitions ──────────────────────────────────────

  function requestStatusChange(tenantId, tenantName, newStatus) {
    if (newStatus === 'suspended' || newStatus === 'archived') {
      setConfirmAction({ tenantId, tenantName, newStatus })
    } else {
      executeStatusChange(tenantId, newStatus)
    }
  }

  async function executeStatusChange(tenantId, newStatus) {
    setTransitioningIds((prev) => new Set(prev).add(tenantId))
    setConfirmAction(null)
    try {
      await updateTenantStatus(tenantId, newStatus)
      await fetchTenants()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setTransitioningIds((prev) => {
        const next = new Set(prev)
        next.delete(tenantId)
        return next
      })
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return
    setConfirming(true)
    try {
      await executeStatusChange(confirmAction.tenantId, confirmAction.newStatus)
    } finally {
      setConfirming(false)
    }
  }

  // ── Pagination ──────────────────────────────────────────────

  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const pageStart = total > 0 ? offset + 1 : 0
  const pageEnd = Math.min(offset + PAGE_SIZE, total)

  // ── Access Denied ───────────────────────────────────────────

  if (!isSuperadmin) {
    return (
      <div className="admin-page" id="platform-page">
        <div className="admin-access-denied">
          <svg className="admin-access-denied-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h2 className="admin-access-denied-title">Access Denied</h2>
          <p className="admin-access-denied-text">
            Platform management is only available to superadministrators.
          </p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <>
    <div className="admin-page" id="platform-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-title">Platform Tenants</h1>
          <p className="admin-subtitle">
            Manage tenant provisioning, status transitions, and configurations
          </p>
        </div>
        <div className="platform-header-actions">
          <button
            type="button"
            className="sf-btn sf-btn-primary"
            onClick={openCreateModal}
            id="platform-create-btn"
          >
            + Create Tenant
          </button>
          <button
            type="button"
            className="sf-btn sf-btn-secondary admin-refresh-btn"
            onClick={fetchTenants}
            disabled={loading}
            id="platform-refresh-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8a6 6 0 0 1 10-4.47" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 8a6 6 0 0 1-10 4.47" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M14 14v-4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Bar */}
      {error && (
        <div className="admin-error-bar" role="alert" id="platform-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="platform-filters">
        <div className="review-filter-group">
          <span className="review-filter-label">Status</span>
          <select
            className="review-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="platform-filter-status"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="admin-empty-state" id="platform-loading">
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton-block admin-skeleton-icon" />
            <div className="admin-skeleton-block admin-skeleton-wide" />
            <div className="admin-skeleton-block admin-skeleton-narrow" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && tenants.length === 0 && !error && (
        <div className="admin-empty-state" id="platform-empty">
          <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10v10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h3 className="admin-empty-title">No tenants found</h3>
          <p className="admin-empty-text">
            {statusFilter !== 'all'
              ? `No tenants with status "${statusFilter}". Try a different filter.`
              : 'Create your first tenant to get started.'}
          </p>
        </div>
      )}

      {/* Tenant Table */}
      {!loading && tenants.length > 0 && (
        <>
          <div className="platform-table-wrap">
            <table className="platform-table" id="platform-table">
              <thead>
                <tr>
                  <th>Tenant ID</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td data-label="Tenant ID">
                      <span className="platform-slug">{tenant.id}</span>
                    </td>
                    <td data-label="Name">
                      <span className="platform-tenant-name">{tenant.name}</span>
                    </td>
                    <td data-label="Slug">
                      <span className="platform-slug">{tenant.slug}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`platform-status platform-status-${tenant.status}`}>
                        {formatStatus(tenant.status)}
                      </span>
                    </td>
                    <td data-label="Created">
                      <span className="review-cell-time">{formatDate(tenant.created_at)}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="platform-actions">
                        {tenant.status === 'pending' && (
                          <button
                            type="button"
                            className="platform-action-btn platform-action-activate"
                            onClick={() => requestStatusChange(tenant.id, tenant.name, 'active')}
                            disabled={transitioningIds.has(tenant.id)}
                            id={`platform-activate-${tenant.id}`}
                          >
                            {transitioningIds.has(tenant.id) ? '…' : '✓ Activate'}
                          </button>
                        )}
                        {tenant.status === 'active' && (
                          <>
                            <button
                              type="button"
                              className="platform-action-btn platform-action-suspend"
                              onClick={() => requestStatusChange(tenant.id, tenant.name, 'suspended')}
                              disabled={transitioningIds.has(tenant.id)}
                              id={`platform-suspend-${tenant.id}`}
                            >
                              {transitioningIds.has(tenant.id) ? '…' : '⏸ Suspend'}
                            </button>
                            <button
                              type="button"
                              className="platform-action-btn platform-action-archive"
                              onClick={() => requestStatusChange(tenant.id, tenant.name, 'archived')}
                              disabled={transitioningIds.has(tenant.id)}
                              id={`platform-archive-${tenant.id}`}
                            >
                              {transitioningIds.has(tenant.id) ? '…' : '📦 Archive'}
                            </button>
                          </>
                        )}
                        {tenant.status === 'suspended' && (
                          <>
                            <button
                              type="button"
                              className="platform-action-btn platform-action-activate"
                              onClick={() => requestStatusChange(tenant.id, tenant.name, 'active')}
                              disabled={transitioningIds.has(tenant.id)}
                              id={`platform-reactivate-${tenant.id}`}
                            >
                              {transitioningIds.has(tenant.id) ? '…' : '✓ Activate'}
                            </button>
                            <button
                              type="button"
                              className="platform-action-btn platform-action-archive"
                              onClick={() => requestStatusChange(tenant.id, tenant.name, 'archived')}
                              disabled={transitioningIds.has(tenant.id)}
                              id={`platform-archive-s-${tenant.id}`}
                            >
                              {transitioningIds.has(tenant.id) ? '…' : '📦 Archive'}
                            </button>
                          </>
                        )}
                        {tenant.status === 'archived' && (
                          <span className="review-cell-time">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="review-pagination">
            <span className="review-pagination-info">
              Showing {pageStart}–{pageEnd} of {total}
            </span>
            <div className="review-pagination-controls">
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canPrev}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                id="platform-page-prev"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="review-pagination-btn"
                disabled={!canNext}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                id="platform-page-next"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Create Tenant Modal — rendered outside page container for correct viewport centering */}
    {showCreateModal && (
      <>
        <div
          className="platform-modal-overlay"
          onClick={() => setShowCreateModal(false)}
          role="presentation"
        />
        <div className="platform-modal" role="dialog" aria-labelledby="platform-modal-title" id="platform-create-modal">
          <h3 className="platform-modal-title" id="platform-modal-title">Create New Tenant</h3>
          <form onSubmit={handleCreate}>
            <div className="platform-modal-field">
              <label className="platform-modal-label" htmlFor="platform-create-name">
                Tenant Name
              </label>
              <input
                type="text"
                className="sf-input"
                id="platform-create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. NovaMart"
                required
                maxLength={255}
                autoFocus
              />
            </div>
            <div className="platform-modal-field">
              <label className="platform-modal-label" htmlFor="platform-create-slug">
                Slug
              </label>
              <input
                type="text"
                className="sf-input"
                id="platform-create-slug"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                placeholder="e.g. novamart"
                required
                pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                title="Lowercase letters, numbers, and hyphens only"
                minLength={2}
                maxLength={63}
              />
              <span className="platform-modal-hint">
                Lowercase letters, numbers, and hyphens only
              </span>
            </div>
            <div className="platform-modal-field">
              <label className="platform-modal-label" htmlFor="platform-create-config">
                Configuration (JSON, optional)
              </label>
              <textarea
                className="platform-modal-textarea"
                id="platform-create-config"
                value={createConfig}
                onChange={(e) => setCreateConfig(e.target.value)}
                placeholder='{"key": "value"}'
                rows={3}
              />
            </div>
            {createError && (
              <div className="platform-modal-error" role="alert">
                {createError}
              </div>
            )}
            <div className="platform-modal-actions">
              <button
                type="button"
                className="sf-btn sf-btn-secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sf-btn sf-btn-primary"
                disabled={creating || !createName.trim() || !createSlug.trim()}
                id="platform-create-submit"
              >
                {creating ? 'Creating…' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </>
    )}

    {/* Confirmation Dialog */}
    {confirmAction && (
      <>
        <div
          className="platform-modal-overlay"
          onClick={() => setConfirmAction(null)}
          role="presentation"
        />
        <div className="platform-confirm" role="alertdialog" aria-labelledby="platform-confirm-title" id="platform-confirm-dialog">
          <svg className="platform-confirm-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="platform-confirm-title" id="platform-confirm-title">
            {confirmAction.newStatus === 'suspended' ? 'Suspend Tenant?' : 'Archive Tenant?'}
          </h3>
          <p className="platform-confirm-text">
            {confirmAction.newStatus === 'suspended'
              ? `Suspending "${confirmAction.tenantName}" will prevent all users from accessing the platform. This can be reversed later.`
              : `Archiving "${confirmAction.tenantName}" is permanent and cannot be undone. All users will lose access.`}
          </p>
          <div className="platform-confirm-actions">
            <button
              type="button"
              className="sf-btn sf-btn-secondary"
              onClick={() => setConfirmAction(null)}
              disabled={confirming}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`sf-btn ${confirmAction.newStatus === 'archived' ? 'sf-btn-danger' : 'sf-btn-primary'}`}
              onClick={handleConfirm}
              disabled={confirming}
              id="platform-confirm-submit"
            >
              {confirming
                ? 'Processing…'
                : confirmAction.newStatus === 'suspended'
                  ? 'Suspend'
                  : 'Archive'}
            </button>
          </div>
        </div>
      </>
    )}
  </>
  )
}

