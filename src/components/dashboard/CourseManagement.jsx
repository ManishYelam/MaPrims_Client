import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import {
  Search,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Star,
  Filter,
  X,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Calendar,
  CheckCircle,
  AlertCircle,
  Archive,
  Sparkles,
  Clock,
  BookOpen as BookIcon,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { FaFilePdf } from 'react-icons/fa6'
import { coursesAPI } from '../../services/api'
import CourseModal from './CourseModal'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const StatusBadge = React.memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0]
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}
    >
      {statusObj.label}
    </span>
  )
})
StatusBadge.displayName = 'StatusBadge'

const CourseManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  const canManage = useMemo(() => isAdmin, [isAdmin])

  const canCreate = useMemo(
    () => hasPermission('create', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdate = useMemo(
    () => hasPermission('update', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdateStatus = useMemo(
    () => hasPermission('update_status', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canExport = useMemo(
    () => hasPermission('export', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canImport = useMemo(
    () => hasPermission('import', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canBulk = useMemo(
    () => hasPermission('bulk', 'course', 'A2') || canManage,
    [hasPermission, canManage]
  )

  const [activeTab, setActiveTab] = useState('all')
  const [courses, setCourses] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Advanced Filter States
  const [filters, setFilters] = useState({
    search: '',
    level: 'all',
    status: 'all',
    mode: 'all',
    featured: 'all',
    page: 1,
    limit: 5,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0,
  })

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
    data: null,
  })

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  // Options
  const levels = useMemo(
    () => [
      {
        value: 'beginner',
        label: 'Beginner',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        color: 'bg-purple-100 text-purple-800 border border-purple-200',
      },
      {
        value: 'advanced',
        label: 'Advanced',
        color: 'bg-red-100 text-red-800 border border-red-200',
      },
    ],
    []
  )

  const modes = useMemo(
    () => [
      { value: 'online_live', label: 'Live Online', icon: Clock, color: 'text-blue-600' },
      { value: 'online_self_paced', label: 'Self Paced', icon: BookIcon, color: 'text-green-600' },
      { value: 'hybrid', label: 'Hybrid', icon: SlidersHorizontal, color: 'text-purple-600' },
    ],
    []
  )

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
      {
        value: 'published',
        label: 'Published',
        color: 'bg-green-100 text-green-700 border border-green-300',
      },
      {
        value: 'archived',
        label: 'Archived',
        color: 'bg-orange-100 text-orange-700 border border-orange-300',
      },
    ],
    []
  )

  // Calculate tab counts based on allCourses
  const tabs = useMemo(() => {
    if (!allCourses.length)
      return [
        { id: 'all', name: 'All Courses', count: 0, icon: BookOpen, color: 'text-gray-600' },
        {
          id: 'published',
          name: 'Published',
          count: 0,
          icon: CheckCircle,
          color: 'text-green-600',
        },
        { id: 'draft', name: 'Drafts', count: 0, icon: AlertCircle, color: 'text-yellow-600' },
        { id: 'archived', name: 'Archived', count: 0, icon: Archive, color: 'text-orange-600' },
      ]

    const allCount = allCourses.length
    const publishedCount = allCourses.filter(c => c.status === 'published').length
    const draftCount = allCourses.filter(c => c.status === 'draft').length
    const archivedCount = allCourses.filter(c => c.status === 'archived').length

    return [
      { id: 'all', name: 'All Courses', count: allCount, icon: BookOpen, color: 'text-gray-600' },
      {
        id: 'published',
        name: 'Published',
        count: publishedCount,
        icon: CheckCircle,
        color: 'text-green-600',
      },
      {
        id: 'draft',
        name: 'Drafts',
        count: draftCount,
        icon: AlertCircle,
        color: 'text-yellow-600',
      },
      {
        id: 'archived',
        name: 'Archived',
        count: archivedCount,
        icon: Archive,
        color: 'text-orange-600',
      },
    ]
  }, [allCourses])

  // Generate sample CSV (only if canImport)
  const generateSampleCSV = () => {
    if (!canImport) {
      showToast('You do not have permission to import courses', 'error')
      return
    }

    const sampleData = [
      [
        'title',
        'description',
        'short_description',
        'level',
        'mode',
        'status',
        'featured',
        'fee',
        'original_fee',
        'duration',
        'seats_available',
        'enroll_count',
        'syllabus_pdf',
      ],
      [
        'Introduction to React',
        'Learn React from scratch with hands-on projects',
        'Beginner friendly React course',
        'beginner',
        'online_self_paced',
        'draft',
        'false',
        '4999',
        '5999',
        '6 weeks',
        '50',
        '0',
        'https://example.com/syllabus/react.pdf',
      ],
      [
        'Advanced JavaScript',
        'Master advanced JavaScript concepts and patterns',
        'Deep dive into JavaScript',
        'advanced',
        'online_live',
        'published',
        'true',
        '7999',
        '8999',
        '8 weeks',
        '30',
        '15',
        'https://example.com/syllabus/javascript.pdf',
      ],
      [
        'Full Stack Development',
        'Become a full stack developer with MERN stack',
        'Complete web development bootcamp',
        'intermediate',
        'hybrid',
        'published',
        'false',
        '12999',
        '14999',
        '12 weeks',
        '25',
        '10',
        'https://example.com/syllabus/mern.pdf',
      ],
    ]

    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'course_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Sample CSV template downloaded', 'info')
  }

  // CSV import (only if canImport)
  const handleFileUpload = async event => {
    if (!canImport) {
      showToast('You do not have permission to import courses', 'error')
      return
    }

    const file = event.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a CSV file', 'error')
      return
    }

    setImportLoading(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row')
      }

      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim())

      const requiredHeaders = [
        'title',
        'description',
        'short_description',
        'level',
        'mode',
        'status',
        'featured',
        'fee',
        'original_fee',
        'duration',
        'seats_available',
        'enroll_count',
        'syllabus_pdf',
      ]

      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
      }

      const coursesToImport = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim())

        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1} has incorrect number of columns`)
        }

        const courseData = {}
        headers.forEach((header, index) => {
          courseData[header] = values[index]
        })

        const validatedCourse = {
          title: courseData.title,
          description: courseData.description,
          short_description: courseData.short_description,
          level: courseData.level,
          mode: courseData.mode,
          status: courseData.status,
          featured: courseData.featured === 'true',
          fee: parseFloat(courseData.fee) || 0,
          original_fee: parseFloat(courseData.original_fee) || 0,
          duration: courseData.duration,
          seats_available: parseInt(courseData.seats_available) || 0,
          enroll_count: parseInt(courseData.enroll_count) || 0,
          syllabus_pdf: courseData.syllabus_pdf || '',
        }

        if (!validatedCourse.title) {
          throw new Error(`Row ${i + 1}: Title is required`)
        }

        if (!['beginner', 'intermediate', 'advanced'].includes(validatedCourse.level)) {
          throw new Error(`Row ${i + 1}: Level must be beginner, intermediate, or advanced`)
        }

        if (!['online_live', 'online_self_paced', 'hybrid'].includes(validatedCourse.mode)) {
          throw new Error(`Row ${i + 1}: Mode must be online_live, online_self_paced, or hybrid`)
        }

        if (!['draft', 'published', 'archived'].includes(validatedCourse.status)) {
          throw new Error(`Row ${i + 1}: Status must be draft, published, or archived`)
        }

        coursesToImport.push(validatedCourse)
      }

      const importPromises = coursesToImport.map(course => coursesAPI.create(course))
      await Promise.all(importPromises)

      showToast(`Successfully imported ${coursesToImport.length} courses`, 'success')
      setShowImportModal(false)

      fetchCourses()
      fetchAllCourses()
    } catch (err) {
      console.error('Error importing courses:', err)
      showToast(`Import failed: ${err.message}`, 'error')
    } finally {
      setImportLoading(false)
      event.target.value = ''
    }
  }

  // Fetch courses with filtering
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }

      if (filters.search.trim()) {
        payload.search = filters.search.trim()
        payload.searchFields = 'title,description,short_description'
      }

      const filterConditions = {}
      if (filters.level !== 'all') filterConditions.level = filters.level
      if (filters.mode !== 'all') filterConditions.mode = filters.mode
      if (filters.featured !== 'all') filterConditions.featured = filters.featured === 'true'
      if (filters.status !== 'all') filterConditions.status = filters.status

      if (Object.keys(filterConditions).length > 0) {
        payload.filters = filterConditions
      }

      const response = await coursesAPI.getAll(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        const coursesData = responseData.courses || []
        setCourses(coursesData)

        if (responseData.pagination) {
          setPagination(responseData.pagination)
        } else {
          setPagination({
            page: filters.page,
            limit: filters.limit,
            totalItems: coursesData.length,
            totalPages: Math.ceil(coursesData.length / filters.limit),
          })
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError('Failed to load courses. Please try again.')
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch all courses for counting and export
  const fetchAllCourses = useCallback(async () => {
    try {
      const payload = {
        limit: 10000,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }

      const response = await coursesAPI.getAll(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        setAllCourses(responseData.courses || [])
      }
    } catch (err) {
      console.error('Error fetching all courses:', err)
    }
  }, [])

  // Fetch all courses for export (with filters)
  const fetchAllCoursesForExport = useCallback(async () => {
    try {
      const payload = {
        sortBy: 'created_at',
        sortOrder: 'DESC',
        limit: 10000,
      }

      if (filters.search.trim()) {
        payload.search = filters.search.trim()
        payload.searchFields = 'title,description,short_description'
      }

      const filterConditions = {}
      if (filters.level !== 'all') filterConditions.level = filters.level
      if (filters.mode !== 'all') filterConditions.mode = filters.mode
      if (filters.featured !== 'all') filterConditions.featured = filters.featured === 'true'
      if (filters.status !== 'all') filterConditions.status = filters.status

      if (Object.keys(filterConditions).length > 0) {
        payload.filters = filterConditions
      }

      const response = await coursesAPI.getAll(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        return responseData.courses || []
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching courses for export:', err)
      throw err
    }
  }, [filters])

  // Export to CSV (only if canExport)
  const exportToCSV = async () => {
    if (!canExport) {
      showToast('You do not have permission to export courses', 'error')
      return
    }

    try {
      setExportLoading(true)

      const allCourses = await fetchAllCoursesForExport()

      if (!allCourses || allCourses.length === 0) {
        showToast('No courses found to export.', 'error')
        return
      }

      const headers = [
        'Course ID',
        'Title',
        'Description',
        'Short Description',
        'Level',
        'Mode',
        'Status',
        'Featured',
        'Fee',
        'Original Fee',
        'Duration',
        'Seats Available',
        'Enrolled Students',
        'Syllabus PDF',
        'Created At',
        'Updated At',
      ]

      const csvRows = allCourses.map(course => [
        course.course_id || '',
        `"${(course.title || '').replace(/"/g, '""')}"`,
        `"${(course.description || '').replace(/"/g, '""')}"`,
        `"${(course.short_description || '').replace(/"/g, '""')}"`,
        course.level || '',
        course.mode || '',
        course.status || '',
        course.featured ? 'Yes' : 'No',
        course.fee || '0',
        course.original_fee || '0',
        course.duration || '',
        course.seats_available || '0',
        course.enroll_count || '0',
        course.syllabus_pdf || '',
        course.createdAt ? new Date(course.createdAt).toISOString() : '',
        course.updatedAt ? new Date(course.updatedAt).toISOString() : '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `courses_export_${timestamp}`

      if (hasActiveFilters) {
        const filterParts = []
        if (filters.search) filterParts.push('search')
        if (filters.level !== 'all') filterParts.push(filters.level)
        if (filters.status !== 'all') filterParts.push(filters.status)
        if (filters.mode !== 'all') filterParts.push(filters.mode)
        if (filters.featured !== 'all') filterParts.push(`featured_${filters.featured}`)

        if (filterParts.length > 0) {
          filename += `_${filterParts.join('_')}`
        }
      }

      filename += '.csv'

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Successfully exported ${allCourses.length} courses`, 'success')
    } catch (err) {
      console.error('Error exporting courses:', err)
      showToast('Failed to export courses. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Debounced fetch
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchCourses(), 350)
    return () => clearTimeout(timeoutId)
  }, [fetchCourses])

  useEffect(() => {
    fetchAllCourses()
  }, [fetchAllCourses])

  useEffect(() => {
    if (courses.length > 0) {
      fetchAllCourses()
    }
  }, [courses.length])

  // Confirmation modal functions
  const showConfirmation = (title, message, type, onConfirm, data = null) => {
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  }

  const hideConfirmation = () => {
    setConfirmationModal({
      show: false,
      title: '',
      message: '',
      type: '',
      onConfirm: null,
      data: null,
    })
  }

  const handleConfirm = () => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }

  // Course modal (with permission checks)
  const openCourseModal = (course = null) => {
    if (course && !canUpdate) {
      showToast('You do not have permission to edit courses', 'error')
      return
    }
    if (!course && !canCreate) {
      showToast('You do not have permission to create courses', 'error')
      return
    }
    setEditingCourse(course)
    setShowCourseModal(true)
  }

  const closeCourseModal = () => {
    setShowCourseModal(false)
    setEditingCourse(null)
  }

  const handleCourseSaved = () => {
    closeCourseModal()
    fetchCourses()
    fetchAllCourses()
    showToast('Course saved successfully!', 'success')
  }

  // Filter handlers
  const handleStatusChange = status => {
    setActiveTab(status)
    setFilters(prev => ({ ...prev, status: status === 'all' ? 'all' : status, page: 1 }))
  }

  const handleSearchChange = value => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handleLevelChange = level => {
    setFilters(prev => ({ ...prev, level, page: 1 }))
  }

  const handleModeChange = mode => {
    setFilters(prev => ({ ...prev, mode, page: 1 }))
  }

  const handleFeaturedChange = featured => {
    setFilters(prev => ({ ...prev, featured, page: 1 }))
  }

  const handleLimitChange = newLimit => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      level: 'all',
      status: 'all',
      mode: 'all',
      featured: 'all',
      page: 1,
      limit: 5,
    })
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.level !== 'all' ||
      filters.status !== 'all' ||
      filters.mode !== 'all' ||
      filters.featured !== 'all'
    )
  }, [filters])

  // Selection and bulk actions (permission‑aware)
  const toggleCourseSelection = courseId => {
    if (!canBulk) return
    setSelectedCourses(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    )
  }

  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedCourses(
      selectedCourses.length === courses.length ? [] : courses.map(c => c.course_id)
    )
  }

  const handleBulkAction = async () => {
    if (!canBulk) {
      showToast('You do not have permission for bulk actions', 'error')
      return
    }
    if (!bulkAction || selectedCourses.length === 0) return

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) {
          showToast('You do not have permission to delete courses', 'error')
          return
        }
        showConfirmation(
          'Delete Courses',
          `Are you sure you want to delete ${selectedCourses.length} selected course(s)? This action cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedCourses.map(id => coursesAPI.delete(id)))
            setBulkAction('')
            setSelectedCourses([])
            fetchCourses()
            fetchAllCourses()
            showToast(`Successfully deleted ${selectedCourses.length} courses`, 'success')
          }
        )
      } else {
        if (!canUpdateStatus) {
          showToast('You do not have permission to update course status', 'error')
          return
        }
        await Promise.all(selectedCourses.map(id => coursesAPI.update(id, { status: bulkAction })))
        setBulkAction('')
        setSelectedCourses([])
        fetchCourses()
        fetchAllCourses()
        showToast(`Successfully updated ${selectedCourses.length} courses`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    }
  }

  // Individual actions (permission‑aware)
  const handleStatusUpdate = async (courseId, newStatus) => {
    if (!canUpdateStatus) {
      showToast('You do not have permission to update course status', 'error')
      return
    }
    try {
      await coursesAPI.update(courseId, { status: newStatus })
      fetchCourses()
      fetchAllCourses()
      showToast('Course status updated successfully', 'success')
    } catch (err) {
      console.error('Error updating course status:', err)
      showToast('Failed to update course status', 'error')
    }
  }

  const handleDeleteCourse = courseId => {
    if (!canDelete) {
      showToast('You do not have permission to delete courses', 'error')
      return
    }
    const course = courses.find(c => c.course_id === courseId)
    showConfirmation(
      'Delete Course',
      `Are you sure you want to delete the course "${course?.title}"? This action cannot be undone.`,
      'delete',
      async () => {
        try {
          await coursesAPI.delete(courseId)
          fetchCourses()
          fetchAllCourses()
          showToast('Course deleted successfully', 'success')
        } catch (err) {
          console.error('Error deleting course:', err)
          showToast('Failed to delete course', 'error')
        }
      }
    )
  }

  // Utility functions
  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  const getLevelColor = level => {
    const levelObj = levels.find(l => l.value === level)
    return levelObj ? levelObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  const getModeIcon = mode => {
    const modeObj = modes.find(m => m.value === mode)
    return modeObj || { icon: Clock, color: 'text-gray-600' }
  }

  const formatLevel = level => {
    return level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Not Set'
  }

  const formatDate = dateString => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = price => {
    const value = Number(price)
    if (isNaN(value)) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const calculateDiscount = (fee, originalFee) => {
    if (!originalFee || parseFloat(originalFee) <= parseFloat(fee)) return 0
    return Math.round(((parseFloat(originalFee) - parseFloat(fee)) / parseFloat(originalFee)) * 100)
  }

  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
              <div className="h-3 bg-gray-200 rounded w-3"></div>
            </th>
            {[
              'Course',
              'Level',
              'Mode',
              'Enrolled',
              'Price',
              'Status',
              'Syllabus',
              'Created',
              'Actions',
            ].map(header => (
              <th
                key={header}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="h-3 bg-gray-200 rounded w-14"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-3"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-gray-200 rounded-md mr-1.5"></div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-0.5"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-14"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-10"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-14"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-3 p-3 pt-0">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage and monitor all your courses</p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {/* Import / Sample – only if canImport */}
          {canImport && (
            <div className="flex gap-1">
              <button
                onClick={generateSampleCSV}
                className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                title="Download Sample CSV Template"
              >
                <FileText className="w-2.5 h-2.5" />
                Sample
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                <Upload className="w-2.5 h-2.5" />
                Import
              </button>
            </div>
          )}

          {/* Export – only if canExport */}
          {canExport && (
            <button
              onClick={exportToCSV}
              disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-2.5 h-2.5" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}

          {/* New Course – only if canCreate */}
          {canCreate && (
            <button
              onClick={() => openCourseModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 
                 hover:from-primary-700 hover:to-primary-800 text-white rounded 
                 font-medium text-xs shadow-sm transition-all duration-200"
            >
              <Plus className="w-2.5 h-2.5" />
              New Course
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && canImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Courses</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>File must be in CSV format</li>
                  <li>Include all required columns (see sample)</li>
                  <li>Level: beginner, intermediate, or advanced</li>
                  <li>Mode: online_live, online_self_paced, or hybrid</li>
                  <li>Status: draft, published, or archived</li>
                  <li>Featured: true or false</li>
                  <li>Fee values should be numbers only (no currency symbols)</li>
                  <li>Syllabus PDF: URL to PDF file (optional)</li>
                </ul>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={generateSampleCSV}
                  className="flex items-center gap-1 px-3 py-2 text-xs border border-primary-300 rounded text-primary-700 bg-primary-50 hover:bg-primary-100 font-medium transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Download Sample Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Upload CSV File</p>
                  <p className="text-xs text-gray-500">Click to browse or drag and drop</p>
                </label>
              </div>

              {importLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    Importing courses...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-200">
          {/* Tabs and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusChange(tab.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${
                      activeTab === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} />
                    {tab.name}
                    <span
                      className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Bulk Actions and Filters */}
            <div className="flex flex-col sm:flex-row gap-1.5">
              {/* Bulk Actions – only if canBulk and any action possible */}
              {canBulk && (canUpdateStatus || canDelete) && selectedCourses.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="published">Publish</option>
                        <option value="draft">Move to Draft</option>
                        <option value="archived">Archive</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  >
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">
                    {selectedCourses.length} selected
                  </span>
                </div>
              )}

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filters {hasActiveFilters && '•'}
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-40 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Level Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={filters.level}
                    onChange={e => handleLevelChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Levels</option>
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={filters.mode}
                    onChange={e => handleModeChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Modes</option>
                    {modes.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Featured</label>
                  <select
                    value={filters.featured}
                    onChange={e => handleFeaturedChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Courses</option>
                    <option value="true">Featured</option>
                    <option value="false">Regular</option>
                  </select>
                </div>

                {/* Results Per Page */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Per Page</label>
                  <select
                    value={filters.limit}
                    onChange={e => handleLimitChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="15">15 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-medium text-blue-800">Active Filters:</span>
                    {filters.search && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Search: "{filters.search}"
                        <button
                          onClick={() => handleSearchChange('')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.level !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Level: {levels.find(l => l.value === filters.level)?.label}
                        <button
                          onClick={() => handleLevelChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.mode !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Mode: {modes.find(m => m.value === filters.mode)?.label}
                        <button
                          onClick={() => handleModeChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.featured !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Featured: {filters.featured === 'true' ? 'Yes' : 'No'}
                        <button
                          onClick={() => handleFeaturedChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.status !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Status: {statusOptions.find(s => s.value === filters.status)?.label}
                        <button
                          onClick={() => handleStatusChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Filter className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Courses</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchCourses}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : courses.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {/* Checkbox column – only if canBulk */}
                    {canBulk && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={selectedCourses.length === courses.length && courses.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                          disabled={!canBulk}
                        />
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Syllabus
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map(course => {
                    const modeData = getModeIcon(course.mode)
                    const ModeIcon = modeData.icon
                    const discount = calculateDiscount(course.fee, course.original_fee)
                    const enrollmentCount = course.enroll_count || 0
                    const seatsAvailable = course.seats_available || 0
                    const enrollmentPercentage =
                      seatsAvailable > 0
                        ? Math.min(100, (enrollmentCount / seatsAvailable) * 100)
                        : 0

                    return (
                      <tr key={course.course_id} className="hover:bg-gray-50 transition-colors">
                        {/* Checkbox – only if canBulk */}
                        {canBulk && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course.course_id)}
                              onChange={() => toggleCourseSelection(course.course_id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-gray-100 rounded-md flex items-center justify-center mr-1.5 border border-gray-200">
                              <BookOpen className="w-3 h-3 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900 line-clamp-1 flex items-center gap-0.5">
                                {course.title}
                                {course.featured && (
                                  <Sparkles
                                    className="w-2.5 h-2.5 text-yellow-500"
                                    title="Featured"
                                  />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                                <Star className="w-2 h-2 text-yellow-400 fill-current" />
                                <span>4.8</span>
                                <span className="mx-0.5">•</span>
                                <span>{course.duration}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}
                          >
                            {formatLevel(course.level)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <ModeIcon className={`w-3 h-3 ${modeData.color}`} />
                            {modes.find(m => m.value === course.mode)?.label}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            <div className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">{enrollmentCount}</span>
                              <span className="text-gray-400 mx-0.5">/</span>
                              <span className="text-gray-500">{seatsAvailable}</span>
                            </div>
                            {seatsAvailable > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className="bg-green-600 h-1 rounded-full"
                                  style={{ width: `${enrollmentPercentage}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {formatPrice(course.fee)}
                          </div>
                          {discount > 0 && (
                            <div className="flex items-center gap-0.5 text-xs mt-0.5">
                              <span className="text-gray-500 line-through">
                                {formatPrice(course.original_fee)}
                              </span>
                              <span className="text-green-600 font-medium">{discount}% off</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {canUpdateStatus ? (
                            <select
                              value={course.status || 'draft'}
                              onChange={e => handleStatusUpdate(course.course_id, e.target.value)}
                              className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(course.status || 'draft')}`}
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="archived">Archived</option>
                            </select>
                          ) : (
                            <StatusBadge
                              status={course.status || 'draft'}
                              statusOptions={statusOptions}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {course.syllabus_pdf ? (
                            <a
                              href={course.syllabus_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                              title="View Syllabus PDF"
                            >
                              <FaFilePdf className="w-4 h-4" />
                            </a>
                          ) : (
                            <FaFilePdf className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(course.createdAt)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center gap-0.5">
                            {/* Edit – only if canUpdate */}
                            {canUpdate && (
                              <button
                                onClick={() => openCourseModal(course)}
                                className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50 transition-colors"
                                title="Edit Course"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            {/* Delete – only if canDelete */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteCourse(course.course_id)}
                                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                                title="Delete Course"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No courses found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No courses match your search criteria. Try adjusting your filters.'
                    : 'Get started by creating your first course.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openCourseModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Create New Course
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <span>Showing</span>
                  <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                  <span>to</span>
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, pagination.totalItems)}
                  </span>
                  <span>of</span>
                  <span className="font-medium">{pagination.totalItems}</span>
                  <span>results</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.page === 1}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (filters.page <= 3) {
                      pageNum = i + 1
                    } else if (filters.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = filters.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-6 h-6 text-xs rounded border transition-colors ${
                          filters.page === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === pagination.totalPages}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={filters.page === pagination.totalPages}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal
        show={showCourseModal}
        course={editingCourse}
        onClose={closeCourseModal}
        onSaved={handleCourseSaved}
      />

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200">
              <div
                className={`p-1.5 rounded-full ${
                  confirmationModal.type === 'delete' || confirmationModal.type === 'bulkDelete'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{confirmationModal.title}</h3>
                <p className="text-xs text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3">
              <p className="text-xs text-gray-700">{confirmationModal.message}</p>
            </div>

            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
              <button
                onClick={hideConfirmation}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-2 py-1 text-xs font-medium text-white rounded focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors ${
                  confirmationModal.type === 'delete' || confirmationModal.type === 'bulkDelete'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseManagement
