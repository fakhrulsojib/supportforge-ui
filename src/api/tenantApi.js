/**
 * Tenant API — tenant configuration operations.
 *
 * All HTTP calls go through the centralised Axios client.
 *
 * Security:
 * - Auth header injected automatically by client interceptor
 * - Tenant scoping enforced by backend JWT claims
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
