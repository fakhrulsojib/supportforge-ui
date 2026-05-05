/**
 * LoginPage — authentication page with login and registration forms.
 *
 * Security:
 * - Password fields use type="password"
 * - No tokens or passwords logged to console
 * - Error messages from API shown inline (no stack traces)
 */

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { extractErrorMessage } from '../api/client'
import { APP_NAME } from '../utils/constants'
import '../styles/auth.css'

export default function LoginPage() {
  const { login, register, isLoading } = useAuth()
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantId: '',
    role: 'viewer',
  })
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  function validateForm() {
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (isRegisterMode && formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!formData.tenantId.trim()) {
      setError('Tenant ID is required')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (isRegisterMode) {
        await register(
          formData.email.trim(),
          formData.password,
          formData.tenantId.trim(),
          formData.role,
        )
      } else {
        await login(
          formData.email.trim(),
          formData.password,
          formData.tenantId.trim(),
        )
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  function toggleMode() {
    setIsRegisterMode((prev) => !prev)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-container sf-animate-fade-in-up">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="url(#auth-logo-grad)" />
              <path d="M14 20C14 17.79 15.79 16 18 16H30C32.21 16 34 17.79 34 20V28C34 30.21 32.21 32 30 32H26L22 36V32H18C15.79 32 14 30.21 14 28V20Z" fill="white" fillOpacity="0.9" />
              <circle cx="21" cy="24" r="1.5" fill="hsl(249, 64%, 55%)" />
              <circle cx="27" cy="24" r="1.5" fill="hsl(249, 64%, 55%)" />
              <defs>
                <linearGradient id="auth-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(249, 64%, 55%)" />
                  <stop offset="1" stopColor="hsl(254, 55%, 40%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-title">{APP_NAME}</h1>
          <p className="auth-subtitle">
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Error display */}
          {error && (
            <div className="auth-error sf-animate-fade-in" role="alert" id="auth-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              className="sf-input"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-label">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              className="sf-input"
              placeholder={isRegisterMode ? 'Min 8 chars, mixed case, digit, special' : 'Enter your password'}
              value={formData.password}
              onChange={handleChange}
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-tenant" className="auth-label">Tenant ID</label>
            <input
              id="auth-tenant"
              name="tenantId"
              type="text"
              className="sf-input"
              placeholder="your-tenant-id"
              value={formData.tenantId}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {isRegisterMode && (
            <div className="auth-field sf-animate-fade-in">
              <label htmlFor="auth-role" className="auth-label">Role</label>
              <select
                id="auth-role"
                name="role"
                className="sf-input auth-select"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="viewer">Viewer</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="sf-btn sf-btn-primary sf-btn-lg auth-submit"
            disabled={isLoading}
            id="auth-submit-btn"
          >
            {isLoading ? (
              <span className="auth-spinner" aria-label="Loading"></span>
            ) : isRegisterMode ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle login/register */}
        <div className="auth-toggle">
          <span className="auth-toggle-text">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={toggleMode}
            disabled={isLoading}
            id="auth-toggle-mode"
          >
            {isRegisterMode ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  )
}
