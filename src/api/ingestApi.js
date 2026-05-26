/**
 * Document ingestion API functions.
 *
 * All calls go through the centralised client.
 * Request/response shapes match the backend's ingest schemas exactly.
 *
 * Backend endpoints (from app/api/v1/ingest.py):
 *   POST   /api/v1/documents/upload      — multipart upload (admin/agent)
 *   GET    /api/v1/documents              — list tenant documents (admin/agent)
 *   GET    /api/v1/documents/{id}         — single document status (admin/agent)
 *   DELETE /api/v1/documents/{id}         — delete document (admin only)
 */

import client from './client'
import { API_ROUTES } from '../utils/constants'

/**
 * Upload a document for RAG ingestion.
 *
 * Sends the file as multipart/form-data. The backend validates:
 * - File type (.pdf, .md, .csv, .txt)
 * - File size (≤ 10MB)
 * - Tenant file count (≤ 50)
 *
 * @param {File} file - The file to upload.
 * @param {(progress: number) => void} [onProgress] - Progress callback (0–100).
 * @returns {Promise<{document_id: string, filename: string, status: string, message: string}>}
 */
export async function uploadDocument(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post(
    `${API_ROUTES.DOCUMENTS}/upload`,
    formData,
    {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total)
          onProgress(percent)
        }
      },
    },
  )
  return response.data
}

/**
 * List all documents for the authenticated user's tenant.
 *
 * @returns {Promise<{documents: Array<{id: string, tenant_id: string, filename: string, file_type: string, chunk_count: number, status: string, uploaded_by: string, created_at: string}>, total: number}>}
 */
export async function listDocuments() {
  const response = await client.get(API_ROUTES.DOCUMENTS)
  return response.data
}

/**
 * Get a single document's status and metadata.
 *
 * @param {string} documentId - Document UUID.
 * @returns {Promise<{id: string, tenant_id: string, filename: string, file_type: string, chunk_count: number, status: string, uploaded_by: string, created_at: string}>}
 */
export async function getDocumentStatus(documentId) {
  const response = await client.get(`${API_ROUTES.DOCUMENTS}/${documentId}`)
  return response.data
}

/**
 * Delete a document and its chunks (admin only).
 *
 * @param {string} documentId - Document UUID.
 * @returns {Promise<void>}
 */
export async function deleteDocument(documentId) {
  await client.delete(`${API_ROUTES.DOCUMENTS}/${documentId}`)
}

/**
 * Retry ingestion for a failed document.
 *
 * @param {string} documentId - Document UUID.
 * @returns {Promise<{document_id: string, filename: string, status: string, message: string}>}
 */
export async function retryDocument(documentId) {
  const response = await client.post(`${API_ROUTES.DOCUMENTS}/${documentId}/retry`)
  return response.data
}
