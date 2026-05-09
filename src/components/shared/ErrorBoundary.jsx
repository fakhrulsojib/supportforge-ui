/**
 * ErrorBoundary — catches render errors and shows a friendly fallback.
 *
 * Uses React class component (required for componentDidCatch).
 * Displays a user-friendly error message without exposing stack traces
 * or internal details (per Security Checklist).
 *
 * Features:
 * - Catches JavaScript errors in child component tree
 * - Shows friendly fallback UI with retry button
 * - Logs error info for development only (not tokens or sensitive data)
 */

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log for development only — never log tokens or sensitive data
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      // Allow custom fallback via props
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <svg
              className="error-boundary-icon"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M24 16v10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="24" cy="32" r="1.5" fill="currentColor" />
            </svg>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-text">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              type="button"
              className="sf-btn sf-btn-primary"
              onClick={this.handleRetry}
              id="error-boundary-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
