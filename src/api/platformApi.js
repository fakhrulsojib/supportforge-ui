/**
 * Platform Tenant API client — superadmin-only tenant management.
 *
 * All requests go through the centralised Axios client (src/api/client.js).
 * Auth tokens are injected automatically by the request interceptor.
 *
 * Security:
 * - Auth header injected automatically by client interceptor
 * - Superadmin role enforced by backend RBAC
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch paginated list of platform tenants with optional status filter.
 *
 * @param {Object} [params]
 * @param {string|null} [params.status] — Filter: 'active', 'suspended', 'archived', 'pending'
 * @param {number} [params.limit=50] — Page size
 * @param {number} [params.offset=0] — Page offset
 * @returns {Promise<{ tenants: Array, total: number }>}
 */
export async function listTenants(params = {}) {
  const response = await client.get(API_ROUTES.PLATFORM.TENANTS, { params })
  return response.data
}

/**
 * Create a new tenant (superadmin only).
 *
 * @param {Object} data
 * @param {string} data.name — Tenant display name
 * @param {string} data.slug — URL-safe slug (lowercase, hyphens only)
 * @param {Object|null} [data.config_json] — Optional tenant configuration
 * @returns {Promise<{ id: string, name: string, slug: string, status: string, config_json: Object|null, created_at: string }>}
 */
export async function createTenant(data) {
  const response = await client.post(API_ROUTES.PLATFORM.TENANTS, data)
  return response.data
}

/**
 * Update a tenant's lifecycle status (superadmin only).
 *
 * Valid transitions: pending→active, active→suspended/archived,
 * suspended→active/archived. Archived is terminal.
 *
 * @param {string} tenantId — Tenant UUID
 * @param {string} status — New status: 'active', 'suspended', 'archived'
 * @returns {Promise<{ id: string, name: string, slug: string, status: string, config_json: Object|null, created_at: string }>}
 */
export async function updateTenantStatus(tenantId, status) {
  const response = await client.patch(
    `${API_ROUTES.PLATFORM.TENANTS}/${tenantId}/status`,
    { status },
  )
  return response.data
}
