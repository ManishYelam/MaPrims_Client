import React, { useState, useEffect, useContext, useCallback, lazy, Suspense } from 'react'
import { X, Users, BookOpen, Package, AlertCircle, Lock } from 'lucide-react'
import { AuthContext } from '../../context/AuthContext'
import { supportAPI } from '../../services/api'

const CourseSelectionModal = lazy(() => import('../ui/CourseSelectionModal'))
const ServiceSelectionModal = lazy(() => import('../ui/ServiceSelectionModal'))
const UserSelectionModal = lazy(() => import('../ui/UserSelectionModal'))

const TicketModal = ({ show, ticket, onClose, onSaved }) => {
  const { user } = useContext(AuthContext)
  const userData = user?.user
  const isAdmin = userData?.role === 'admin'
  const isEditing = !!ticket

  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: '',
    course_id: '',
    service_id: '',
    assigned_to: '',
    status: 'open',
  })

  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const fetchTicketDetails = useCallback(async () => {
    if (!ticket || !ticket.support_ticket_id) return
    try {
      const response = await supportAPI.getTicket(ticket.support_ticket_id)
      if (response.data?.success) {
        setFormData(prev => ({
          ...prev,
          assigned_to: response.data.data?.assigned_to || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error)
    }
  }, [ticket])

  useEffect(() => {
    if (ticket) {
      const baseData = {
        subject: ticket.subject || '',
        category: ticket.category || 'general',
        priority: ticket.priority || 'medium',
        description: ticket.description || ticket.message || '',
        course_id: ticket.course_id || '',
        service_id: ticket.service_id || '',
        assigned_to: ticket.assigned_to || '',
        status: ticket.status || 'open',
      }

      setFormData(baseData)

      if (ticket.course_id) {
        setSelectedCourse({
          id: ticket.course_id,
          title: ticket.course_title || `Course ${ticket.course_id}`,
        })
      }
      if (ticket.service_id) {
        setSelectedService({
          id: ticket.service_id,
          name: ticket.service_name || `Service ${ticket.service_id}`,
        })
      }

      if (isAdmin && ticket.support_ticket_id) {
        fetchTicketDetails()
      }
    } else {
      setFormData({
        subject: '',
        category: 'general',
        priority: 'medium',
        description: '',
        course_id: '',
        service_id: '',
        assigned_to: '',
        status: 'open',
      })
      setSelectedCourse(null)
      setSelectedService(null)
      setSelectedUser(null)
    }
    setErrors({})
  }, [ticket, show, isAdmin, fetchTicketDetails])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleCourseSelect = course => {
    setSelectedCourse(course)
    setFormData(prev => ({ ...prev, course_id: course.id, service_id: '' }))
    setSelectedService(null)
  }

  const handleClearCourse = () => {
    setSelectedCourse(null)
    setFormData(prev => ({ ...prev, course_id: '' }))
  }

  const handleServiceSelect = service => {
    setSelectedService(service)
    setFormData(prev => ({ ...prev, service_id: service.id, course_id: '' }))
    setSelectedCourse(null)
  }

  const handleClearService = () => {
    setSelectedService(null)
    setFormData(prev => ({ ...prev, service_id: '' }))
  }

  const handleUserSelect = user => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, assigned_to: user.id.toString() }))
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setFormData(prev => ({ ...prev, assigned_to: '' }))
  }

  const handleAssignedToManualInput = e => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, assigned_to: value }))
      if (selectedUser && selectedUser.id.toString() !== value) {
        setSelectedUser(null)
      }
      if (errors.assigned_to) {
        setErrors(prev => ({ ...prev, assigned_to: '' }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    else if (formData.subject.trim().length < 5) newErrors.subject = 'At least 5 characters'

    if (!formData.description.trim()) newErrors.description = 'Description is required'
    else if (formData.description.trim().length < 10)
      newErrors.description = 'At least 10 characters'

    const validCategories = ['general', 'technical', 'billing', 'feature', 'bug', 'course_related']
    if (!formData.category || !validCategories.includes(formData.category)) {
      newErrors.category = 'Invalid category'
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!formData.priority || !validPriorities.includes(formData.priority)) {
      newErrors.priority = 'Invalid priority'
    }

    if (!isEditing && formData.course_id && !/^\d+$/.test(formData.course_id)) {
      newErrors.course_id = 'Must be a number'
    }
    if (!isEditing && formData.service_id && !/^\d+$/.test(formData.service_id)) {
      newErrors.service_id = 'Must be a number'
    }
    if (!isEditing && formData.course_id && formData.service_id) {
      newErrors.course_id = 'Cannot select both course and service'
      newErrors.service_id = 'Cannot select both course and service'
    }

    if (formData.assigned_to && !/^\d+$/.test(formData.assigned_to)) {
      newErrors.assigned_to = 'Must be a number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const prepareApiData = () => {
    const apiData = {
      subject: formData.subject.trim(),
      category: formData.category,
      priority: formData.priority,
      description: formData.description.trim(),
    }

    if (!isEditing) {
      if (formData.course_id) apiData.course_id = parseInt(formData.course_id)
      if (formData.service_id) apiData.service_id = parseInt(formData.service_id)
    }

    if (formData.assigned_to) apiData.assigned_to = parseInt(formData.assigned_to)
    if (isAdmin && isEditing && formData.status) apiData.status = formData.status

    return apiData
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const apiData = prepareApiData()
      if (isEditing) {
        await supportAPI.updateTicket(ticket.support_ticket_id, apiData)
      } else {
        await supportAPI.createTicket(apiData)
      }
      onSaved()
      onClose()
    } catch (error) {
      console.error('Error saving ticket:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save ticket'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = priority => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[priority] || colors.medium
  }

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isEditing ? 'Edit Ticket' : 'New Ticket'}
              </h2>
              {isEditing && ticket?.id && (
                <p className="text-xs text-gray-500">
                  ID: <span className="font-mono">#{ticket.id}</span>
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {errors.submit && (
            <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.subject ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Brief description"
                  maxLength={200}
                />
                {errors.subject && <p className="text-red-600 text-xs mt-0.5">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="general">General Inquiry</option>
                  <option value="feedback">Feedback & Suggestions</option>
                  <option value="account">Account Issues</option>
                  <option value="technical">Technical Support</option>
                  <option value="login">Login/Access Issues</option>
                  <option value="performance">Performance Issues</option>
                  <option value="mobile_app">Mobile App Issues</option>
                  <option value="browser">Browser Compatibility</option>
                  <option value="bug">Bug Report</option>
                  <option value="course_related">Course Related</option>
                  <option value="content_issue">Content Issues</option>
                  <option value="certificate">Certificate Problems</option>
                  <option value="progress">Progress Tracking</option>
                  <option value="assessment">Assessment Issues</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="refund">Refund Request</option>
                  <option value="subscription">Subscription Management</option>
                  <option value="promo_code">Promo Code Issues</option>
                  <option value="feature">Feature Request</option>
                  <option value="requirements">Requirements & Planning</option>
                  <option value="customization">Customization Request</option>
                  <option value="ui_ux">UI/UX Feedback</option>
                  <option value="accessibility">Accessibility Issues</option>
                  <option value="privacy">Privacy Concerns</option>
                  <option value="data_request">Data Request</option>
                  <option value="gdpr">GDPR/Compliance</option>
                  <option value="instructor">Instructor Communication</option>
                  <option value="group_work">Group Work Issues</option>
                  <option value="upload">File Upload Issues</option>
                  <option value="media">Media Playback</option>
                  <option value="download">Download Problems</option>
                  <option value="integration">Third-party Integration</option>
                  <option value="api">API Issues</option>
                  <option value="webhook">Webhook Configuration</option>
                  <option value="setup">Setup & Configuration</option>
                  <option value="onboarding">Onboarding Assistance</option>
                  <option value="migration">Data Migration</option>
                  <option value="admin_request">Admin Request</option>
                  <option value="moderation">Content Moderation</option>
                  <option value="permissions">Permissions & Roles</option>
                  <option value="urgent">Urgent Issue</option>
                  <option value="security">Security Concern</option>
                  <option value="outage">Service Outage</option>
                  <option value="requirements_analysis">Requirements Analysis</option>
                  <option value="scope_clarification">Scope Clarification</option>
                  <option value="project_planning">Project Planning</option>
                  <option value="timeline">Timeline Questions</option>
                  <option value="milestone">Milestone Review</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-600 text-xs mt-0.5">{errors.category}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.priority ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {errors.priority && (
                  <p className="text-red-600 text-xs mt-0.5">{errors.priority}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Related Course {!isEditing && '(Optional)'}
                  {isEditing && (
                    <span className="ml-1 text-gray-400">
                      <Lock className="w-3 h-3 inline ml-0.5" />
                    </span>
                  )}
                </label>
                <div className="space-y-1.5">
                  {isEditing ? (
                    <div className="w-full px-2 py-1.5 border rounded text-xs bg-gray-50 border-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">
                            {selectedCourse ? selectedCourse.title : 'No course selected'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {selectedCourse ? `ID: #${selectedCourse.id}` : 'Cannot be changed'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            name="course_id"
                            value={formData.course_id}
                            onChange={handleChange}
                            className={`w-full px-2 py-1.5 pl-8 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.course_id ? 'border-red-300' : 'border-gray-300'} ${selectedService ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Select course"
                            readOnly
                            disabled={!!selectedService}
                          />
                          <BookOpen className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCourseModal(true)}
                          disabled={!!selectedService}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded ${selectedService ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100'}`}
                        >
                          Browse
                        </button>
                      </div>
                      {selectedCourse && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 truncate">
                                {selectedCourse.title}
                              </h4>
                              <p className="text-xs text-gray-500">ID: #{selectedCourse.id}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearCourse}
                              className="text-xs text-red-600 hover:text-red-800 ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {errors.course_id && (
                        <p className="text-red-600 text-xs mt-0.5">{errors.course_id}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Related Service {!isEditing && '(Optional)'}
                  {isEditing && (
                    <span className="ml-1 text-gray-400">
                      <Lock className="w-3 h-3 inline ml-0.5" />
                    </span>
                  )}
                </label>
                <div className="space-y-1.5">
                  {isEditing ? (
                    <div className="w-full px-2 py-1.5 border rounded text-xs bg-gray-50 border-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">
                            {selectedService ? selectedService.name : 'No service selected'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {selectedService ? `ID: #${selectedService.id}` : 'Cannot be changed'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            name="service_id"
                            value={formData.service_id}
                            onChange={handleChange}
                            className={`w-full px-2 py-1.5 pl-8 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.service_id ? 'border-red-300' : 'border-gray-300'} ${selectedCourse ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Select service"
                            readOnly
                            disabled={!!selectedCourse}
                          />
                          <Package className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowServiceModal(true)}
                          disabled={!!selectedCourse}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded ${selectedCourse ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100'}`}
                        >
                          Browse
                        </button>
                      </div>
                      {selectedService && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 truncate">
                                {selectedService.name}
                              </h4>
                              <p className="text-xs text-gray-500">ID: #{selectedService.id}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearService}
                              className="text-xs text-red-600 hover:text-red-800 ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {errors.service_id && (
                        <p className="text-red-600 text-xs mt-0.5">{errors.service_id}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && isEditing && (
              <div className="border border-gray-200 rounded p-3 bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Assignment
                </h3>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Assign To (User ID)
                      </label>
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              name="assigned_to"
                              value={formData.assigned_to}
                              onChange={handleAssignedToManualInput}
                              className={`w-full px-2 py-1.5 pl-8 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.assigned_to ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Enter user ID"
                              maxLength={10}
                            />
                            <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowUserModal(true)}
                            className="px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100"
                          >
                            Browse
                          </button>
                        </div>

                        {selectedUser && (
                          <div className="p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Users className="w-3 h-3 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900">
                                    {selectedUser.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">ID: #{selectedUser.id}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearUser}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.assigned_to && (
                        <p className="text-red-600 text-xs mt-0.5">{errors.assigned_to}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Provide detailed information about your issue..."
              />
              {errors.description && (
                <p className="text-red-600 text-xs mt-0.5">{errors.description}</p>
              )}
            </div>
          </form>

          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {isEditing ? 'Update ticket' : 'Create ticket'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 text-xs font-medium text-white rounded flex items-center gap-1.5 ${isSubmitting ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {isSubmitting && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSubmitting
                    ? isEditing
                      ? 'Saving...'
                      : 'Creating...'
                    : isEditing
                      ? 'Save'
                      : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isEditing && showCourseModal && (
        <Suspense fallback={null}>
          <CourseSelectionModal
            show={showCourseModal}
            onClose={() => setShowCourseModal(false)}
            onSelect={handleCourseSelect}
            selectedCourseId={formData.course_id}
          />
        </Suspense>
      )}

      {!isEditing && showServiceModal && (
        <Suspense fallback={null}>
          <ServiceSelectionModal
            show={showServiceModal}
            onClose={() => setShowServiceModal(false)}
            onSelect={handleServiceSelect}
            selectedServiceId={formData.service_id}
          />
        </Suspense>
      )}

      {showUserModal && (
        <Suspense fallback={null}>
          <UserSelectionModal
            show={showUserModal}
            onClose={() => setShowUserModal(false)}
            onSelect={handleUserSelect}
            selectedUserId={formData.assigned_to}
            allowedRoles={['admin']}
          />
        </Suspense>
      )}
    </>
  )
}

export default TicketModal