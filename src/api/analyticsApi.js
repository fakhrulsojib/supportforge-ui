/**
 * Analytics API client.
 *
 * All requests go through the centralised Axios client (src/api/client.js).
 * Auth tokens are injected automatically by the request interceptor.
 *
 * Backend endpoints:
 * - GET /api/v1/analytics/daily-stats — daily conversation/message counts
 * - GET /api/v1/analytics/top-intents — top topics by frequency
 * - GET /api/v1/analytics/satisfaction — feedback satisfaction rate
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch daily conversation and message statistics.
 *
 * @param {number} [days=30] — Number of days to look back
 * @returns {Promise<{ stats: Array<{ date: string, total_conversations: number, total_messages: number, avg_satisfaction: number|null }> }>}
 */
export async function getDailyStats(days = 30) {
  const response = await client.get(API_ROUTES.ANALYTICS.DAILY_STATS, {
    params: { days },
  })
  return response.data
}

/**
 * Fetch the top intents by frequency.
 *
 * @param {number} [limit=10] — Maximum number of intents to return
 * @returns {Promise<{ intents: Array<{ name: string, count: number }> }>}
 */
export async function getTopIntents(limit = 10) {
  const response = await client.get(API_ROUTES.ANALYTICS.TOP_INTENTS, {
    params: { limit },
  })
  return response.data
}

/**
 * Fetch the satisfaction rate summary.
 *
 * @returns {Promise<{ positive: number, negative: number, total: number, rate: number }>}
 */
export async function getSatisfactionRate() {
  const response = await client.get(API_ROUTES.ANALYTICS.SATISFACTION)
  return response.data
}
