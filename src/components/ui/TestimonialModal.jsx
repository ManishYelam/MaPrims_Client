import React, { useState, useEffect } from 'react'
import {
  X, Save, AlertCircle, Star, Tag, Link as LinkIcon,
  Users, Briefcase, Award, TrendingUp, Clock, User,
  Loader, BookOpen, Package, ChevronDown
} from 'lucide-react'
import { testimonialAPI } from '../../services/api'
import CourseSelectionModal from './CourseSelectionModal'
import ServiceSelectionModal from './ServiceSelectionModal'

const TestimonialModal = ({ show, testimonial, onClose, onSaved }) => {
  // ---------- Form state ----------
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    rating: 5,
    title: '',
    content: '',
    before_salary: '',
    after_salary: '',
    duration: '',
    technology: '',
    linkedin_url: '',
    avatar: '',
    status: 'pending',
    featured: false,
    display_order: 0,
    testimonial_type: 'general',
    testimonial_entity_id: null,
    metadata: {}
  })

  // For display of selected entity name + ID
  const [selectedEntityDisplay, setSelectedEntityDisplay] = useState('')

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Modal visibility states
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)

  // ---------- Reset form when modal opens ----------
  useEffect(() => {
    if (testimonial) {
      setFormData({
        name: testimonial.name || '',
        role: testimonial.role || '',
        company: testimonial.company || '',
        rating: testimonial.rating || 5,
        title: testimonial.title || '',
        content: testimonial.content || '',
        before_salary: testimonial.before_salary || '',
        after_salary: testimonial.after_salary || '',
        duration: testimonial.duration || '',
        technology: testimonial.technology || '',
        linkedin_url: testimonial.linkedin_url || '',
        avatar: testimonial.avatar || '',
        status: testimonial.status || 'pending',
        featured: testimonial.featured || false,
        display_order: testimonial.display_order || 0,
        testimonial_type: testimonial.testimonial_type || 'general',
        testimonial_entity_id: testimonial.testimonial_entity_id || null,
        metadata: testimonial.metadata || {}
      })
      // Build display string: name (ID: id) or just ID if no name
      const entityName = testimonial.metadata?.entity_name || ''
      const entityId = testimonial.testimonial_entity_id
      if (entityId) {
        if (entityName) {
          setSelectedEntityDisplay(`${entityName} (ID: ${entityId})`)
        } else {
          setSelectedEntityDisplay(`ID: ${entityId}`)
        }
      } else {
        setSelectedEntityDisplay('')
      }
    } else {
      setFormData({
        name: '', role: '', company: '', rating: 5, title: '', content: '',
        before_salary: '', after_salary: '', duration: '', technology: '',
        linkedin_url: '', avatar: '', status: 'pending', featured: false,
        display_order: 0, testimonial_type: 'general', testimonial_entity_id: null,
        metadata: {}
      })
      setSelectedEntityDisplay('')
    }
    setErrors({})
    setSaveError(null)
    setShowCourseModal(false)
    setShowServiceModal(false)
  }, [testimonial, show])

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'testimonial_type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        testimonial_entity_id: null
      }))
      setSelectedEntityDisplay('')
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleEntitySelect = (entity) => {
    if (!entity) return
    setFormData(prev => ({
      ...prev,
      testimonial_entity_id: entity.id
    }))
    // Store name and show with ID
    const name = entity.title || entity.name || `ID: ${entity.id}`
    setSelectedEntityDisplay(`${name} (ID: ${entity.id})`)
  }

  const openEntityModal = () => {
    if (formData.testimonial_type === 'course') {
      setShowCourseModal(true)
    } else if (formData.testimonial_type === 'service') {
      setShowServiceModal(true)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.content.trim()) newErrors.content = 'Content is required'
    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5'
    }
    if (formData.linkedin_url && !formData.linkedin_url.match(/^https?:\/\/.+/)) {
      newErrors.linkedin_url = 'Invalid URL format'
    }
    if (formData.testimonial_type !== 'general' && !formData.testimonial_entity_id) {
      newErrors.testimonial_entity_id = 'Please select an entity'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSaveError(null)

    try {
      const payload = {
        ...formData,
        rating: parseInt(formData.rating),
        display_order: parseInt(formData.display_order) || 0,
        testimonial_entity_id: formData.testimonial_entity_id
          ? parseInt(formData.testimonial_entity_id)
          : null,
        metadata: {
          ...formData.metadata,
          entity_name: selectedEntityDisplay // store full display or just name
        }
      }

      if (testimonial?.testimonial_id) {
        await testimonialAPI.update(testimonial.testimonial_id, payload)
      } else {
        await testimonialAPI.create(payload)
      }
      onSaved()
    } catch (err) {
      console.error('Error saving testimonial:', err)
      setSaveError(err.response?.data?.message || err.message || 'Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  // ---------- Render entity selection field ----------
  const renderEntityField = () => {
    const type = formData.testimonial_type
    if (type === 'general') return null

    const isCourse = type === 'course'
    const label = isCourse ? 'Course' : 'Service'
    const Icon = isCourse ? BookOpen : Package
    const placeholder = `Select ${label}`

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={openEntityModal}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${
            errors.testimonial_entity_id ? 'border-red-500' : 'border-gray-300'
          } hover:border-gray-400 transition-colors bg-white`}
          disabled={saving}
        >
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className={selectedEntityDisplay ? 'text-gray-700' : 'text-gray-400'}>
              {selectedEntityDisplay || placeholder}
            </span>
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {errors.testimonial_entity_id && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3"/> {errors.testimonial_entity_id}
          </p>
        )}
      </div>
    )
  }

  // ---------- Main render ----------
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold text-gray-900">
              {testimonial ? 'Edit Testimonial' : 'Create New Testimonial'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Name, Role, Company */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Full name" disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text" name="role" value={formData.role} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g., Senior Developer" disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text" name="company" value={formData.company} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Company name" disabled={saving}
                />
              </div>
            </div>

            {/* Rating and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" name="rating" value={formData.rating} onChange={handleChange}
                    min="1" max="5" className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    disabled={saving}
                  />
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {errors.rating && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3"/> {errors.rating}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Type</label>
                <select
                  name="testimonial_type"
                  value={formData.testimonial_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  disabled={saving}
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>

            {/* Entity selection – rendered as button with modal */}
            {renderEntityField()}

            {/* Title & Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text" name="title" value={formData.title} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Short headline" disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content" rows="4" value={formData.content} onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Testimonial text..." disabled={saving}
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> {errors.content}
                </p>
              )}
            </div>

            {/* Salary and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Before Salary</label>
                <input
                  type="text" name="before_salary" value={formData.before_salary} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g., ₹5 LPA" disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">After Salary</label>
                <input
                  type="text" name="after_salary" value={formData.after_salary} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g., ₹12 LPA" disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text" name="duration" value={formData.duration} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g., 3 months" disabled={saving}
                />
              </div>
            </div>

            {/* Technology and LinkedIn URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                <input
                  type="text" name="technology" value={formData.technology} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g., SAP, React" disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm ${
                    errors.linkedin_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://linkedin.com/in/username" disabled={saving}
                />
                {errors.linkedin_url && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3"/> {errors.linkedin_url}
                  </p>
                )}
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (image)</label>
              <input
                type="url" name="avatar" value={formData.avatar} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="https://example.com/avatar.jpg" disabled={saving}
              />
            </div>

            {/* Status and Featured */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  disabled={saving}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox" name="featured" checked={formData.featured} onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={saving}
                  />
                  Featured
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number" name="display_order" value={formData.display_order} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="0" disabled={saving}
                />
              </div>
            </div>

            {/* Metadata (JSON) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
              <textarea
                name="metadata" rows="2"
                value={JSON.stringify(formData.metadata, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData(prev => ({ ...prev, metadata: JSON.parse(e.target.value) }))
                  } catch {
                    // ignore invalid JSON, or you could keep as string
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                placeholder='{"key": "value"}'
                disabled={saving}
              />
            </div>

            {/* Save Error */}
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4"/> {saveError}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {saving ? 'Saving...' : (testimonial ? 'Update Testimonial' : 'Create Testimonial')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Selection Modals */}
      <CourseSelectionModal
        show={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSelect={handleEntitySelect}
        selectedCourseId={formData.testimonial_entity_id}
      />
      <ServiceSelectionModal
        show={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSelect={handleEntitySelect}
        selectedServiceId={formData.testimonial_entity_id}
      />
    </>
  )
}

export default TestimonialModal