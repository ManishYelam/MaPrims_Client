// src/pages/dashboard/Certificates.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { paymentsAPI } from '../../services/api'
import CertificateModal, { SAMPLE_CERTIFICATE } from '../certificates/CertificateModal'

// Color mappings for fast lookup
const STATUS_COLORS = {
  issued: 'bg-green-100 text-green-800 border-green-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'pending-payment': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
}

const GRADE_COLORS = {
  'A+': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  A: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
  B: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white',
  default: 'bg-gray-100 text-gray-800',
}

const LEVEL_COLORS = {
  Beginner: 'bg-blue-50 text-blue-700 border-blue-200',
  Intermediate: 'bg-purple-50 text-purple-700 border-purple-200',
  Advanced: 'bg-orange-50 text-orange-700 border-orange-200',
  default: 'bg-gray-50 text-gray-700 border-gray-200',
}

const STATUS_LABELS = {
  issued: 'Issued',
  'in-progress': 'In Progress',
  'pending-payment': 'Pending Payment',
  expired: 'Expired',
}

// Custom Notification Component
const Notification = React.memo(({ message, type = 'info', onClose }) => {
  const bgColor = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }[type]

  const icon = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  }[type]

  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm ${bgColor} animate-slide-in`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>
    </div>
  )
})

// Memoized components
const CertificateGridItem = React.memo(({ certificate, onView, onContinue, onPayment }) => {
  const getStatusColor = status => STATUS_COLORS[status] || STATUS_COLORS.default
  const getGradeColor = grade => GRADE_COLORS[grade] || GRADE_COLORS.default
  const getLevelColor = level => LEVEL_COLORS[level] || LEVEL_COLORS.default

  const handleImageError = e => {
    e.target.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNEOEU5RTYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cmVjdCB4PSI3MCIgeT0iODAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNDAiIGZpbGw9IiNEOEU5RTYiLz4KPHJlY3QgeD0iNzAiIHk9IjE0MCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIyIiBmaWxsPSIjRDhFOUU2Ii8+CjxyZWN0IHg9IjcwIiB5PSIxNjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iOCI+IGZpbGw9IiNEOEU5RTYiLz4KPHJlY3QgeD0iNzAiIHk9IjE4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgiPiBmaWxsPSIjRDhFOUU2Ii8+Cjwvc3ZnPg=='
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        <div className="relative">
          <img
            src={certificate.thumbnail}
            alt={certificate.course.title}
            className="w-full h-28 object-cover cursor-pointer"
            onClick={() => onView(certificate)}
            onError={handleImageError}
            loading="lazy"
          />
          {certificate.status === 'issued' && (
            <div className="absolute top-2 right-2">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(certificate.status)}`}
              >
                ✓ Issued
              </span>
            </div>
          )}
          {certificate.course.level && (
            <div className="absolute bottom-2 left-2">
              <span
                className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${getLevelColor(certificate.course.level)}`}
              >
                {certificate.course.level}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                {certificate.course.title}
              </h3>
              <p className="text-xs text-gray-600 mb-1">by {certificate.course.instructor}</p>
              <div className="flex items-center space-x-1 mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {certificate.course.category}
                </span>
              </div>
            </div>
          </div>

          {certificate.status === 'issued' ? (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                <div>
                  <span className="font-medium">Issued:</span>
                  <p className="truncate">{new Date(certificate.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Grade:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(certificate.grade)}`}
                  >
                    {certificate.grade}
                  </span>
                </div>
              </div>

              {certificate.skills && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {certificate.skills.slice(0, 2).map((skill, index) => (
                      <span
                        key={index}
                        className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {certificate.skills.length > 2 && (
                      <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{certificate.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-2">
                <button
                  onClick={() => onView(certificate)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
                >
                  View Certificate
                </button>

                <div className="text-xs text-gray-500 text-center">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs truncate block">
                    {certificate.verificationCode}
                  </code>
                </div>
              </div>
            </div>
          ) : certificate.status === 'pending-payment' ? (
            <div className="flex-1 flex flex-col">
              <div className="p-1.5 bg-yellow-50 border border-yellow-200 rounded text-xs mb-2">
                <p className="text-yellow-800 text-center">Payment Required</p>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{certificate.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${certificate.progress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => onPayment(certificate)}
                className="mt-auto w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
              >
                Complete Payment
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{certificate.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${certificate.progress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => onContinue(certificate)}
                className="mt-auto w-full bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
              >
                Continue Learning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

const CertificateTableRow = React.memo(({ certificate, onView, onContinue, onPayment }) => {
  const getStatusColor = status => STATUS_COLORS[status] || STATUS_COLORS.default
  const getGradeColor = grade => GRADE_COLORS[grade] || GRADE_COLORS.default

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center space-x-3">
          <img
            src={certificate.thumbnail}
            alt={certificate.course.title}
            className="w-10 h-10 rounded object-cover"
            loading="lazy"
          />
          <div>
            <p className="font-medium text-gray-900 text-sm">{certificate.course.title}</p>
            <p className="text-xs text-gray-500">{certificate.course.category}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(certificate.status)}`}
        >
          {STATUS_LABELS[certificate.status] || 'Unknown'}
        </span>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center space-x-2">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${certificate.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{certificate.progress}%</span>
        </div>
      </td>
      <td className="py-3 px-3">
        {certificate.grade ? (
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getGradeColor(certificate.grade)}`}
          >
            {certificate.grade} ({certificate.score}%)
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      <td className="py-3 px-3">
        {certificate.issueDate ? (
          <span className="text-xs text-gray-600">
            {new Date(certificate.issueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">Not issued</span>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex space-x-1">
          {certificate.status === 'issued' ? (
            <>
              <button
                onClick={() => onView(certificate)}
                className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded transition-colors"
              >
                View
              </button>
              <button className="px-2 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs rounded transition-colors">
                Download
              </button>
            </>
          ) : certificate.status === 'pending-payment' ? (
            <button
              onClick={() => onPayment(certificate)}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
            >
              Pay Now
            </button>
          ) : (
            <button
              onClick={() => onContinue(certificate)}
              className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </td>
    </tr>
  )
})

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-72 animate-pulse"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse h-64"
        >
          <div className="h-28 bg-gray-200"></div>
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Course data mappings for fast lookups
const COURSE_LEVELS = {
  1: 'Beginner',
  2: 'Advanced',
  3: 'Intermediate',
  6: 'Advanced',
  7: 'Intermediate',
  8: 'Intermediate',
  default: 'Beginner',
}

const COURSE_SKILLS = {
  1: ['ABAP Syntax', 'Data Types', 'Modularization', 'Dialog Programming'],
  2: ['Object-Oriented ABAP', 'ALV Reporting', 'BAPIs', 'RFCs', 'Performance Tuning'],
  3: ['SAP Fiori', 'UI5 Development', 'OData Services'],
  6: ['ABAP Programming', 'Debugging', 'Performance'],
  7: ['SAP FICO', 'ABAP Integration', 'Financial Reports'],
  8: ['Data Dictionary', 'Database Programming', 'SQL Optimization'],
  default: ['SAP Development', 'ABAP Programming'],
}

const COURSE_CATEGORIES = {
  1: 'SAP Development',
  2: 'SAP Development',
  3: 'UI Development',
  6: 'SAP Development',
  7: 'SAP Integration',
  8: 'Database Programming',
  default: 'SAP Development',
}

const COURSE_DURATIONS = {
  1: '10 weeks',
  2: '12 weeks',
  3: '8 weeks',
  6: '8 weeks',
  7: '10 weeks',
  8: '12 weeks',
  default: '8 weeks',
}

// Main component
const Certificates = () => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  // Fetch user enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true)
        const response = await paymentsAPI.getUserEnrollments()

        // Handle nested API response structure
        if (response.data?.success) {
          setEnrollments(response.data.data?.enrollments || [])
        } else if (response.success) {
          setEnrollments(response.data?.enrollments || [])
        } else {
          throw new Error(
            response.data?.message || response.message || 'Failed to fetch enrollments'
          )
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching enrollments:', err)
        showNotification('Failed to load certificates', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [showNotification])

  // Helper functions with fast object lookups
  const getCourseLevel = useCallback(
    courseId => COURSE_LEVELS[courseId] || COURSE_LEVELS.default,
    []
  )
  const getCourseSkills = useCallback(
    courseId => COURSE_SKILLS[courseId] || COURSE_SKILLS.default,
    []
  )
  const getCourseCategory = useCallback(
    courseId => COURSE_CATEGORIES[courseId] || COURSE_CATEGORIES.default,
    []
  )
  const getCourseDuration = useCallback(
    courseId => COURSE_DURATIONS[courseId] || COURSE_DURATIONS.default,
    []
  )

  const calculateExpiryDate = useCallback(completionDate => {
    if (!completionDate) return null
    const expiry = new Date(completionDate)
    expiry.setFullYear(expiry.getFullYear() + 2)
    return expiry.toISOString().split('T')[0]
  }, [])

  const calculateGrade = useCallback(progress => {
    if (progress >= 90) return 'A+'
    if (progress >= 80) return 'A'
    if (progress >= 70) return 'B'
    return 'C'
  }, [])

  const calculateScore = useCallback(progress => Math.min(100, Math.max(60, progress + 30)), [])

  const generateVerificationCode = useCallback(enrollment => {
    return `CERT-${enrollment.enrollment_id}-${enrollment.course_id}-${new Date().getFullYear()}`
  }, [])

  // Transform enrollments to certificates
  const certificates = useMemo(() => {
    return enrollments.map(enrollment => {
      const isCompleted = enrollment.completion_date !== null
      const hasPayment = enrollment.payment?.status === 'paid'
      const courseId = enrollment.course_id

      // Determine status
      let status = 'in-progress'
      if (isCompleted && hasPayment) status = 'issued'
      else if (isCompleted && !hasPayment) status = 'pending-payment'

      return {
        id: `CERT-${enrollment.enrollment_id}`,
        course: {
          id: courseId,
          title: enrollment.course?.title || 'Unknown Course',
          instructor: 'Akshay Kumar',
          duration: getCourseDuration(courseId),
          completedDate: enrollment.completion_date,
          category: getCourseCategory(courseId),
          level: getCourseLevel(courseId),
          description: enrollment.course?.description || 'Course description not available',
        },
        issueDate: enrollment.completion_date || enrollment.enrollment_date,
        expiryDate: calculateExpiryDate(enrollment.completion_date),
        grade: isCompleted ? calculateGrade(enrollment.progress) : null,
        score: isCompleted ? calculateScore(enrollment.progress) : null,
        certificateUrl: isCompleted ? `/certificates/${enrollment.enrollment_id}.pdf` : null,
        verificationCode: isCompleted ? generateVerificationCode(enrollment) : null,
        status,
        progress: enrollment.progress || 0,
        thumbnail: enrollment.course?.thumbnail_image || '/images/certificate-placeholder.jpg',
        skills: getCourseSkills(courseId),
        enrollment,
      }
    })
  }, [
    enrollments,
    getCourseLevel,
    getCourseSkills,
    getCourseCategory,
    getCourseDuration,
    calculateExpiryDate,
    calculateGrade,
    calculateScore,
    generateVerificationCode,
  ])

  // Memoized filters and filtered certificates
  const filters = useMemo(
    () => [
      { id: 'all', name: 'All Certificates', count: certificates.length },
      {
        id: 'issued',
        name: 'Issued',
        count: certificates.filter(c => c.status === 'issued').length,
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        count: certificates.filter(c => c.status === 'in-progress').length,
      },
      {
        id: 'pending-payment',
        name: 'Pending Payment',
        count: certificates.filter(c => c.status === 'pending-payment').length,
      },
    ],
    [certificates]
  )

  const filteredCertificates = useMemo(
    () =>
      certificates.filter(
        certificate => activeFilter === 'all' || certificate.status === activeFilter
      ),
    [certificates, activeFilter]
  )

  // Event handlers
  const handleVerification = useCallback(() => {
    if (!verificationCode.trim()) {
      setVerificationResult({ valid: false, message: 'Please enter a verification code' })
      showNotification('Please enter a verification code', 'warning')
      return
    }

    const certificate = certificates.find(
      c => c.verificationCode === verificationCode.toUpperCase()
    )

    if (certificate) {
      setVerificationResult({
        valid: true,
        message: 'Certificate verified successfully!',
        certificate,
      })
      showNotification('Certificate verified successfully!', 'success')
    } else {
      setVerificationResult({ valid: false, message: 'Invalid verification code' })
      showNotification('Invalid verification code', 'error')
    }
  }, [verificationCode, certificates, showNotification])

  const handleViewCertificate = useCallback(certificate => {
    if (certificate.status === 'issued') {
      setSelectedCertificate(certificate)
      setShowCertificateModal(true)
    }
  }, [])

  const handleShowSampleCertificate = useCallback(() => {
    setShowSampleModal(true)
  }, [])

  const handleContinueLearning = useCallback(
    certificate => {
      // console.log('Continue learning:', certificate.course.title)
      showNotification(`Continuing with ${certificate.course.title}`, 'info')
    },
    [showNotification]
  )

  const handleCompletePayment = useCallback(
    certificate => {
      // console.log('Complete payment for:', certificate.course.title)
      showNotification(`Redirecting to payment for ${certificate.course.title}`, 'info')
    },
    [showNotification]
  )

  const handleDownloadAll = useCallback(() => {
    const issuedCertificates = certificates.filter(c => c.status === 'issued')
    if (issuedCertificates.length === 0) {
      showNotification('No certificates available for download', 'warning')
      return
    }
    showNotification(`Downloading ${issuedCertificates.length} certificates...`, 'success')
  }, [certificates, showNotification])

  // Stats
  const stats = useMemo(() => {
    const issuedCount = certificates.filter(c => c.status === 'issued').length
    const inProgressCount = certificates.filter(c => c.status === 'in-progress').length
    const avgProgress = Math.round(
      certificates.reduce((acc, cert) => acc + cert.progress, 0) / certificates.length
    )

    return [
      { label: 'Total Certificates', value: issuedCount, color: 'green', icon: '✓' },
      { label: 'In Progress', value: inProgressCount, color: 'blue', icon: '⏱️' },
      { label: 'Avg Progress', value: `${avgProgress}%`, color: 'purple', icon: '📊' },
      { label: 'Courses Enrolled', value: certificates.length, color: 'orange', icon: '🎓' },
    ]
  }, [certificates])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
            <p className="text-sm text-gray-600">Error loading certificates</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <svg
            className="w-8 h-8 text-red-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-base font-medium text-red-800 mb-1">Unable to load certificates</h3>
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-sm text-gray-600">
            Track your learning achievements and earned credentials
          </p>
        </div>
        <div className="flex space-x-2 mt-3 lg:mt-0">
          <div className="flex bg-gray-100 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={handleShowSampleCertificate}
            className="px-3 py-1.5 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded text-sm font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Sample Certificate
          </button>

          <button
            onClick={handleDownloadAll}
            className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Download All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 shadow-sm border border-gray-100"
          >
            <div className="flex items-center">
              <div
                className={`w-8 h-8 bg-${stat.color}-100 rounded flex items-center justify-center mr-3`}
              >
                <span className="text-sm">{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-1">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                activeFilter === filter.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.name}
              <span
                className={`ml-1 px-1 py-0.5 rounded text-xs ${
                  activeFilter === filter.id
                    ? 'bg-white text-primary-600'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCertificates.map(certificate => (
            <CertificateGridItem
              key={certificate.id}
              certificate={certificate}
              onView={handleViewCertificate}
              onContinue={handleContinueLearning}
              onPayment={handleCompletePayment}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCertificates.map(certificate => (
                  <CertificateTableRow
                    key={certificate.id}
                    certificate={certificate}
                    onView={handleViewCertificate}
                    onContinue={handleContinueLearning}
                    onPayment={handleCompletePayment}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCertificates.length === 0 && !loading && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-base font-medium text-gray-900 mb-1">No certificates found</h3>
          <p className="text-sm text-gray-600 mb-3">
            {activeFilter === 'issued'
              ? 'Complete courses to earn certificates'
              : 'No certificates match your current filter'}
          </p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              View All Certificates
            </button>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-sm mb-1">
              Verify Certificate Authenticity
            </h3>
            <p className="text-blue-800 text-xs mb-3">
              Use the verification code on your certificate to validate its authenticity and check
              certificate details.
            </p>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Enter verification code..."
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleVerification}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap"
              >
                Verify Certificate
              </button>
            </div>

            {verificationResult && (
              <div
                className={`mt-3 p-2 rounded ${
                  verificationResult.valid
                    ? 'bg-green-100 border border-green-200 text-green-800'
                    : 'bg-red-100 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center">
                  {verificationResult.valid ? (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="font-medium text-sm">{verificationResult.message}</span>
                </div>

                {verificationResult.valid && verificationResult.certificate && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <p className="font-medium text-gray-900">
                      {verificationResult.certificate.course.title}
                    </p>
                    <p className="text-gray-600">Issued to: Student Name</p>
                    <p className="text-gray-600">
                      Date:{' '}
                      {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      Grade: {verificationResult.certificate.grade} (
                      {verificationResult.certificate.score}%)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regular Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Sample Certificate Modal */}
      {showSampleModal && (
        <CertificateModal
          certificate={SAMPLE_CERTIFICATE}
          onClose={() => setShowSampleModal(false)}
          isSample={true}
        />
      )}
    </div>
  )
}

export default Certificates
