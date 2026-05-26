/**
 * Settings API — tenant configuration and secret management.
 *
 * All HTTP calls go through the centralised Axios client.
 *
 * Security:
 * - Auth header injected automatically by client interceptor
 * - Tenant scoping enforced by backend JWT claims
 * - Secret values are write-only — cannot be retrieved after creation
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Fetch the current tenant's configuration.
 * @param {string} tenantId - Tenant UUID.
 * @returns {Promise<object>} Tenant data including config_json.
 */
export async function getTenantConfig(tenantId) {
  const response = await client.get(`${API_ROUTES.TENANTS}/${tenantId}`)
  return response.data
}

/**
 * Update the current tenant's configuration.
 * @param {string} tenantId - Tenant UUID.
 * @param {object} configJson - Updated config_json object.
 * @returns {Promise<object>} Updated tenant data.
 */
export async function updateTenantConfig(tenantId, configJson) {
  const response = await client.patch(`${API_ROUTES.TENANTS}/${tenantId}`, {
    config_json: configJson,
  })
  return response.data
}

/**
 * List secret key names for a tenant.
 * @param {string} tenantId - Tenant UUID.
 * @returns {Promise<object>} List of secret key metadata.
 */
export async function listSecrets(tenantId) {
  const response = await client.get(`${API_ROUTES.TENANTS}/${tenantId}/secrets`)
  return response.data
}

/**
 * Create or update a secret for a tenant.
 * @param {string} tenantId - Tenant UUID.
 * @param {string} key - Secret key name.
 * @param {string} value - Secret value (write-only).
 * @returns {Promise<object>} Confirmation.
 */
export async function createSecret(tenantId, key, value) {
  const response = await client.post(`${API_ROUTES.TENANTS}/${tenantId}/secrets`, {
    key,
    value,
  })
  return response.data
}

/**
 * Delete a secret by key name.
 * @param {string} tenantId - Tenant UUID.
 * @param {string} key - Secret key to delete.
 * @returns {Promise<object>} Confirmation.
 */
export async function deleteSecret(tenantId, key) {
  const response = await client.delete(
    `${API_ROUTES.TENANTS}/${tenantId}/secrets/${encodeURIComponent(key)}`,
  )
  return response.data
}

/**
 * Send a test event hook for a tenant.
 * @param {string} tenantId - Tenant UUID.
 * @param {object} payload - Test hook payload (event, url, headers).
 * @returns {Promise<object>} Test result with status and response.
 */
export async function testEventHook(tenantId, payload) {
  const response = await client.post(
    `${API_ROUTES.TENANTS}/${tenantId}/test-hook`,
    payload,
  )
  return response.data
}
