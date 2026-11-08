// src/components/AttachmentManagerModal.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Plus,
  Download,
  Upload,
  Paperclip,
  File,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react'
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa'
import { supportAPI } from '../../services/api'

// Helper functions - moved outside and converted to regular functions
export const getFileIcon = (fileName, fileType, className = 'w-5 h-5') => {
  if (!fileName && !fileType) return <File className={`${className} text-gray-400`} />

  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()

  if (lowerFileName.endsWith('.pdf') || lowerFileType.includes('pdf')) {
    return <FaFilePdf className={`${className} text-red-600`} />
  }

  if (lowerFileName.endsWith('.png') || lowerFileType.includes('png')) {
    return <FaFileImage className={`${className} text-blue-500`} />
  }

  if (
    lowerFileName.endsWith('.jpg') ||
    lowerFileName.endsWith('.jpeg') ||
    lowerFileType.includes('jpeg') ||
    lowerFileType.includes('jpg')
  ) {
    return <FaFileImage className={`${className} text-green-500`} />
  }

  if (lowerFileName.endsWith('.gif') || lowerFileType.includes('gif')) {
    return <FaFileImage className={`${className} text-purple-500`} />
  }

  if (lowerFileName.endsWith('.bmp') || lowerFileType.includes('bmp')) {
    return <FaFileImage className={`${className} text-yellow-500`} />
  }

  if (lowerFileName.endsWith('.webp') || lowerFileType.includes('webp')) {
    return <FaFileImage className={`${className} text-indigo-500`} />
  }

  if (lowerFileName.endsWith('.txt') || lowerFileType.includes('text')) {
    return <FaFileAlt className={`${className} text-gray-600`} />
  }

  if (
    lowerFileName.endsWith('.doc') ||
    lowerFileName.endsWith('.docx') ||
    lowerFileType.includes('word')
  ) {
    return <FaFileAlt className={`${className} text-blue-600`} />
  }

  if (
    lowerFileName.endsWith('.xls') ||
    lowerFileName.endsWith('.xlsx') ||
    lowerFileType.includes('excel')
  ) {
    return <FaFileAlt className={`${className} text-green-600`} />
  }

  return <File className={`${className} text-gray-400`} />
}

export const getFileTypeDisplay = (fileName, fileType) => {
  if (!fileName && !fileType) return 'File'

  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()

  const fileTypes = {
    '.pdf': 'PDF Document',
    '.png': 'PNG Image',
    '.jpg': 'JPG Image',
    '.jpeg': 'JPEG Image',
    '.gif': 'GIF Image',
    '.bmp': 'BMP Image',
    '.webp': 'WebP Image',
    '.txt': 'Text File',
    '.doc': 'Word Document',
    '.docx': 'Word Document',
    '.xls': 'Excel Spreadsheet',
    '.xlsx': 'Excel Spreadsheet',
  }

  for (const [ext, display] of Object.entries(fileTypes)) {
    if (lowerFileName.endsWith(ext) || lowerFileType.includes(ext.replace('.', ''))) {
      return display
    }
  }

  return fileType || 'File'
}

export const formatFileSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getFileExtension = fileName => {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
}

export const isImageFile = (fileName, fileType) => {
  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()

  return lowerFileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/) || lowerFileType.includes('image')
}

export const isPDFFile = (fileName, fileType) => {
  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()

  return lowerFileName.endsWith('.pdf') || lowerFileType.includes('pdf')
}

export const canPreviewInBrowser = (fileName, fileType) => {
  return isImageFile(fileName, fileType) || isPDFFile(fileName, fileType)
}

