/**
 * Centralised Axios HTTP client.
 *
 * ALL HTTP requests in the app MUST go through this module.
 * Never use raw fetch() or import axios directly in components.
 *
 * Features:
 * - Authorization header injection from in-memory token
 * - 401 auto-refresh interceptor with request retry
 * - Structured error extraction
 */

import axios from 'axios'
import { API_BASE_URL, API_ROUTES } from '../utils/constants'

/**
 * In-memory token store.
 * Tokens are NEVER persisted to localStorage or sessionStorage
 * per AGENTS.md Security Checklist.
 */
let accessToken = null
let refreshTokenValue = null

/** @param {string|null} token */
export function setAccessToken(token) {
  accessToken = token
}

/** @returns {string|null} */
export function getAccessToken() {
  return accessToken
}

/** @param {string|null} token */
export function setRefreshToken(token) {
  refreshTokenValue = token
}

/** @returns {string|null} */
export function getRefreshToken() {
  return refreshTokenValue
}

/** Clear all in-memory tokens (used on logout). */
export function clearTokens() {
  accessToken = null
  refreshTokenValue = null
}

/**
 * Axios instance with base URL and JSON defaults.
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

/*
 * Request interceptor — inject Authorization header when token exists.
 */
client.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/*
 * Response interceptor — auto-refresh on 401.
 *
 * When a 401 is received:
 * 1. If we have a refresh token and haven't already retried, attempt refresh.
 * 2. On success, update tokens, retry the original request.
 * 3. On failure, clear tokens (triggers logout via AuthContext).
 */
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only intercept 401s, and not for auth endpoints themselves
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === API_ROUTES.AUTH.LOGIN ||
      originalRequest.url === API_ROUTES.AUTH.REGISTER ||
      originalRequest.url === API_ROUTES.AUTH.REFRESH
    ) {
      return Promise.reject(error)
    }

    // No refresh token available — can't recover
    if (!refreshTokenValue) {
      clearTokens()
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return client(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`,
        { refresh_token: refreshTokenValue },
        { headers: { 'Content-Type': 'application/json' } },
      )

      const { access_token, refresh_token } = response.data
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
      processQueue(null, access_token)

      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return client(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      clearTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

/**
 * Extract a user-facing error message from an Axios error.
 * Handles the backend's { error: { code, message } } format,
 * FastAPI's { detail: "..." } format, and generic Axios errors.
 *
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
export function extractErrorMessage(error) {
  const data = error.response?.data
  // SupportForge API format: { error: { code: "...", message: "..." } }
  if (data?.error?.message) {
    return data.error.message
  }
  // FastAPI default format: { detail: "..." }
  if (data?.detail) {
    return data.detail
  }
  // Flat message format: { message: "..." }
  if (data?.message) {
    return data.message
  }
  // Axios network error
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export default client
