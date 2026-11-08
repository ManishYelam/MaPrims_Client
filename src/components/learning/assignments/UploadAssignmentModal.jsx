import React, { useState, useRef } from 'react'
import { Icon } from '../common/Icon'

export const UploadAssignmentModal = ({ assignment, isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = e => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (assignment.max_file_size && selectedFile.size > assignment.max_file_size * 1024 * 1024) {
        alert(`File size exceeds maximum allowed size of ${assignment.max_file_size}MB`)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file to upload')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('assignment_id', assignment.assignment_id)
      formData.append('file', file)
      formData.append('notes', notes)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockResponse = {
        success: true,
        data: {
          submission_id: Date.now(),
          submitted_at: new Date().toISOString(),
          file_name: file.name,
          file_size: file.size,
          status: 'submitted',
        },
      }

      alert('Assignment submitted successfully!')
      onSubmit(mockResponse.data)
      onClose()
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Failed to submit assignment. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Submit Assignment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icon name="X" className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{assignment.title}</h4>
            <p className="text-sm text-gray-600 mb-4">
              Please upload your completed assignment file.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Work</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary-500'
              }`}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={assignment.submission_format || '*'}
              />
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="CheckCircle" className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Icon name="Upload" className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {assignment.submission_format || 'ZIP, PDF, DOC, TXT'} up to{' '}
                    {assignment.max_file_size || 50}MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="3"
              placeholder="Add any comments about your submission..."
            />
          </div>

          {assignment.submission_guidelines && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Submission Guidelines:</h5>
              <p className="text-xs text-gray-600">{assignment.submission_guidelines}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                !file || isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