// Optimized Image Preview Modal
export const ImagePreviewModal = React.memo(({ imageUrl, fileName, onClose }) => {
  if (!imageUrl) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-3 z-50">
      <div className="relative max-w-3xl w-full max-h-[85vh]">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName, 'image', 'w-4 h-4')}
              <div className="max-w-xs">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {fileName || 'Image Preview'}
                </h3>
                <p className="text-xs text-gray-600">Click and drag to pan, scroll to zoom</p>
              </div>
            </div>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
          </div>

          <div className="relative bg-gray-900" style={{ height: 'calc(85vh - 100px)' }}>
            <img
              src={imageUrl}
              alt={fileName || 'Preview'}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={e => {
                e.target.onerror = null
                e.target.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMTc1IDEwMEwxMjUgMjAwTDc1IDE3NUwyNSAyMjUiIHN0cm9rZT0iIzlDQTBBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIxNzUiIGN5PSIxMDAiIHI9IjIwIiBzdHJva2U9IiMwMDdCRjUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4='
              }}
            />
          </div>

          <div className="p-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-600">Use mouse wheel to zoom, drag to pan</div>
            <div className="flex gap-2">
              <a
                href={imageUrl}
                download={fileName || 'image'}
                className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Optimized PDF Preview Modal
export const PDFPreviewModal = React.memo(({ pdfUrl, fileName, onClose }) => {
  if (!pdfUrl) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-3 z-50">
      <div className="relative max-w-5xl w-full max-h-[85vh]">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity flex items-center gap-1"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden h-full">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName, 'pdf', 'w-4 h-4')}
              <div className="max-w-xs">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {fileName || 'PDF Preview'}
                </h3>
                <p className="text-xs text-gray-600">Viewing PDF document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={pdfUrl}
                download={fileName || 'document.pdf'}
                className="flex items-center gap-1 px-2 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
          </div>

          <div className="relative bg-gray-900" style={{ height: 'calc(85vh - 100px)' }}>
            <iframe
              src={pdfUrl}
              title={fileName || 'PDF Preview'}
              className="w-full h-full border-0"
              loading="lazy"
              onError={e => {
                e.target.onerror = null
                e.target.src = ''
                e.target.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; padding: 1.5rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">📄</div>
                    <h3 style="font-size: 1rem; margin-bottom: 0.5rem; text-align: center;">Cannot display PDF</h3>
                    <p style="margin-bottom: 1rem; opacity: 0.8; text-align: center;">The PDF cannot be displayed in the browser.</p>
                    <a href="${pdfUrl}" download="${fileName || 'document.pdf'}" style="background: #DC2626; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none;">Download PDF</a>
                  </div>
                `
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// Delete Confirmation Modal
const DeleteConfirmationModal = React.memo(
  ({ show, fileIds, fileName, onConfirm, onCancel, deleting }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
        <div className="bg-white rounded-lg max-w-sm w-full">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Delete Attachment{fileIds.length > 1 ? 's' : ''}
            </h3>
          </div>

          <div className="p-3">
            <div className="mb-3">
              <p className="text-gray-700 text-sm">
                Are you sure you want to delete{' '}
                {fileIds.length > 1 ? 'these attachments' : 'this attachment'}?
              </p>
              {fileName && (
                <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                  <strong>{fileName}</strong>
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2">This action cannot be undone.</p>
              {fileIds.length > 1 && (
                <div className="mt-2 p-1.5 bg-red-50 border border-red-100 rounded">
                  <p className="text-xs text-red-700">
                    <strong>Note:</strong> {fileIds.length} file{fileIds.length > 1 ? 's' : ''} will
                    be deleted.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete{fileIds.length > 1 ? ` (${fileIds.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// Main Attachment Manager Modal Component
const AttachmentManagerModal = ({ show, ticket, onClose, canUpload = true, onRefresh }) => {
  // View mode state
  const [viewMode, setViewMode] = useState('view')
  const [imagePreview, setImagePreview] = useState(null)
  const [pdfPreview, setPDFPreview] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletingFile, setDeletingFile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Upload mode state
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Constants
  const ALLOWED_FILE_TYPES = useMemo(
    () => [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    []
  )

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  // Memoized helper functions
  const getFileTypeFromFileName = useCallback(fileName => {
    if (!fileName) return ''
    const lowerFileName = fileName.toLowerCase()

    if (lowerFileName.endsWith('.pdf')) return 'application/pdf'
    if (lowerFileName.endsWith('.png')) return 'image/png'
    if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) return 'image/jpeg'
    if (lowerFileName.endsWith('.gif')) return 'image/gif'
    if (lowerFileName.endsWith('.bmp')) return 'image/bmp'
    if (lowerFileName.endsWith('.webp')) return 'image/webp'
    if (lowerFileName.endsWith('.txt')) return 'text/plain'
    if (lowerFileName.endsWith('.doc')) return 'application/msword'
    if (lowerFileName.endsWith('.docx'))
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (lowerFileName.endsWith('.xls')) return 'application/vnd.ms-excel'
    if (lowerFileName.endsWith('.xlsx'))
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return ''
  }, [])

  const handlePreview = useCallback(attachment => {
    const fileName = attachment.name || ''
    const fileType = attachment.type || ''
    let fileUrl = null

    if (typeof attachment === 'string') {
      fileUrl = attachment
    } else {
      fileUrl = attachment.url || attachment.path || attachment.fileUrl || attachment
    }

    if (!fileUrl) {
      setError('No URL available for this file')
      return
    }

    if (isImageFile(fileName, fileType)) {
      setImagePreview({ url: fileUrl, fileName })
    } else if (isPDFFile(fileName, fileType)) {
      setPDFPreview({ url: fileUrl, fileName })
    } else {
      window.open(fileUrl, '_blank')
    }
  }, [])

  const handleOpenInNewTab = useCallback(attachment => {
    const fileName = attachment.name || ''
    const fileType = attachment.type || ''
    const fileUrl = attachment.url || attachment.path || attachment.fileUrl || attachment

    if (!fileUrl) {
      setError('No URL available for this file')
      return
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }, [])

  const handleDeleteFile = useCallback(
    async (attachmentId, fileName) => {
      if (!ticket || !attachmentId) {
        setError('Missing ticket ID or attachment ID')
        return
      }

      const ticketId = ticket.support_ticket_id || ticket.id
      setDeletingFile(true)
      setError('')

      try {
        const attachmentIds = Array.isArray(attachmentId) ? attachmentId : [attachmentId]
        const requestBody = attachmentIds

        const response = await supportAPI.deleteAttachments(ticketId, requestBody)

        if (response.data?.success) {
          setSuccess(
            `Successfully deleted ${attachmentIds.length} file${attachmentIds.length > 1 ? 's' : ''}`
          )
          setDeleteConfirm(null)

          if (onRefresh) {
            onRefresh()
          }

          setTimeout(() => setSuccess(''), 2000)
        } else {
          setError(response.data?.message || 'Failed to delete file')
        }
      } catch (err) {
        console.error('Delete error:', err)
        setError(err.response?.data?.message || 'Failed to delete file. Please try again.')
      } finally {
        setDeletingFile(false)
      }
    },
    [ticket, onRefresh]
  )

  const handleFileSelect = useCallback(
    e => {
      const selectedFiles = Array.from(e.target.files)
      setError('')
      setSuccess('')

      const validFiles = []
      const invalidFiles = []

      selectedFiles.forEach(file => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          invalidFiles.push(`${file.name} (invalid type: ${file.type})`)
        } else if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (${formatFileSize(file.size)} exceeds 10MB limit)`)
        } else {
          const isDuplicate = files.some(
            existingFile => existingFile.name === file.name && existingFile.size === file.size
          )

          if (isDuplicate) {
            invalidFiles.push(`${file.name} (duplicate)`)
          } else {
            validFiles.push(file)
          }
        }
      })

      if (invalidFiles.length > 0) {
        setError(
          `The following files were rejected: ${invalidFiles.join(', ')}. ` +
            'Only images, PDFs, and documents up to 10MB are allowed.'
        )
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles])
        if (!error) {
          setSuccess(`Added ${validFiles.length} file(s) successfully`)
          setTimeout(() => setSuccess(''), 3000)
        }
      }
    },
    [ALLOWED_FILE_TYPES, files, error]
  )

  const removeFile = useCallback(index => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllFiles = useCallback(() => {
    if (files.length > 0) {
      if (window.confirm(`Are you sure you want to remove all ${files.length} selected files?`)) {
        setFiles([])
      }
    }
  }, [files.length])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload')
      return
    }

    if (!ticket) return
    const ticketId = ticket.support_ticket_id || ticket.id

    setUploading(true)
    setUploadProgress(0)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await supportAPI.UpdateTicketAttachments(ticketId, formData)

      if (response.data?.success) {
        setUploadProgress(100)
        setSuccess(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`)

        setTimeout(() => {
          setFiles([])
          setUploadProgress(0)
          setViewMode('view')

          if (onRefresh) {
            onRefresh()
          }

          setSuccess('')
        }, 1500)
      } else {
        setError(response.data?.message || 'Failed to upload files')
      }
    } catch (err) {
      console.error('Upload error:', err)
      let errorMessage = 'Failed to upload files. Please try again.'

      if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 10MB per file.'
      } else if (err.response?.data?.error) {
        errorMessage = `Server error: ${err.response.data.error}`
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.'
      }

      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }, [files, ticket, onRefresh])

  const handleDragOver = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()

      const droppedFiles = Array.from(e.dataTransfer.files)
      const dataTransfer = new DataTransfer()
      droppedFiles.forEach(file => dataTransfer.items.add(file))

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        handleFileSelect({ target: fileInputRef.current })
      }
    },
    [handleFileSelect]
  )

  const previewFile = useCallback(file => {
    const url = URL.createObjectURL(file)
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }, [])

  const getFileTypeDisplayForUpload = useCallback(file => {
    const type = (file.type || '').toLowerCase()
    const name = (file.name || '').toLowerCase()

    if (type.includes('pdf') || name.endsWith('.pdf')) return 'PDF Document'
    if (type.includes('image')) {
      if (name.endsWith('.png')) return 'PNG Image'
      if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPEG Image'
      if (name.endsWith('.gif')) return 'GIF Image'
      if (name.endsWith('.bmp')) return 'BMP Image'
      if (name.endsWith('.webp')) return 'WebP Image'
      return 'Image File'
    }
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word Document'
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'Excel Spreadsheet'
    if (name.endsWith('.txt')) return 'Text File'
    return file.type || 'Unknown File Type'
  }, [])

  const toggleCategory = useCallback(category => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }, [])

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setViewMode('view')
      setFiles([])
      setUploading(false)
      setUploadProgress(0)
      setError('')
      setSuccess('')
      setExpandedCategories([])
    }
  }, [show])

  // Process attachments
  const { categories, totalCount } = useMemo(() => {
    if (!ticket) return { categories: [], totalCount: 0 }

    const attachments = ticket.attachments || []
    if (!attachments || attachments.length === 0) return { categories: [], totalCount: 0 }

    let allAttachments = []
    let totalCount = 0

    if (Array.isArray(attachments)) {
      allAttachments = attachments.map((attachment, index) => {
        if (typeof attachment === 'string') {
          const fileName = attachment.split('/').pop() || `Attachment ${index + 1}`
          const fileType = getFileTypeFromFileName(fileName)
          return {
            name: fileName,
            url: attachment,
            path: attachment,
            type: fileType,
            id: index,
          }
        } else if (typeof attachment === 'object') {
          const fileName = attachment.name || attachment.fileName || `Attachment ${index + 1}`
          const fileUrl = attachment.url || attachment.path || attachment.fileUrl || attachment
          const fileType =
            attachment.type || attachment.fileType || getFileTypeFromFileName(fileName)
          return {
            ...attachment,
            name: fileName,
            url: fileUrl,
            path: fileUrl,
            type: fileType,
            id: attachment.id || attachment.attachment_id || index,
          }
        }
        return {
          name: `Attachment ${index + 1}`,
          url: '',
          type: '',
          id: index,
        }
      })
      totalCount = allAttachments.length
    }

    // Categorize attachments
    const categories = {
      images: [],
      documents: [],
      pdfs: [],
      others: [],
    }

    allAttachments.forEach(attachment => {
      const fileName = attachment.name || ''
      const fileType = attachment.type || ''

      if (isImageFile(fileName, fileType)) {
        categories.images.push(attachment)
      } else if (isPDFFile(fileName, fileType)) {
        categories.pdfs.push(attachment)
      } else if (fileName.match(/\.(doc|docx|xls|xlsx|txt)$/)) {
        categories.documents.push(attachment)
      } else {
        categories.others.push(attachment)
      }
    })

    // Filter out empty categories
    const activeCategories = Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({
        name: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        items,
        icon:
          category === 'images'
            ? '🖼️'
            : category === 'pdfs'
              ? '📄'
              : category === 'documents'
                ? '📝'
                : '📎',
      }))

    return { categories: activeCategories, totalCount }
  }, [ticket, getFileTypeFromFileName])

  const renderViewMode = useMemo(() => {
    if (!ticket) return null
    const ticketNumber = ticket.ticket_number || `#${ticket.support_ticket_id || ticket.id}`

    return (
      <>
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map(category => {
                const isExpanded = expandedCategories.includes(category.name)

                return (
                  <div
                    key={category.name}
                    className="border border-gray-200 rounded overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full p-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 text-xs">{category.label}</h4>
                          <p className="text-xs text-gray-600">
                            {category.items.length} {category.items.length === 1 ? 'file' : 'files'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-2 bg-white border-t border-gray-200">
                        <div className="space-y-2">
                          {category.items.map((attachment, index) => {
                            const fileName = attachment.name || `Attachment ${index + 1}`
                            const fileType = attachment.type || ''
                            const fileSize = attachment.size || ''
                            const fileUrl =
                              attachment.url || attachment.path || attachment.fileUrl || attachment
                            const canPreview = canPreviewInBrowser(fileName, fileType)
                            const attachmentId = attachment.id || index

                            return (
                              <div
                                key={index}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <button
                                      onClick={() => handleOpenInNewTab(attachment)}
                                      className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                                      title={`Open "${fileName}" in new tab`}
                                    >
                                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        {getFileIcon(fileName, fileType, 'w-4 h-4')}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                          {fileName}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                                          <span>{getFileTypeDisplay(fileName, fileType)}</span>
                                          {fileSize && (
                                            <>
                                              <span>•</span>
                                              <span>{formatFileSize(fileSize)}</span>
                                            </>
                                          )}
                                          {getFileExtension(fileName) && (
                                            <>
                                              <span>•</span>
                                              <span className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">
                                                {getFileExtension(fileName)}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                                    {canPreview && (
                                      <button
                                        onClick={() => handlePreview(attachment)}
                                        className="p-1 text-gray-600 hover:text-primary-600 transition-colors rounded hover:bg-gray-100"
                                        title="Preview file"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {fileUrl && (
                                      <>
                                        <button
                                          onClick={() => handleOpenInNewTab(attachment)}
                                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors rounded hover:bg-gray-100"
                                          title="Open in new tab"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <a
                                          href={fileUrl}
                                          download={fileName}
                                          className="p-1 text-gray-600 hover:text-green-600 transition-colors rounded hover:bg-gray-100"
                                          title="Download file"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </>
                                    )}

                                    {canUpload && (
                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            fileIds: [attachmentId],
                                            fileName,
                                          })
                                        }
                                        className="p-1 text-gray-600 hover:text-red-600 transition-colors rounded hover:bg-gray-100"
                                        title="Delete file"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <File className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">No attachments available</h4>
              <p className="text-gray-600 text-xs mb-4">
                There are no attachments for this ticket yet
              </p>
              {canUpload && (
                <button
                  onClick={() => setViewMode('upload')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload First Attachment
                </button>
              )}
            </div>
          )}

          {categories.length > 0 && canUpload && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <Upload className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 text-xs mb-1">
                    Want to add more files?
                  </h5>
                  <p className="text-blue-700 text-xs">
                    Upload additional images, documents, or PDFs. Max 10MB each.
                  </p>
                  <button
                    onClick={() => setViewMode('upload')}
                    className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload more files
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            Total: {totalCount} {totalCount === 1 ? 'attachment' : 'attachments'}
          </div>
          <div className="flex items-center gap-1.5">
            {totalCount > 0 && (
              <>
                <button
                  onClick={() => setExpandedCategories(categories.map(c => c.name))}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedCategories([])}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Collapse All
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </>
    )
  }, [
    categories,
    expandedCategories,
    ticket,
    totalCount,
    canUpload,
    toggleCategory,
    handleOpenInNewTab,
    handlePreview,
    onClose,
  ])

  const renderUploadMode = useMemo(() => {
    if (!ticket) return null
    const ticketNumber = ticket.ticket_number || `#${ticket.support_ticket_id || ticket.id}`

    return (
      <>
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          <div
            className={`border-2 border-dashed rounded p-3 text-center mb-3 ${
              uploading
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">Drag & drop files here</h4>
            <p className="text-gray-600 text-xs mb-2">or click to browse files</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.txt,.doc,.docx,.xls,.xlsx"
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded cursor-pointer ${
                uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Browse Files
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Images, PDF, Word, Excel, Text (Max 10MB each)
            </p>
          </div>

          {files.length > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    Selected Files ({files.length})
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Total size: {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={clearAllFiles}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}-${file.size}`}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {getFileIcon(file.name, file.type, 'w-4 h-4')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600 mt-0.5">
                          <span>{getFileTypeDisplayForUpload(file)}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 ml-1">
                      {!uploading && (
                        <>
                          <button
                            onClick={() => previewFile(file)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-gray-100"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-gray-100"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                <span className="text-sm text-gray-600">
                  Uploading {files.length} file{files.length > 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => {
              if (uploading) {
                if (!window.confirm('Upload is in progress. Are you sure you want to cancel?'))
                  return
              }
              if (files.length > 0) {
                if (!window.confirm('You have unsaved files. Are you sure you want to go back?'))
                  return
              }
              setViewMode('view')
              setFiles([])
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to View
          </button>
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded flex items-center gap-1.5 ${
                files.length === 0 || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </>
    )
  }, [
    ticket,
    uploading,
    files,
    uploadProgress,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    clearAllFiles,
    previewFile,
    removeFile,
    getFileTypeDisplayForUpload,
    handleUpload,
    onClose,
  ])

  if (!show || !ticket) return null

  const ticketId = ticket.support_ticket_id || ticket.id
  const ticketNumber = ticket.ticket_number || `#${ticketId}`

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-40">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {viewMode === 'view' ? 'Attachments' : 'Upload Attachments'} for #{ticketNumber}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                {viewMode === 'view' ? (
                  <>
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>
                      {totalCount} {totalCount === 1 ? 'file' : 'files'} attached
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload new files</span>
                  </>
                )}
                {ticket?.subject && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-xs">{ticket.subject}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {viewMode === 'view' && canUpload && (
                <button
                  onClick={() => setViewMode('upload')}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Upload
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-1.5 flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-800">Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-3 mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-start gap-1.5 flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-green-800">Success</p>
                <p className="text-xs text-green-700">{success}</p>
              </div>
            </div>
          )}

          {viewMode === 'view' && totalCount > 0 && (
            <div className="mx-3 mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex-shrink-0">
              <strong>Tip:</strong> Click on any file name or icon to open it in a new tab.
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {viewMode === 'view' ? renderViewMode : renderUploadMode}
          </div>
        </div>
      </div>

      {imagePreview && (
        <ImagePreviewModal
          imageUrl={imagePreview.url}
          fileName={imagePreview.fileName}
          onClose={() => setImagePreview(null)}
        />
      )}

      {pdfPreview && (
        <PDFPreviewModal
          pdfUrl={pdfPreview.url}
          fileName={pdfPreview.fileName}
          onClose={() => setPDFPreview(null)}
        />
      )}

      <DeleteConfirmationModal
        show={!!deleteConfirm}
        fileIds={deleteConfirm?.fileIds || []}
        fileName={deleteConfirm?.fileName || ''}
        onConfirm={() => handleDeleteFile(deleteConfirm?.fileIds, deleteConfirm?.fileName)}
        onCancel={() => setDeleteConfirm(null)}
        deleting={deletingFile}
      />
    </>
  )
}

export default React.memo(AttachmentManagerModal)
