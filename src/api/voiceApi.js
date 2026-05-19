/**
 * Voice API functions.
 *
 * All calls go through the centralised client.
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Get voice configuration for the authenticated tenant.
 *
 * @returns {Promise<{voice_enabled: boolean, stt_provider: string|null, tts_provider: string|null, tts_voice: string, max_voice_sessions: number}>}
 */
export async function getVoiceConfig() {
  const response = await client.get(API_ROUTES.VOICE.CONFIG)
  return response.data
}

/**
 * Get voice service health status.
 *
 * @returns {Promise<{stt_available: boolean, tts_available: boolean, stt_provider: string|null, tts_provider: string|null}>}
 */
export async function getVoiceHealth() {
  const response = await client.get(API_ROUTES.VOICE.HEALTH)
  return response.data
}

/**
 * Get active voice sessions for the tenant (admin only).
 *
 * @returns {Promise<{tenant_id: string, active_sessions: number}>}
 */
export async function getVoiceSessions() {
  const response = await client.get(API_ROUTES.VOICE.SESSIONS)
  return response.data
}
