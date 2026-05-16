/**
 * Model management API — calls for listing and switching LLM models.
 *
 * All calls go through the shared Axios client (src/api/client.js)
 * which handles JWT auth, token refresh, and error formatting.
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch all available models grouped by provider.
 * @returns {Promise<{providers: Array, active_model: {provider: string, model_id: string}}>}
 */
export async function listModels() {
  const { data } = await client.get(API_ROUTES.ADMIN.MODELS)
  return data
}

/**
 * Set the active chat model.
 * @param {string} provider - Provider identifier (e.g. 'ollama')
 * @param {string} modelId - Model identifier (e.g. 'gemma3:4b')
 * @returns {Promise<{provider: string, model_id: string, status: string}>}
 */
export async function setActiveModel(provider, modelId) {
  const { data } = await client.put(API_ROUTES.ADMIN.MODELS_ACTIVE, {
    provider,
    model_id: modelId,
  })
  return data
}
