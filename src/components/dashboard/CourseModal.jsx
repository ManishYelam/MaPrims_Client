// src/pages/dashboard/components/CourseModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Save,
  Send,
  FileArchive,
  BookOpen,
  Clock,
  SlidersHorizontal,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Trash2,
  Upload as UploadIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  Code,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { FaFilePdf } from 'react-icons/fa6'
import { coursesAPI } from '../../services/api'
import toast from 'react-hot-toast'

const CourseModal = ({ show, course, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false)
  const [syllabusFile, setSyllabusFile] = useState(null)
  const [syllabusPreview, setSyllabusPreview] = useState(null)
  const [shouldRemoveSyllabus, setShouldRemoveSyllabus] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)
  const [jsonError, setJsonError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [metadataLoading, setMetadataLoading] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    duration: '',
    fee: '',
    original_fee: '',
    mode: 'online_live',
    level: 'beginner',
    featured: false,
    seats_available: '',
    thumbnail_image: '',
    status: 'draft',
    syllabus_pdf: '',
    metadata: '',
  })

  const defaultMetadata = `{
  "modules": [
    "Introduction to SAP and ABAP",
    "ABAP Data Types and Variables",
    "Internal Tables and Work Areas",
    "Modularization Techniques",
    "Debugging and Error Handling"
  ],
  "curriculum": [
    {
      "module": "Introduction",
      "topics": [
        "SAP Architecture",
        "ABAP Workbench",
        "First ABAP Program"
      ]
    },
    {
      "module": "Data Types",
      "topics": [
        "Elementary Data Types",
        "Complex Data Types",
        "Type Groups"
      ]
    }
  ],
  "prerequisites": [
    "Basic programming knowledge",
    "Understanding of database concepts",
    "No prior SAP experience required"
  ],
  "learning_objectives": [
    "Write basic ABAP programs",
    "Understand SAP data dictionary",
    "Create reports using internal tables",
    "Implement modularization techniques",
    "Debug and troubleshoot ABAP code"
  ]
}`

  const levels = [
    { value: 'beginner', label: 'Beginner', icon: BookOpen },
    { value: 'intermediate', label: 'Intermediate', icon: TrendingUp },
    { value: 'advanced', label: 'Advanced', icon: Zap },
  ]

  const modes = [
    { value: 'online_live', label: 'Live Online', icon: Clock },
    { value: 'online_self_paced', label: 'Self Paced', icon: BookOpen },
    { value: 'hybrid', label: 'Hybrid', icon: SlidersHorizontal },
  ]

  const validateJSON = useCallback(jsonString => {
    try {
      if (!jsonString || jsonString.trim() === '') {
        setJsonError(null)
        return true
      }

      const parsed = JSON.parse(jsonString)

      if (typeof parsed !== 'object') {
        setJsonError('Metadata must be a JSON object')
        return false
      }

      setJsonError(null)
      return true
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`)
      return false
    }
  }, [])

  // Function to fetch metadata by course ID
  const fetchCourseMetadata = useCallback(async courseId => {
    if (!courseId) return null

    try {
      setMetadataLoading(true)
      const response = await coursesAPI.getCourseMetaDataById(courseId)

      if (response.data?.success) {
        const metadata = response.data.data
        return metadata
      } else {
        toast.error(response.data?.error || 'Failed to fetch metadata')
        return null
      }
    } catch (error) {
      console.error('Error fetching course metadata:', error)
      toast.error('Failed to fetch metadata')
      return null
    } finally {
      setMetadataLoading(false)
    }
  }, [])

  const isSyllabusValid = useCallback(() => {
    if (course) {
      return (formData.syllabus_pdf && !shouldRemoveSyllabus) || syllabusFile
    }
    return syllabusFile
  }, [course, formData.syllabus_pdf, shouldRemoveSyllabus, syllabusFile])

  // Function to fetch and load metadata when in edit mode
  const loadCourseMetadata = useCallback(async () => {
    if (!course?.course_id) return

    try {
      const metadata = await fetchCourseMetadata(course.course_id)

      if (metadata) {
        // Convert metadata object to formatted JSON string
        const metadataString = JSON.stringify(metadata, null, 2)
        setFormData(prev => ({ ...prev, metadata: metadataString }))
        validateJSON(metadataString)
        toast.success('Metadata loaded successfully')
      }
    } catch (error) {
      console.error('Error loading metadata:', error)
    }
  }, [course?.course_id, fetchCourseMetadata, validateJSON])

  useEffect(() => {
    if (course) {
      // Set basic form data
      setFormData({
        title: course.title || '',
        description: course.description || '',
        short_description: course.short_description || '',
        duration: course.duration || '',
        fee: course.fee || '',
        original_fee: course.original_fee || '',
        mode: course.mode || 'online_live',
        level: course.level || 'beginner',
        featured: course.featured || false,
        seats_available: course.seats_available || '',
        thumbnail_image: course.thumbnail_image || '',
        syllabus_pdf: course.syllabus_pdf || '',
        status: course.status || 'draft',
        metadata: course.metadata
          ? (() => {
              try {
                if (typeof course.metadata === 'string') {
                  const parsed = JSON.parse(course.metadata)
                  return JSON.stringify(parsed, null, 2)
                } else if (typeof course.metadata === 'object') {
                  return JSON.stringify(course.metadata, null, 2)
                }
              } catch (error) {
                console.error('Error parsing metadata:', error)
              }
              return ''
            })()
          : '',
      })

      if (course.syllabus_pdf) setSyllabusPreview(course.syllabus_pdf)
      setShouldRemoveSyllabus(false)
      setValidationErrors({})
    } else {
      setFormData({
        title: '',
        description: '',
        short_description: '',
        duration: '',
        fee: '',
        original_fee: '',
        mode: 'online_live',
        level: 'beginner',
        featured: false,
        seats_available: '',
        thumbnail_image: '',
        syllabus_pdf: '',
        status: 'draft',
        metadata: defaultMetadata,
      })
      setSyllabusFile(null)
      setSyllabusPreview(null)
      setShouldRemoveSyllabus(false)
      setJsonError(null)
      setValidationErrors({})
      setMetadataLoading(false)
    }
  }, [course, defaultMetadata])

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))

      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }

      if (field === 'metadata') {
        validateJSON(value)
      }
    },
    [validateJSON, validationErrors]
  )

  const formatJSON = useCallback(() => {
    if (!formData.metadata || formData.metadata.trim() === '') {
      setFormData(prev => ({ ...prev, metadata: '{}' }))
      return
    }

    try {
      const parsed = JSON.parse(formData.metadata)
      const formatted = JSON.stringify(parsed, null, 2)
      setFormData(prev => ({ ...prev, metadata: formatted }))
      setJsonError(null)
      toast.success('JSON formatted successfully')
    } catch (error) {
      setJsonError(`Cannot format: ${error.message}`)
      toast.error('Invalid JSON - cannot format')
    }
  }, [formData.metadata])

  const loadDefaultMetadata = useCallback(() => {
    setFormData(prev => ({ ...prev, metadata: defaultMetadata }))
    setJsonError(null)
    toast.success('Default metadata loaded')
  }, [defaultMetadata])

  const clearMetadata = useCallback(() => {
    setFormData(prev => ({ ...prev, metadata: '' }))
    setJsonError(null)
    toast.success('Metadata cleared')
  }, [])

  const reloadMetadata = useCallback(async () => {
    if (!course?.course_id) {
      toast.error('No course selected')
      return
    }

    await loadCourseMetadata()
  }, [course?.course_id, loadCourseMetadata])

  const handleFileUpload = useCallback(e => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB')
      return
    }

    setSyllabusFile(file)
    setShouldRemoveSyllabus(false)
    setSyllabusPreview(URL.createObjectURL(file))

    // Clear syllabus validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.syllabus
      return newErrors
    })

    toast.success('PDF file selected')
  }, [])

  const removeSyllabus = useCallback(() => {
    setSyllabusFile(null)
    setSyllabusPreview(null)
    handleInputChange('syllabus_pdf', '')
    if (course?.syllabus_pdf) setShouldRemoveSyllabus(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('Syllabus removed')
  }, [course?.syllabus_pdf, handleInputChange])

  const validateForm = useCallback(() => {
    const errors = {}
    let isValid = true

    // Required fields validation
    const requiredFields = [
      { field: 'title', label: 'Title' },
      { field: 'short_description', label: 'Short description' },
      { field: 'description', label: 'Description' },
      { field: 'duration', label: 'Duration' },
      { field: 'fee', label: 'Current fee' },
      { field: 'original_fee', label: 'Original fee' },
      { field: 'seats_available', label: 'Available seats' },
      { field: 'level', label: 'Level' },
      { field: 'mode', label: 'Mode' },
    ]

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field]?.toString().trim()
      if (!value) {
        errors[field] = `${label} is required`
        isValid = false
      } else if (['fee', 'original_fee', 'seats_available'].includes(field)) {
        // Validate numeric fields
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          errors[field] = `${label} must be a valid number`
          isValid = false
        } else if (numValue < 0) {
          errors[field] = `${label} cannot be negative`
          isValid = false
        }
      }
    })

    // Syllabus validation
    if (!isSyllabusValid()) {
      errors.syllabus = 'Syllabus PDF is required'
      isValid = false
    }

    // Short description length validation
    if (formData.short_description?.length > 400) {
      errors.short_description = 'Must be 400 characters or less'
      isValid = false
    }

    // Additional validation for fee comparison
    if (formData.fee && formData.original_fee) {
      const fee = parseFloat(formData.fee)
      const originalFee = parseFloat(formData.original_fee)
      if (fee > originalFee) {
        errors.fee = 'Current fee cannot be higher than original fee'
        isValid = false
      }
    }
    if (formData.short_description?.length > 400) {
      toast.error('Short description must be 400 characters or less')
      return false
    }
    if (formData.fee && parseFloat(formData.fee) < 0) {
      toast.error('Fee cannot be negative')
      return false
    }
    // Validate metadata JSON if it exists
    if (formData.metadata && formData.metadata.trim() !== '') {
      if (!validateJSON(formData.metadata)) {
        errors.metadata = 'JSON format is invalid'
        isValid = false
      }
    }

    setValidationErrors(errors)

    if (!isValid) {
      // Show toast for the first error
      const firstError = Object.values(errors)[0]
      if (firstError) {
        toast.error(firstError)
      }
      return false
    }

    return true
  }, [formData, validateJSON, isSyllabusValid])

  const handleSaveCourse = useCallback(
    async action => {
      if (!validateForm()) return

      const savePromise = async () => {
        try {
          const apiFormData = new FormData()
          apiFormData.append('title', formData.title.trim())
          apiFormData.append('description', formData.description.trim())
          apiFormData.append('short_description', formData.short_description.trim())
          apiFormData.append('duration', formData.duration.trim())
          apiFormData.append('fee', parseFloat(formData.fee) || 0)
          apiFormData.append('original_fee', parseFloat(formData.original_fee) || 0)
          apiFormData.append('mode', formData.mode)
          apiFormData.append('level', formData.level)
          apiFormData.append('featured', formData.featured)
          apiFormData.append('seats_available', parseInt(formData.seats_available) || 0)
          apiFormData.append('status', action)

          if (formData.metadata && formData.metadata.trim()) {
            try {
              const parsed = JSON.parse(formData.metadata)
              apiFormData.append('metadata', JSON.stringify(parsed))
            } catch (error) {
              apiFormData.append('metadata', formData.metadata.trim())
            }
          } else {
            apiFormData.append('metadata', '')
          }

          if (formData.thumbnail_image)
            apiFormData.append('thumbnail_image', formData.thumbnail_image.trim())

          if (syllabusFile) {
            apiFormData.append('file', syllabusFile)
          } else if (shouldRemoveSyllabus) {
            apiFormData.append('syllabus_pdf', '')
          } else if (course?.syllabus_pdf && !syllabusFile && !shouldRemoveSyllabus) {
            apiFormData.append('syllabus_pdf', formData.syllabus_pdf)
          }

          const response = course
            ? await coursesAPI.update(course.course_id, apiFormData)
            : await coursesAPI.create(apiFormData)

          if (response.data?.success) {
            if (syllabusFile && syllabusPreview) URL.revokeObjectURL(syllabusPreview)
            onSaved()
            return response.data
          }
          throw new Error(response.data?.error || 'Failed to save course')
        } catch (err) {
          console.error('Save course error:', err.response?.data || err)
          throw err
        }
      }

      try {
        setSaveLoading(true)
        await toast.promise(savePromise(), {
          loading:
            action === 'published'
              ? 'Publishing...'
              : action === 'draft'
                ? 'Saving...'
                : 'Archiving...',
          success: () => {
            const actionText =
              action === 'published'
                ? 'published'
                : action === 'draft'
                  ? 'saved as draft'
                  : 'archived'
            return `Course ${actionText} successfully!`
          },
          error: err =>
            err.response?.data?.error || err.response?.data?.message || 'Failed to save course',
        })
      } catch (error) {
        // Error handled by toast
      } finally {
        setSaveLoading(false)
      }
    },
    [validateForm, formData, syllabusFile, syllabusPreview, shouldRemoveSyllabus, course, onSaved]
  )

  useEffect(() => {
    return () => {
      if (syllabusPreview?.startsWith('blob:')) URL.revokeObjectURL(syllabusPreview)
    }
  }, [syllabusPreview])

  useEffect(() => {
    const handleEscapeKey = e => {
      if (e.key === 'Escape' && show && !saveLoading) onClose()
    }
    if (show) document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [show, saveLoading, onClose])

  const toggleSection = useCallback(
    section => {
      setExpandedSection(expandedSection === section ? null : section)
    },
    [expandedSection]
  )

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">{course ? 'Edit Course' : 'Create Course'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {course ? `Editing: ${course.title}` : 'Add course details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={saveLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Course Details
              </h3>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                    validationErrors.title ? 'border-red-500' : ''
                  }`}
                  placeholder="Course title"
                  disabled={saveLoading}
                  autoFocus
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="2"
                  value={formData.short_description}
                  onChange={e => handleInputChange('short_description', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none ${
                    validationErrors.short_description ? 'border-red-500' : ''
                  }`}
                  placeholder="Brief description"
                  disabled={saveLoading}
                  maxLength={200}
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.short_description ? (
                    <p className="text-xs text-red-600">{validationErrors.short_description}</p>
                  ) : (
                    <div />
                  )}
                  <p className="text-xs text-gray-500">{formData.short_description.length}/200</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none ${
                    validationErrors.description ? 'border-red-500' : ''
                  }`}
                  placeholder="Detailed description"
                  disabled={saveLoading}
                />
                {validationErrors.description && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => handleInputChange('duration', e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                      validationErrors.duration ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., 8 weeks"
                    disabled={saveLoading}
                  />
                  {validationErrors.duration && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.duration}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Thumbnail URL
                  </label>
                  <input
                    type="text"
                    value={formData.thumbnail_image}
                    onChange={e => handleInputChange('thumbnail_image', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                    placeholder="Image URL"
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {levels.map(l => {
                      const Icon = l.icon
                      return (
                        <button
                          key={l.value}
                          onClick={() => handleInputChange('level', l.value)}
                          disabled={saveLoading}
                          className={`w-full flex items-center gap-1.5 px-2 py-1.5 border rounded text-xs ${
                            formData.level === l.value
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-gray-50 hover:bg-gray-100'
                          } disabled:opacity-50 ${validationErrors.level ? 'border-red-300' : ''}`}
                        >
                          <Icon className="w-3 h-3" />
                          {l.label}
                        </button>
                      )
                    })}
                  </div>
                  {validationErrors.level && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.level}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {modes.map(m => {
                      const Icon = m.icon
                      return (
                        <button
                          key={m.value}
                          onClick={() => handleInputChange('mode', m.value)}
                          disabled={saveLoading}
                          className={`w-full flex items-center gap-1.5 px-2 py-1.5 border rounded text-xs ${
                            formData.mode === m.value
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-gray-50 hover:bg-gray-100'
                          } disabled:opacity-50 ${validationErrors.mode ? 'border-red-300' : ''}`}
                        >
                          <Icon className="w-3 h-3" />
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                  {validationErrors.mode && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.mode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FaFilePdf className="w-3.5 h-3.5 text-red-600" />
                Syllabus <span className="text-red-500">*</span>
                {validationErrors.syllabus && (
                  <span className="text-xs text-red-600 ml-2">(Required)</span>
                )}
              </h3>

              <div
                className={`border-2 border-dashed rounded p-3 ${
                  validationErrors.syllabus ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                  id="syllabus-upload"
                  disabled={saveLoading}
                />

                {syllabusPreview || formData.syllabus_pdf ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded">
                      <FaFilePdf className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-xs font-medium truncate max-w-[150px]">
                          {syllabusFile?.name || 'Syllabus'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {syllabusFile
                            ? `${(syllabusFile.size / (1024 * 1024)).toFixed(1)} MB`
                            : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={syllabusPreview || formData.syllabus_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </a>
                      <button
                        onClick={removeSyllabus}
                        disabled={saveLoading}
                        className="px-2.5 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="syllabus-upload" className="block text-center cursor-pointer">
                    <UploadIcon className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-600 mb-1">Upload PDF (Required)</p>
                    <p className="text-xs text-gray-500 mb-2">Max 10MB</p>
                    <span className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded inline-flex items-center gap-1.5">
                      <FaFilePdf className="w-3 h-3" />
                      Choose File
                    </span>
                  </label>
                )}
                {validationErrors.syllabus && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    {validationErrors.syllabus}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Pricing & Availability</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Current Fee <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.fee}
                      onChange={e => handleInputChange('fee', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                        validationErrors.fee ? 'border-red-500' : ''
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={saveLoading}
                    />
                    {validationErrors.fee && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.fee}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Original Fee <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.original_fee}
                      onChange={e => handleInputChange('original_fee', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                        validationErrors.original_fee ? 'border-red-500' : ''
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={saveLoading}
                    />
                    {validationErrors.original_fee && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.original_fee}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Available Seats <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.seats_available}
                      onChange={e => handleInputChange('seats_available', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                        validationErrors.seats_available ? 'border-red-500' : ''
                      }`}
                      placeholder="Seats count"
                      min="0"
                      disabled={saveLoading}
                    />
                    {validationErrors.seats_available && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.seats_available}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Course Type
                    </label>
                    <button
                      onClick={() => handleInputChange('featured', !formData.featured)}
                      disabled={saveLoading}
                      className={`w-full px-2.5 py-1.5 border rounded text-xs flex items-center justify-center gap-1.5 ${
                        formData.featured
                          ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                      } disabled:opacity-50`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {formData.featured ? 'Featured' : 'Regular'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Additional Notes
                </label>
                <textarea
                  rows="2"
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Additional information..."
                  disabled={saveLoading}
                />
              </div>
            </div>
          </div>

          {/* Metadata Section - Full width below the two columns */}
          <div
            className={`mt-4 border rounded-lg overflow-hidden ${
              validationErrors.metadata ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
              disabled={saveLoading}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">Course Metadata (JSON)</span>
                {metadataLoading && (
                  <span className="text-xs text-blue-600 ml-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading...
                  </span>
                )}
                {jsonError && (
                  <span className="text-xs text-red-600 ml-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    JSON Error
                  </span>
                )}
              </div>
              {expandedSection === 'metadata' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSection === 'metadata' && (
              <div className="p-3 space-y-3 bg-white">
                <div className="flex flex-wrap gap-2 mb-2">
                  {course && (
                    <button
                      onClick={reloadMetadata}
                      disabled={saveLoading || metadataLoading}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded flex items-center gap-1.5 hover:bg-blue-100 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${metadataLoading ? 'animate-spin' : ''}`} />
                      Reload from API
                    </button>
                  )}
                  <button
                    onClick={loadDefaultMetadata}
                    disabled={saveLoading}
                    className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded flex items-center gap-1.5 hover:bg-green-100 disabled:opacity-50"
                  >
                    Load Default
                  </button>
                  <button
                    onClick={formatJSON}
                    disabled={saveLoading}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded flex items-center gap-1.5 hover:bg-blue-100 disabled:opacity-50"
                  >
                    <Code className="w-3 h-3" />
                    Format JSON
                  </button>
                  <button
                    onClick={clearMetadata}
                    disabled={saveLoading}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded flex items-center gap-1.5 hover:bg-red-100 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700">Enter JSON metadata</label>
                    <span className="text-xs text-gray-500">
                      {formData.metadata.length} characters
                    </span>
                  </div>
                  <textarea
                    rows="8"
                    value={formData.metadata}
                    onChange={e => handleInputChange('metadata', e.target.value)}
                    className={`w-full px-3 py-2 border rounded text-sm font-mono resize-none focus:ring-1 ${
                      jsonError || validationErrors.metadata
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'focus:ring-primary-500 focus:border-primary-500'
                    }`}
                    placeholder={`{
  "modules": [...],
  "curriculum": [...],
  "prerequisites": [...],
  "learning_objectives": [...]
}`}
                    disabled={saveLoading}
                    spellCheck="false"
                  />
                  {(jsonError || validationErrors.metadata) && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        {jsonError || validationErrors.metadata}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      Expected format: JSON object with optional fields: modules, curriculum,
                      prerequisites, learning_objectives
                    </p>
                    {course && (
                      <p className="mt-1">
                        Click "Reload from API" to fetch the latest metadata from the server.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Reference:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <code className="text-gray-600 block">
                        "modules": ["Module 1", "Module 2"]
                      </code>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <code className="text-gray-600 block">
                        "prerequisites": ["Prereq 1", "Prereq 2"]
                      </code>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <code className="text-gray-600 block">
                        "curriculum": [{'{'}"module": "Name", "topics": ["Topic 1", "Topic 2"]{'}'}]
                      </code>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <code className="text-gray-600 block">
                        "learning_objectives": ["Objective 1", "Objective 2"]
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            {course && course.updatedAt
              ? `Updated: ${new Date(course.updatedAt).toLocaleDateString()}`
              : 'New course'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveCourse('archived')}
              className="px-3 py-1.5 text-xs border rounded bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}
              title={Object.keys(validationErrors).length > 0 ? 'Fix validation errors first' : ''}
            >
              <FileArchive className="w-3 h-3" />
              Archive
            </button>
            <button
              onClick={() => handleSaveCourse('draft')}
              className="px-3 py-1.5 text-xs border rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}
              title={Object.keys(validationErrors).length > 0 ? 'Fix validation errors first' : ''}
            >
              <Save className="w-3 h-3" />
              Draft
            </button>
            <button
              onClick={() => handleSaveCourse('published')}
              className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}
              title={Object.keys(validationErrors).length > 0 ? 'Fix validation errors first' : ''}
            >
              <Send className="w-3 h-3" />
              {saveLoading ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(CourseModal)
