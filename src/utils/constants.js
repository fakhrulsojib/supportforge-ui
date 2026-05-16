/**
 * Application-wide constants.
 * All environment variables are accessed through this module
 * to centralise configuration and prevent typos.
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SupportForge'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
export const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/ws/chat`
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development'
export const EMBEDDING_MODEL = import.meta.env.VITE_EMBEDDING_MODEL || 'nomic-embed-text'

/**
 * API route prefixes — centralised so consumers don't hardcode paths.
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
  },
  CHAT: '/api/v1/chat',
  CONVERSATIONS: '/api/v1/conversations',
  DOCUMENTS: '/api/v1/documents',
  TENANTS: '/api/v1/tenants',
  ANALYTICS: {
    DAILY_STATS: '/api/v1/analytics/daily-stats',
    TOP_INTENTS: '/api/v1/analytics/top-intents',
    SATISFACTION: '/api/v1/analytics/satisfaction',
  },
  ADMIN: {
    NEGATIVE_FEEDBACK: '/api/v1/admin/feedback/negative',
    ESCALATIONS: '/api/v1/admin/escalations',
    FLAGGED: '/api/v1/admin/flagged',
    FEEDBACK_BASE: '/api/v1/admin/feedback',
    STATS: '/api/v1/admin/feedback/stats',
    MODELS: '/api/v1/admin/models',
    MODELS_ACTIVE: '/api/v1/admin/models/active',
  },
  PLATFORM: {
    TENANTS: '/api/v1/platform/tenants',
  },
  FAILED_QUERIES: {
    LIST: '/api/v1/admin/failed-queries',
    STATS: '/api/v1/admin/failed-queries/stats',
  },
  HEALTH: '/health',
}

/**
 * Breakpoints matching the responsive testing requirements.
 */
export const BREAKPOINTS = {
  MOBILE: 375,
  TABLET: 768,
  DESKTOP: 1440,
}

/**
 * File upload constraints (must match backend validation).
 */
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_FILES_PER_TENANT: 50,
  ALLOWED_TYPES: [
    'application/pdf',
    'text/markdown',
    'text/csv',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.md', '.csv', '.txt'],
}
