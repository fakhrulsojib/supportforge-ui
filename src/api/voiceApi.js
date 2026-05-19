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

/**
 * Toggle voice enabled/disabled for the tenant (admin only).
 *
 * @returns {Promise<{voice_enabled: boolean, stt_provider: string|null, tts_provider: string|null, tts_voice: string, max_voice_sessions: number}>}
 */
export async function toggleVoice() {
  const response = await client.put(API_ROUTES.VOICE.TOGGLE)
  return response.data
}

/**
 * Send an audio blob to the backend for STT transcription.
 *
 * @param {Blob} audioBlob - The recorded audio blob (webm, wav, etc).
 * @returns {Promise<{text: string, language?: string, error?: string}>}
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  const response = await client.post(API_ROUTES.VOICE.TRANSCRIBE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Synthesize text to speech audio.
 *
 * Uses the centralised client for auth token injection and auto-refresh.
 *
 * @param {string} text - Text to synthesize to speech.
 * @returns {Promise<Blob>} WAV audio blob.
 */
export async function synthesizeAudio(text) {
  const response = await client.post(
    API_ROUTES.VOICE.SYNTHESIZE,
    { text },
    { responseType: 'blob' },
  )
  return response.data
}
