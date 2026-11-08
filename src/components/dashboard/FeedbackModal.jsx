// src/components/dashboard/FeedbackModal.jsx
import React, { useState, useEffect } from 'react'
import {
  X,
  Star,
  User,
  Mail,
  Calendar,
  Clock,
  Tag,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  XCircle,
  Bug,
  Zap,
  Lightbulb,
  Settings,
  FileText,
  Globe,
  Monitor,
  MapPin,
  Send,
  Smartphone,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { feedbackAPI } from '../../services/api'

const FeedbackModal = ({ show, feedback, onClose, onSaved, isAdmin = false }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedFeedback, setEditedFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // New feedback form state
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    category: 'general',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if this is for new feedback (feedback prop is null)
  const isNewFeedback = feedback === null

  // Initialize states when modal opens
  useEffect(() => {
    if (isNewFeedback) {
      setNewFeedback({
        rating: 5,
        category: 'general',
        message: '',
      })
    } else {
      setEditedFeedback(feedback ? { ...feedback } : null)
    }
    setIsEditing(false)
    setSaveStatus(null)
  }, [feedback, show, isNewFeedback])

  // Enhanced status options with icons
  const statusOptions = [
    {
      value: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      icon: Clock,
      description: 'New, unprocessed feedback',
    },
    {
      value: 'reviewed',
      label: 'Reviewed',
      color: 'bg-blue-100 text-blue-800 border border-blue-200',
      icon: AlertCircle,
      description: 'Feedback has been read and acknowledged',
    },
    {
      value: 'in_progress',
      label: 'In Progress',
      color: 'bg-orange-100 text-orange-800 border border-orange-200',
      icon: Settings,
      description: 'Working on the feedback item',
    },
    {
      value: 'resolved',
      label: 'Resolved',
      color: 'bg-green-100 text-green-800 border border-green-200',
      icon: CheckCircle,
      description: 'Feedback has been addressed',
    },
    {
      value: 'closed',
      label: 'Closed',
      color: 'bg-gray-100 text-gray-800 border border-gray-200',
      icon: X,
      description: 'No further action needed',
    },
  ]

  // Enhanced category options with icons and colors
  const categoryOptions = {
    general: {
      label: 'General',
      icon: MessageCircle,
      color: 'bg-gray-100 text-gray-800 border border-gray-200',
      description: 'General feedback or comments',
    },
    bug: {
      label: 'Bug Report',
      icon: Bug,
      color: 'bg-red-100 text-red-800 border border-red-200',
      description: 'Report an issue or bug',
    },
    feature: {
      label: 'Feature Request',
      icon: Lightbulb,
      color: 'bg-purple-100 text-purple-800 border border-purple-200',
      description: 'Suggest a new feature',
    },
    ui: {
      label: 'UI/UX',
      icon: Monitor,
      color: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      description: 'User interface or experience feedback',
    },
    performance: {
      label: 'Performance',
      icon: Zap,
      color: 'bg-teal-100 text-teal-800 border border-teal-200',
      description: 'Performance-related issues',
    },
  }

  if (!show) return null

  // Handle input changes for new feedback
  const handleNewInputChange = (field, value) => {
    setNewFeedback(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle rating change for new feedback
  const handleNewRatingChange = rating => {
    setNewFeedback(prev => ({
      ...prev,
      rating: rating,
    }))
  }

  // Submit new feedback
  const handleSubmitNewFeedback = async () => {
    if (!newFeedback.message.trim() || newFeedback.message.length < 10) {
      setSaveStatus({
        type: 'error',
        message: 'Please enter at least 10 characters for your feedback.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      setSaveStatus(null)

      const feedbackData = {
        rating: newFeedback.rating,
        category: newFeedback.category,
        message: newFeedback.message.trim(),
      }

      const response = await feedbackAPI.submitFeedback(feedbackData)

      if (response.data?.success || response.success) {
        setSaveStatus({
          type: 'success',
          message: response.data?.message || response.message || 'Thank you for your feedback!',
        })

        // Reset form
        setNewFeedback({
          rating: 5,
          category: 'general',
          message: '',
        })

        // Close modal after success
        setTimeout(() => {
          onSaved()
          onClose()
        }, 1500)
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to submit feedback.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSaveStatus({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to submit feedback. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes for existing feedback (admin editing)
  const handleInputChange = (field, value) => {
    setEditedFeedback(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle status change for existing feedback
  const handleStatusChange = async newStatus => {
    if (!isAdmin) return

    try {
      setIsSaving(true)
      const response = await feedbackAPI.updateFeedbackStatus(feedback.feedback_id, newStatus)

      if (response.data?.success || response.success) {
        setSaveStatus({ type: 'success', message: 'Status updated successfully' })
        onSaved()
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
      setSaveStatus({ type: 'error', message: error.message || 'Failed to update status' })
    } finally {
      setIsSaving(false)
    }
  }

  // Enhanced save function for admin notes and status
  const handleSave = async () => {
    if (!isAdmin || !editedFeedback) return

    try {
      setIsSaving(true)
      const response = await feedbackAPI.updateFeedbackStatus(
        feedback.feedback_id,
        editedFeedback.status,
        editedFeedback.admin_notes || ''
      )

      if (response.data?.success || response.success) {
        setSaveStatus({ type: 'success', message: 'Feedback updated successfully' })
        setIsEditing(false)
        onSaved()
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to update feedback')
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      setSaveStatus({ type: 'error', message: error.message || 'Failed to update feedback' })
    } finally {
      setIsSaving(false)
    }
  }

  // Get category info
  const categoryInfo =
    categoryOptions[isNewFeedback ? newFeedback.category : feedback?.category || 'general'] ||
    categoryOptions.general

  // Enhanced format date function
  const formatDate = dateString => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Enhanced render stars function - compact version
  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type={interactive ? 'button' : undefined}
        onClick={interactive ? () => onStarClick(i + 1) : undefined}
        className={`transition-all ${
          interactive ? 'transform hover:scale-110 cursor-pointer' : 'cursor-default'
        } ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        disabled={!interactive}
      >
        <Star className={`w-4 h-4 ${i < rating ? 'fill-current' : ''}`} />
      </button>
    ))
  }

  // Get status info with enhanced data
  const getStatusInfo = status => {
    const statusOption = statusOptions.find(s => s.value === status) || statusOptions[0]
    return statusOption
  }

  const statusInfo = getStatusInfo(feedback?.status || 'pending')
  const StatusIcon = statusInfo.icon

  // Enhanced device detection
  const detectDevice = userAgent => {
    if (!userAgent) return 'Unknown'

    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      return 'Mobile'
    } else if (/Tablet/i.test(userAgent)) {
      return 'Tablet'
    } else {
      return 'Desktop'
    }
  }

  // Enhanced browser detection
  const detectBrowser = userAgent => {
    if (!userAgent) return 'Unknown'

    if (/Chrome/i.test(userAgent)) return 'Chrome'
    if (/Firefox/i.test(userAgent)) return 'Firefox'
    if (/Safari/i.test(userAgent)) return 'Safari'
    if (/Edge/i.test(userAgent)) return 'Edge'
    if (/Opera/i.test(userAgent)) return 'Opera'
    return 'Unknown'
  }

  // Safe URL parsing function
  const getPageUrlInfo = pageUrl => {
    if (!pageUrl) return { display: 'No page URL', isValid: false }

    try {
      const url = new URL(pageUrl)
      return {
        display: url.pathname || 'Home',
        fullUrl: pageUrl,
        isValid: true,
      }
    } catch (error) {
      // If it's not a valid URL, try to extract path from string
      const pathMatch = pageUrl.match(/\/([^?#]*)/)
      return {
        display: pathMatch ? pathMatch[0] : 'Invalid URL',
        fullUrl: pageUrl,
        isValid: false,
      }
    }
  }

  // Compact New Feedback Form
  const renderNewFeedbackForm = () => (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="text-center">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <MessageCircle className="w-5 h-5 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Share Your Feedback</h3>
        <p className="text-xs text-gray-600 mt-1">Help us improve by sharing your thoughts</p>
      </div>

      {/* Rating - Compact */}
      <div className="bg-gray-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          How would you rate your experience? *
        </label>
        <div className="flex items-center gap-3">
          {renderStars(newFeedback.rating, true, handleNewRatingChange)}
          <span className="text-xs text-gray-600">{newFeedback.rating}/5</span>
        </div>
      </div>

      {/* Category - Compact */}
      <div className="bg-gray-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">Category *</label>
        <select
          value={newFeedback.category}
          onChange={e => handleNewInputChange('category', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
          required
        >
          {Object.entries(categoryOptions).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message - Compact */}
      <div className="bg-gray-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">Your Feedback *</label>
        <textarea
          value={newFeedback.message}
          onChange={e => handleNewInputChange('message', e.target.value)}
          rows={4}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="Please share your detailed feedback, suggestions, or any issues you've encountered. Minimum 10 characters required."
          minLength={10}
          maxLength={1000}
          required
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">Min. 10 characters</p>
          <div className="text-xs text-gray-500">{newFeedback.message.length}/1000</div>
        </div>
      </div>
    </div>
  )

  // Render existing feedback view - Compact version
  const renderExistingFeedback = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* User & Basic Info - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              User Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {feedback.user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {feedback.user?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-600">{feedback.user?.role || 'User'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Mail className="w-3.5 h-3.5" />
                <a
                  href={`mailto:${feedback.user?.email}`}
                  className="text-primary-600 hover:text-primary-700 truncate"
                  title={feedback.user?.email}
                >
                  {feedback.user?.email || 'No email provided'}
                </a>
              </div>
            </div>
          </div>

          {/* Feedback Meta - Compact */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Feedback Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Status</span>
                {isAdmin && isEditing ? (
                  <select
                    value={editedFeedback?.status || 'pending'}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-2 py-1 bg-white border border-gray-300"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Category</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}
                >
                  <categoryInfo.icon className="w-3 h-3" />
                  {categoryInfo.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Rating</span>
                <div className="flex items-center gap-1">
                  {renderStars(feedback.rating)}
                  <span className="text-xs text-gray-500 ml-1">({feedback.rating}/5)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message - Compact */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Feedback Message
          </h3>
          {isEditing ? (
            <textarea
              value={editedFeedback?.message || ''}
              onChange={e => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter feedback message..."
            />
          ) : (
            <div className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2 border border-gray-100">
              {feedback.message}
            </div>
          )}
        </div>

        {/* Admin Notes (Admin only) - Compact */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              Admin Notes & Response
            </h3>
            {isEditing ? (
              <>
                <textarea
                  value={editedFeedback?.admin_notes || ''}
                  onChange={e => handleInputChange('admin_notes', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your notes, response, or action taken for this feedback..."
                />
                <p className="text-xs text-blue-600 mt-1">
                  These notes are for internal use and won't be shared with the user.
                </p>
              </>
            ) : (
              <div className="text-xs text-blue-800 whitespace-pre-wrap bg-blue-100 rounded p-2 border border-blue-200">
                {feedback.admin_notes || 'No admin notes yet.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar - Compact Technical & Timeline Info */}
      <div className="space-y-4">
        {/* Timeline */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Timeline
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600">Submitted</p>
              <p className="text-xs font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(feedback.createdAt)}
              </p>
            </div>
            {feedback.updatedAt !== feedback.createdAt && (
              <div>
                <p className="text-xs text-gray-600">Last Updated</p>
                <p className="text-xs font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(feedback.updatedAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Information - Compact */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" />
            Technical Information
          </h3>
          <div className="space-y-2">
            {feedback.user_agent && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Device</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    <Smartphone className="w-3 h-3" />
                    {detectDevice(feedback.user_agent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Browser</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    <Globe className="w-3 h-3" />
                    {detectBrowser(feedback.user_agent)}
                  </span>
                </div>
              </>
            )}

            {feedback.page_url && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Page</span>
                <div className="flex items-center gap-1">
                  {getPageUrlInfo(feedback.page_url).isValid ? (
                    <a
                      href={feedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 truncate max-w-[100px] flex items-center gap-0.5"
                      title={feedback.page_url}
                    >
                      {getPageUrlInfo(feedback.page_url).display}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span
                      className="text-xs text-gray-500 truncate max-w-[100px]"
                      title={feedback.page_url}
                    >
                      {getPageUrlInfo(feedback.page_url).display}
                    </span>
                  )}
                </div>
              </div>
            )}

            {feedback.metadata?.ipAddress && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">IP Address</span>
                <span className="text-xs text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {feedback.metadata.ipAddress}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Admin only) - Compact */}
        {isAdmin && !isEditing && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-primary-900 mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  disabled={isSaving || feedback.status === status.value}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    feedback.status === status.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-primary-100 border border-primary-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <status.icon className="w-3 h-3" />
                  Mark as {status.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Additional Metadata */}
        {feedback.metadata && Object.keys(feedback.metadata).length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Additional Information</h3>
            <div className="text-xs text-gray-600">
              <pre className="bg-white p-1.5 rounded border overflow-x-auto max-h-24 text-xs">
                {JSON.stringify(feedback.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-h-[80vh] overflow-hidden ${
          isNewFeedback ? 'max-w-md' : 'max-w-5xl'
        }`}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${isNewFeedback ? 'bg-primary-100' : 'bg-primary-500'}`}>
              {isNewFeedback ? (
                <Plus className="w-4 h-4 text-primary-600" />
              ) : (
                <MessageCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isNewFeedback ? 'Submit New Feedback' : 'Feedback Details'}
              </h2>
              {!isNewFeedback && (
                <p className="text-xs text-gray-600">ID: {feedback.feedback_id}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isNewFeedback && isAdmin && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded transition-colors ${
                  isEditing
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isEditing ? 'Cancel Editing' : 'Edit Feedback'}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save Status - Compact */}
        {saveStatus && (
          <div
            className={`mx-4 mt-3 p-2 rounded border text-xs ${
              saveStatus.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {saveStatus.type === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">{saveStatus.message}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4">
          {isNewFeedback ? renderNewFeedbackForm() : renderExistingFeedback()}
        </div>

        {/* Compact Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          {!isNewFeedback && (
            <div className="text-xs text-gray-600">
              ID:{' '}
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                {feedback.feedback_id}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {isNewFeedback ? 'Cancel' : isEditing ? 'Cancel' : 'Close'}
            </button>

            {isNewFeedback ? (
              <button
                onClick={handleSubmitNewFeedback}
                disabled={isSubmitting || newFeedback.message.length < 10}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Submit
                  </>
                )}
              </button>
            ) : (
              isAdmin &&
              isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Save Changes
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackModal
