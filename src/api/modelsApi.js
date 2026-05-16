/**
 * Model management API — calls for listing and switching LLM models.
 *
 * All calls go through the shared Axios client (src/api/client.js)
 * which handles JWT auth, token refresh, and error formatting.
 *
 * Supports multiple providers: Ollama (self-hosted) and Google Gemini (cloud).
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch all available models grouped by provider.
 * @returns {Promise<{providers: Array, active_model: {provider: string, model_id: string, has_api_key: boolean, api_key_preview: string}}>}
 */
export async function listModels() {
  const { data } = await client.get(API_ROUTES.ADMIN.MODELS)
  return data
}

/**
 * Set the active model for a given type (chat or embedding).
 * @param {string} provider - Provider identifier (e.g. 'ollama', 'gemini')
 * @param {string} modelId - Model identifier (e.g. 'gemma3:4b', 'gemini-2.5-flash')
 * @param {'chat'|'embedding'} [modelType='chat'] - Type of model to set
 * @param {string|null} [apiKey=null] - API key for cloud providers (Gemini)
 * @returns {Promise<{provider: string, model_id: string, model_type: string, status: string}>}
 */
export async function setActiveModel(provider, modelId, modelType = 'chat', apiKey = null) {
  const payload = {
    provider,
    model_id: modelId,
    model_type: modelType,
  }
  // Only include api_key when provided (Gemini provider)
  if (apiKey) {
    payload.api_key = apiKey
  }
  const { data } = await client.put(API_ROUTES.ADMIN.MODELS_ACTIVE, payload)
  return data
}
