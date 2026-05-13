/**
 * Failed Query API client — admin-only knowledge gap review.
 *
 * All requests go through the centralised Axios client (src/api/client.js).
 * Auth tokens are injected automatically by the request interceptor.
 *
 * Security:
 * - Auth header injected automatically by client interceptor
 * - Admin role enforced by backend RBAC
 * - Tenant isolation enforced by the API layer
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch paginated list of failed queries for the admin's tenant.
 *
 * @param {Object} [params]
 * @param {string|null} [params.failure_reason] — Filter: 'no_docs', 'low_relevance', 'llm_error', 'timeout'
 * @param {boolean|null} [params.resolved] — Filter: true=resolved, false=unresolved, null=all
 * @param {string|null} [params.start_date] — ISO date lower bound
 * @param {string|null} [params.end_date] — ISO date upper bound
 * @param {number} [params.limit=50] — Page size
 * @param {number} [params.offset=0] — Page offset
 * @returns {Promise<{ items: Array, total: number, limit: number, offset: number }>}
 */
export async function getFailedQueries(params = {}) {
  const response = await client.get(API_ROUTES.FAILED_QUERIES.LIST, { params })
  return response.data
}

/**
 * Mark a failed query as resolved by the current admin.
 *
 * Sets resolved_at to current UTC time and resolved_by to the admin's user ID.
 *
 * @param {string} queryId — Failed query UUID to resolve
 * @returns {Promise<{ id: string, resolved_at: string, resolved_by: string }>}
 */
export async function resolveFailedQuery(queryId) {
  const response = await client.patch(
    `${API_ROUTES.FAILED_QUERIES.LIST}/${queryId}/resolve`,
  )
  return response.data
}

/**
 * Fetch aggregated failed query statistics for badge display and summary cards.
 *
 * @returns {Promise<{ total_unresolved: number, reason_breakdown: Object, top_queries: Array, daily_trend: Array }>}
 */
export async function getFailedQueryStats() {
  const response = await client.get(API_ROUTES.FAILED_QUERIES.STATS)
  return response.data
}
