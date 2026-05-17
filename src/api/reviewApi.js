/**
 * Review Queue API client.
 *
 * All requests go through the centralised Axios client (src/api/client.js).
 * Auth tokens are injected automatically by the request interceptor.
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch paginated list of messages with negative feedback.
 *
 * @param {Object} [params]
 * @param {boolean|null} [params.reviewed] — Filter: true=reviewed, false=unreviewed, null=all
 * @param {string|null} [params.start_date] — ISO date lower bound
 * @param {string|null} [params.end_date] — ISO date upper bound
 * @param {number} [params.limit=50] — Page size
 * @param {number} [params.offset=0] — Page offset
 * @returns {Promise<{ items: Array, total: number, limit: number, offset: number }>}
 */
export async function getNegativeFeedback(params = {}) {
  const response = await client.get(API_ROUTES.ADMIN.NEGATIVE_FEEDBACK, { params })
  return response.data
}

/**
 * Fetch paginated list of escalated conversations.
 *
 * @param {Object} [params]
 * @param {string|null} [params.trigger] — Filter by escalation trigger type
 * @param {boolean|null} [params.reviewed] — Filter: true=reviewed, false=unreviewed, null=all
 * @param {string|null} [params.start_date] — ISO date lower bound
 * @param {string|null} [params.end_date] — ISO date upper bound
 * @param {number} [params.limit=50] — Page size
 * @param {number} [params.offset=0] — Page offset
 * @returns {Promise<{ items: Array, total: number, limit: number, offset: number }>}
 */
export async function getEscalations(params = {}) {
  const response = await client.get(API_ROUTES.ADMIN.ESCALATIONS, { params })
  return response.data
}

/**
 * Fetch paginated list of flagged messages (output validation failures).
 *
 * @param {Object} [params]
 * @param {boolean|null} [params.reviewed] — Filter: true=reviewed, false=unreviewed, null=all
 * @param {string|null} [params.start_date] — ISO date lower bound
 * @param {string|null} [params.end_date] — ISO date upper bound
 * @param {number} [params.limit=50] — Page size
 * @param {number} [params.offset=0] — Page offset
 * @returns {Promise<{ items: Array, total: number, limit: number, offset: number }>}
 */
export async function getFlaggedMessages(params = {}) {
  const response = await client.get(API_ROUTES.ADMIN.FLAGGED, { params })
  return response.data
}

/**
 * Mark a message as reviewed by the current admin.
 *
 * @param {string} messageId — Message UUID to mark as reviewed
 * @returns {Promise<{ message_id: string, reviewed_at: string, reviewed_by: string }>}
 */
export async function markReviewed(messageId) {
  const response = await client.patch(
    `${API_ROUTES.ADMIN.FEEDBACK_BASE}/${messageId}/review`,
  )
  return response.data
}

/**
 * Mark an escalated conversation as reviewed by the current admin.
 *
 * @param {string} conversationId — Conversation UUID to mark as reviewed
 * @returns {Promise<{ conversation_id: string, reviewed_at: string, reviewed_by: string }>}
 */
export async function markEscalationReviewed(conversationId) {
  const response = await client.patch(
    `${API_ROUTES.ADMIN.ESCALATIONS}/${conversationId}/review`,
  )
  return response.data
}

/**
 * Fetch aggregate review queue counts for badge display.
 *
 * @returns {Promise<{ unreviewed_negative: number, unreviewed_flagged: number, open_escalations: number }>}
 */
export async function getReviewStats() {
  const response = await client.get(API_ROUTES.ADMIN.STATS)
  return response.data
}
