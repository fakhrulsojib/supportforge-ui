/**
 * DocumentUploader — drag-and-drop file upload with client-side validation.
 *
 * Features:
 * - Native HTML5 drag-and-drop (no library)
 * - Multi-file selection and sequential upload
 * - Client-side file type and size validation (all files validated before upload starts)
 * - Upload progress bar via Axios onUploadProgress (weighted across files)
 * - Three visual states: idle, drag-active, uploading
 * - Accessible: role="button", tabIndex=0, keyboard activation
 *
 * Security:
 * - File validated before sending to API
 * - No sensitive data logged to console
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadDocument } from '../../api/ingestApi'
import { extractErrorMessage } from '../../api/client'
import { UPLOAD } from '../../utils/constants'
import { formatFileSize } from '../../utils/formatters'

/**
 * Validate a file against allowed types and size limits.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateFile(file) {
  // Check file extension
  const name = file.name || ''
  const ext = '.' + name.split('.').pop().toLowerCase()
  if (!UPLOAD.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${ext}". Allowed: ${UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Note: MIME type validation is intentionally omitted here.
  // The extension check above is authoritative. Browser-assigned MIME
  // types are unreliable (e.g., .md → text/plain, .csv → application/vnd.ms-excel)
  // and would cause false rejections. The backend performs its own validation.

  // Check file size
  if (file.size > UPLOAD.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum: ${UPLOAD.MAX_FILE_SIZE_MB}MB`,
    }
  }

  // Check empty file
  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  return { valid: true, error: null }
}

/**
 * @param {{ onUploadSuccess: (doc: object) => void, disabled?: boolean }} props
 */
export default function DocumentUploader({ onUploadSuccess, disabled = false }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)
  const errorTimerRef = useRef(null)
  const successTimerRef = useRef(null)

  /** Clear error after delay */
  const showError = useCallback((message) => {
    setError(message)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(null), 5000)
  }, [])

  /** Show success briefly */
  const showSuccess = useCallback((message) => {
    setSuccess(message)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => setSuccess(null), 3000)
  }, [])

  /** Clean up timers on unmount to prevent setState on unmounted component. */
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  /** Process selected files sequentially */
  const handleFiles = useCallback(
    async (fileList) => {
      setError(null)
      setSuccess(null)

      // Validate all files first
      const validFiles = []
      for (const file of fileList) {
        const validation = validateFile(file)
        if (!validation.valid) {
          showError(validation.error)
          return
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      setIsUploading(true)
      setUploadProgress(0)

      let uploaded = 0
      const results = []
      try {
        for (const file of validFiles) {
          const result = await uploadDocument(file, (progress) => {
            // Weighted progress across all files
            const base = (uploaded / validFiles.length) * 100
            const fileShare = progress / validFiles.length
            setUploadProgress(Math.round(base + fileShare))
          })
          uploaded++
          results.push(result)
          if (onUploadSuccess) {
            onUploadSuccess(result)
          }
        }
        const msg = validFiles.length === 1
          ? `"${results[0].filename}" uploaded successfully!`
          : `${validFiles.length} files uploaded successfully!`
        showSuccess(msg)
      } catch (err) {
        showError(extractErrorMessage(err))
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [onUploadSuccess, showError, showSuccess],
  )

  /** Drag event handlers */
  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    // Only deactivate if leaving the drop zone (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFiles(Array.from(files))
    }
  }

  /** Click / keyboard activation */
  function handleClick() {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  function handleFileChange(e) {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(Array.from(files))
    }
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const zoneClasses = [
    'admin-upload-zone',
    isDragActive ? 'admin-upload-zone-active' : '',
    disabled || isUploading ? 'admin-upload-zone-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      id="admin-upload-zone"
      className={zoneClasses}
      role="button"
      tabIndex={disabled || isUploading ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Upload documents. Drag and drop or click to browse. Multiple files supported."
    >
      <input
        ref={fileInputRef}
        id="admin-file-input"
        type="file"
        className="admin-upload-input"
        accept={UPLOAD.ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileChange}
        multiple
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Upload icon */}
      <svg className="admin-upload-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M24 32V16m0 0l-7 7m7-7l7 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M40 30v6a4 4 0 01-4 4H12a4 4 0 01-4-4v-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!isUploading && (
        <>
          <p className="admin-upload-title">
            {isDragActive ? 'Drop your files here' : 'Drag & drop documents'}
          </p>
          <p className="admin-upload-subtitle">or click to browse (multiple files supported)</p>
          <div className="admin-upload-formats">
            {UPLOAD.ALLOWED_EXTENSIONS.map((ext) => (
              <span key={ext} className="admin-upload-format-tag">
                {ext}
              </span>
            ))}
            <span className="admin-upload-format-tag">
              ≤ {UPLOAD.MAX_FILE_SIZE_MB}MB
            </span>
          </div>
        </>
      )}

      {isUploading && (
        <div className="admin-upload-progress">
          <div className="admin-upload-progress-bar-track">
            <div
              className="admin-upload-progress-bar-fill"
              style={{ '--progress-width': `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="admin-upload-progress-text">Uploading… {uploadProgress}%</p>
        </div>
      )}

      {error && (
        <div className="admin-upload-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="admin-upload-success" role="status">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 8l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}
