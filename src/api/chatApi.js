/**
 * Chat & Conversation API functions.
 *
 * All calls go through the centralised client.
 * Request/response shapes match the backend's conversation schemas exactly.
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * List conversations for the authenticated user's tenant.
 *
 * @param {number} [limit=50] - Page size (max 100).
 * @param {number} [offset=0] - Page offset.
 * @returns {Promise<{conversations: Array, total: number, limit: number, offset: number}>}
 */
export async function listConversations(limit = 50, offset = 0) {
  const response = await client.get(API_ROUTES.CONVERSATIONS, {
    params: { limit, offset },
  })
  return response.data
}

/**
 * Get a full conversation with all messages.
 *
 * @param {string} conversationId - Conversation UUID.
 * @returns {Promise<{id: string, tenant_id: string, status: string, messages: Array, started_at: string}>}
 */
export async function getConversation(conversationId) {
  const response = await client.get(`${API_ROUTES.CONVERSATIONS}/${conversationId}`)
  return response.data
}

/**
 * Update feedback on a specific message.
 *
 * @param {string} messageId - Message UUID.
 * @param {'positive'|'negative'} feedback - Feedback type.
 * @returns {Promise<object>} Updated message.
 */
export async function updateMessageFeedback(messageId, feedback) {
  const response = await client.patch(
    `${API_ROUTES.CONVERSATIONS}/messages/${messageId}/feedback`,
    { feedback },
  )
  return response.data
}
