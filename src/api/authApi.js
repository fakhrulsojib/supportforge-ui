/**
 * Authentication API functions.
 *
 * All calls go through the centralised client.
 * Request/response shapes match the backend's auth schemas exactly.
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Log in an existing user.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} tenantId
 * @returns {Promise<{access_token: string, refresh_token: string, token_type: string, expires_in: number}>}
 */
export async function login(email, password, tenantId) {
  const response = await client.post(API_ROUTES.AUTH.LOGIN, {
    email,
    password,
    tenant_id: tenantId,
  })
  return response.data
}

/**
 * Register a new user.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} tenantId
 * @param {string} [role='viewer']
 * @returns {Promise<{access_token: string, refresh_token: string, token_type: string, expires_in: number}>}
 */
export async function register(email, password, tenantId, role = 'viewer') {
  const response = await client.post(API_ROUTES.AUTH.REGISTER, {
    email,
    password,
    tenant_id: tenantId,
    role,
  })
  return response.data
}

/**
 * Refresh the access token using a valid refresh token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{access_token: string, refresh_token: string, token_type: string, expires_in: number}>}
 */
export async function refreshAccessToken(refreshToken) {
  const response = await client.post(API_ROUTES.AUTH.REFRESH, {
    refresh_token: refreshToken,
  })
  return response.data
}
