import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react'
import {
  Search,
  Edit,
  Trash2,
  User,
  Users,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Filter,
  Plus,
  Clock,
  Star,
  Tag,
  MessageCircle,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bug,
  Zap,
  Lightbulb,
  Settings,
  UserCheck,
} from 'lucide-react'
import { supportAPI } from '../../services/api'
import { feedbackAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const FeedbackModal = lazy(() => import('./FeedbackModal'))

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

const FeedbackManagement = () => {
  const { user } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()
  const userData = user?.user

  const canManage = useMemo(() => isAdmin, [isAdmin])

  const canCreate = useMemo(
    () => hasPermission('create', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canView = useMemo(
    () => hasPermission('view', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdateStatus = useMemo(
    () => hasPermission('update_status', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canExport = useMemo(
    () => hasPermission('export', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canBulk = useMemo(
    () => hasPermission('bulk', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canViewMyFeedbacks = useMemo(
    () => hasPermission('my_feed_btn', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canViewStats = useMemo(
    () => hasPermission('stat', 'feedback', 'A2') || canManage,
    [hasPermission, canManage]
  )

  const [activeTab, setActiveTab] = useState('all')
  const [feedbacks, setFeedbacks] = useState([])
  const [allFeedbacks, setAllFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const [showMyFeedbacksOnly, setShowMyFeedbacksOnly] = useState(false)
  const user_id = userData?.user_id

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    rating: 'all',
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

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Available filter options
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      {
        value: 'pending',
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      },
      {
        value: 'reviewed',
        label: 'Reviewed',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
      },
      {
        value: 'in_progress',
        label: 'In Progress',
        color: 'bg-orange-100 text-orange-800 border border-orange-200',
      },
      {
        value: 'resolved',
        label: 'Resolved',
        color: 'bg-green-100 text-green-800 border border-green-200',
      },
      {
        value: 'closed',
        label: 'Closed',
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
      },
    ],
    []
  )

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      {
        value: 'general',
        label: 'General',
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
        icon: MessageCircle,
      },
      {
        value: 'bug',
        label: 'Bug Report',
        color: 'bg-red-100 text-red-800 border border-red-200',
        icon: Bug,
      },
      {
        value: 'feature',
        label: 'Feature Request',
        color: 'bg-purple-100 text-purple-800 border border-purple-200',
        icon: Lightbulb,
      },
      {
        value: 'ui',
        label: 'UI/UX',
        color: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        icon: Settings,
      },
      {
        value: 'performance',
        label: 'Performance',
        color: 'bg-teal-100 text-teal-800 border border-teal-200',
        icon: Zap,
      },
    ],
    []
  )

  const ratingOptions = useMemo(
    () => [
      { value: 'all', label: 'All Ratings' },
      { value: '5', label: '5 Stars' },
      { value: '4', label: '4 Stars' },
      { value: '3', label: '3 Stars' },
      { value: '2', label: '2 Stars' },
      { value: '1', label: '1 Star' },
    ],
    []
  )

  // Calculate tab counts based on allFeedbacks – respects the toggle
  const tabs = useMemo(() => {
    let filteredFeedbacks = allFeedbacks

    if (showMyFeedbacksOnly && user_id) {
      filteredFeedbacks = allFeedbacks.filter(feedback => feedback.user_id === user_id)
    }

    if (!filteredFeedbacks.length)
      return [
        { id: 'all', name: 'All Feedback', count: 0, icon: Users, color: 'text-gray-600' },
        { id: 'pending', name: 'Pending', count: 0, icon: Clock, color: 'text-yellow-600' },
        { id: 'unread', name: 'New', count: 0, icon: AlertCircle, color: 'text-red-600' },
        { id: 'resolved', name: 'Resolved', count: 0, icon: CheckCircle2, color: 'text-green-600' },
      ]

    const allCount = filteredFeedbacks.length
    const pendingCount = filteredFeedbacks.filter(f => f.status === 'pending').length
    const resolvedCount = filteredFeedbacks.filter(f => f.status === 'resolved').length
    const newCount = filteredFeedbacks.filter(
      f =>
        f.status === 'pending' && new Date(f.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length

    return [
      { id: 'all', name: 'All Feedback', count: allCount, icon: Users, color: 'text-gray-600' },
      {
        id: 'pending',
        name: 'Pending',
        count: pendingCount,
        icon: Clock,
        color: 'text-yellow-600',
      },
      { id: 'unread', name: 'New', count: newCount, icon: AlertCircle, color: 'text-red-600' },
      {
        id: 'resolved',
        name: 'Resolved',
        count: resolvedCount,
        icon: CheckCircle2,
        color: 'text-green-600',
      },
    ]
  }, [allFeedbacks, showMyFeedbacksOnly, user_id])

  // Stats calculation – respects the toggle, but only used if canViewStats
  const stats = useMemo(() => {
    let filteredFeedbacks = allFeedbacks

    if (showMyFeedbacksOnly && user_id) {
      filteredFeedbacks = allFeedbacks.filter(feedback => feedback.user_id === user_id)
    }

    if (!filteredFeedbacks.length)
      return [
        { number: '0', label: 'Total Feedback', icon: Users, color: 'text-blue-400' },
        { number: '0', label: 'Pending', icon: Clock, color: 'text-yellow-400' },
        { number: '0', label: 'Avg Rating', icon: Star, color: 'text-purple-400' },
        { number: '0', label: 'Resolved', icon: CheckCircle2, color: 'text-green-400' },
      ]

    const totalFeedback = filteredFeedbacks.length
    const pendingFeedback = filteredFeedbacks.filter(f => f.status === 'pending').length
    const resolvedFeedback = filteredFeedbacks.filter(f => f.status === 'resolved').length
    const averageRating =
      filteredFeedbacks.length > 0
        ? (
            filteredFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
            filteredFeedbacks.length
          ).toFixed(1)
        : 0

    return [
      {
        number: totalFeedback.toLocaleString(),
        label: 'Total Feedback',
        icon: Users,
        color: 'text-blue-400',
      },
      {
        number: pendingFeedback.toLocaleString(),
        label: 'Pending',
        icon: Clock,
        color: 'text-yellow-400',
      },
      { number: averageRating, label: 'Avg Rating', icon: Star, color: 'text-purple-400' },
      {
        number: resolvedFeedback.toLocaleString(),
        label: 'Resolved',
        icon: CheckCircle2,
        color: 'text-green-400',
      },
    ]
  }, [allFeedbacks, showMyFeedbacksOnly, user_id])

  // Build payload for API request – includes user_id filter when toggle is on
  const buildPayload = useCallback(() => {
    const payload = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      searchFields: ['message', 'category', 'user.full_name', 'user.email'],
      filters: {},
      sortBy: 'created_at',
      sortOrder: 'DESC',
    }

    if (filters.status !== 'all') payload.filters.status = filters.status
    if (filters.category !== 'all') payload.filters.category = filters.category
    if (filters.rating !== 'all') payload.filters.rating = parseInt(filters.rating)

    // Apply "My Feedbacks Only" filter if enabled and user has permission
    if (showMyFeedbacksOnly && user_id && canViewMyFeedbacks) {
      payload.filters.user_id = parseInt(user_id)
    }

    return payload
  }, [filters, showMyFeedbacksOnly, user_id, canViewMyFeedbacks])

  // Fetch feedbacks with filtering
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const payload = buildPayload()
      const response = await feedbackAPI.getAllFeedback(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        const feedbacksData = responseData.data?.feedbacks || []
        setFeedbacks(feedbacksData)

        const paginationData = responseData.data?.pagination
        setPagination({
          page: paginationData?.currentPage || filters.page,
          limit: filters.limit,
          totalItems: paginationData?.totalItems || feedbacksData.length,
          totalPages:
            paginationData?.totalPages ||
            Math.ceil((paginationData?.totalItems || feedbacksData.length) / filters.limit),
        })
      } else {
        setFeedbacks([])
        setPagination({ page: 1, limit: filters.limit, totalItems: 0, totalPages: 0 })
      }
    } catch (err) {
      setError('Failed to load feedback. Please try again.')
      console.error('Error fetching feedback:', err)
    } finally {
      setLoading(false)
    }
  }, [buildPayload, filters.limit])

  // Fetch all feedbacks for counting and export – respects toggle
  const fetchAllFeedbacks = useCallback(async () => {
    try {
      const payload = {
        page: 1,
        limit: 1000,
        search: '',
        searchFields: ['message', 'category', 'user.full_name', 'user.email'],
        filters: {},
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }

      if (showMyFeedbacksOnly && user_id && canViewMyFeedbacks) {
        payload.filters.user_id = parseInt(user_id)
      }

      const response = await feedbackAPI.getAllFeedback(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        setAllFeedbacks(responseData.data?.feedbacks || [])
      } else {
        setAllFeedbacks([])
      }
    } catch (err) {
      console.error('Error fetching all feedbacks:', err)
      setAllFeedbacks([])
    }
  }, [showMyFeedbacksOnly, user_id, canViewMyFeedbacks])

  // Fetch feedback statistics – still called, but only displayed if canViewStats
  const fetchFeedbackStats = useCallback(async () => {
    try {
      const response = await feedbackAPI.getFeedbackStats()
      return response.data?.success ? response.data.data : null
    } catch (err) {
      console.error('Error fetching feedback stats:', err)
      return null
    }
  }, [])

  // Fetch all feedbacks for export – respects toggle and filters
  const fetchAllFeedbacksForExport = async () => {
    try {
      const payload = {
        page: 1,
        limit: 1000,
        search: filters.search,
        searchFields: ['message', 'category', 'user.full_name', 'user.email'],
        filters: {},
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }

      if (filters.status !== 'all') payload.filters.status = filters.status
      if (filters.category !== 'all') payload.filters.category = filters.category
      if (filters.rating !== 'all') payload.filters.rating = parseInt(filters.rating)

      if (showMyFeedbacksOnly && user_id && canViewMyFeedbacks) {
        payload.filters.user_id = parseInt(user_id)
      }

      const response = await feedbackAPI.getAllFeedback(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        return responseData.data?.feedbacks || []
      }
      return []
    } catch (err) {
      console.error('Error fetching feedbacks for export:', err)
      throw err
    }
  }

  // Export to CSV – only if canExport
  const exportToCSV = async () => {
    if (!canExport) {
      showToast('You do not have permission to export feedback', 'error')
      return
    }

    try {
      setExportLoading(true)
      const allFeedbacks = await fetchAllFeedbacksForExport()

      if (!allFeedbacks || allFeedbacks.length === 0) {
        showToast('No feedback found to export.', 'error')
        return
      }

      const headers = [
        'Feedback ID',
        'User Name',
        'User Email',
        'Rating',
        'Category',
        'Message',
        'Status',
        'User Agent',
        'Page URL',
        'Created At',
        'Updated At',
      ]

      const csvRows = allFeedbacks.map(feedback => [
        feedback.feedback_id || '',
        `"${(feedback.user?.full_name || '').replace(/"/g, '""')}"`,
        `"${(feedback.user?.email || '').replace(/"/g, '""')}"`,
        feedback.rating || '',
        feedback.category || '',
        `"${(feedback.message || '').replace(/"/g, '""')}"`,
        feedback.status || '',
        `"${(feedback.user_agent || '').replace(/"/g, '""')}"`,
        `"${(feedback.page_url || '').replace(/"/g, '""')}"`,
        feedback.createdAt ? new Date(feedback.createdAt).toISOString() : '',
        feedback.updatedAt ? new Date(feedback.updatedAt).toISOString() : '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `feedback_export_${timestamp}`

      if (hasActiveFilters) {
        const filterParts = []
        if (filters.status !== 'all') filterParts.push(filters.status)
        if (filters.category !== 'all') filterParts.push(filters.category)
        if (filters.rating !== 'all') filterParts.push(`${filters.rating}stars`)
        if (filterParts.length > 0) filename += `_${filterParts.join('_')}`
      }

      filename += '.csv'

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Successfully exported ${allFeedbacks.length} feedback entries`, 'success')
    } catch (err) {
      console.error('Error exporting feedback:', err)
      showToast('Failed to export feedback. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Handler for "My Feedbacks Only" toggle – only if permitted
  const handleMyFeedbacksToggle = checked => {
    if (!canViewMyFeedbacks) return
    setShowMyFeedbacksOnly(checked)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  // Debounced fetch
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchFeedbacks(), 350)
    return () => clearTimeout(timeoutId)
  }, [fetchFeedbacks])

  useEffect(() => {
    fetchAllFeedbacks()
    fetchFeedbackStats()
  }, [fetchAllFeedbacks, fetchFeedbackStats])

  // Confirmation modal functions (unchanged)
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

  // Feedback modal – open for view/edit/create (permission checks)
  const openFeedbackModal = (feedback = null) => {
    if (feedback && !canView) {
      showToast('You do not have permission to view feedback details', 'error')
      return
    }
    if (!feedback && !canCreate) {
      showToast('You do not have permission to submit feedback', 'error')
      return
    }
    setEditingFeedback(feedback)
    setShowFeedbackModal(true)
  }

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false)
    setEditingFeedback(null)
  }

  const handleFeedbackSaved = () => {
    closeFeedbackModal()
    fetchFeedbacks()
    fetchAllFeedbacks()
    showToast('Feedback updated successfully!', 'success')
  }

  // Filter handlers (unchanged)
  const handleStatusChange = status => {
    setActiveTab(status)
    setFilters(prev => ({ ...prev, status: status === 'all' ? 'all' : status, page: 1 }))
  }
  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }))
  const handleStatusFilterChange = status => setFilters(prev => ({ ...prev, status, page: 1 }))
  const handleCategoryChange = category => setFilters(prev => ({ ...prev, category, page: 1 }))
  const handleRatingChange = rating => setFilters(prev => ({ ...prev, rating, page: 1 }))
  const handleLimitChange = newLimit =>
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }
  const clearAllFilters = () => {
    setFilters({ search: '', status: 'all', category: 'all', rating: 'all', page: 1, limit: 5 })
    setShowMyFeedbacksOnly(false)
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.category !== 'all' ||
      filters.rating !== 'all' ||
      (showMyFeedbacksOnly && canViewMyFeedbacks)
    )
  }, [filters, showMyFeedbacksOnly, canViewMyFeedbacks])

  // Selection and bulk actions – only if canBulk
  const toggleFeedbackSelection = feedbackId => {
    if (!canBulk) return
    setSelectedFeedbacks(prev =>
      prev.includes(feedbackId) ? prev.filter(id => id !== feedbackId) : [...prev, feedbackId]
    )
  }
  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedFeedbacks(
      selectedFeedbacks.length === feedbacks.length ? [] : feedbacks.map(f => f.feedback_id)
    )
  }
  const handleBulkAction = async () => {
    if (!canBulk) {
      showToast('You do not have permission for bulk actions', 'error')
      return
    }
    if (!bulkAction || selectedFeedbacks.length === 0) return

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) {
          showToast('You do not have permission to delete feedback', 'error')
          return
        }
        showConfirmation(
          'Delete Feedback',
          `Are you sure you want to delete ${selectedFeedbacks.length} selected feedback entries? This action cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedFeedbacks.map(id => feedbackAPI.deleteFeedback(id)))
            setBulkAction('')
            setSelectedFeedbacks([])
            fetchFeedbacks()
            fetchAllFeedbacks()
            showToast(
              `Successfully deleted ${selectedFeedbacks.length} feedback entries`,
              'success'
            )
          }
        )
      } else {
        if (!canUpdateStatus) {
          showToast('You do not have permission to update feedback status', 'error')
          return
        }
        await Promise.all(
          selectedFeedbacks.map(id => feedbackAPI.updateFeedbackStatus(id, bulkAction))
        )
        setBulkAction('')
        setSelectedFeedbacks([])
        fetchFeedbacks()
        fetchAllFeedbacks()
        showToast(`Successfully updated ${selectedFeedbacks.length} feedback entries`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    }
  }

  // Individual actions
  const handleStatusUpdate = async (feedbackId, newStatus) => {
    if (!canUpdateStatus) {
      showToast('You do not have permission to update feedback status', 'error')
      return
    }
    try {
      await feedbackAPI.updateFeedbackStatus(feedbackId, newStatus)
      fetchFeedbacks()
      fetchAllFeedbacks()
      showToast('Feedback status updated successfully', 'success')
    } catch (err) {
      console.error('Error updating feedback status:', err)
      showToast('Failed to update feedback status', 'error')
    }
  }

  const handleDeleteFeedback = feedbackId => {
    if (!canDelete) {
      showToast('You do not have permission to delete feedback', 'error')
      return
    }
    const feedback = feedbacks.find(f => f.feedback_id === feedbackId)
    showConfirmation(
      'Delete Feedback',
      `Are you sure you want to delete feedback from "${feedback?.user?.full_name}"? This action cannot be undone.`,
      'delete',
      async () => {
        try {
          await feedbackAPI.deleteFeedback(feedbackId)
          fetchFeedbacks()
          fetchAllFeedbacks()
          showToast('Feedback deleted successfully', 'success')
        } catch (err) {
          console.error('Error deleting feedback:', err)
          showToast('Failed to delete feedback', 'error')
        }
      }
    )
  }

  // Utility functions (unchanged)
  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }
  const getCategoryColor = category => {
    const categoryObj = categoryOptions.find(c => c.value === category)
    return categoryObj ? categoryObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }
  const formatDate = dateString => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  const formatDateTime = dateString => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const truncateText = (text, maxLength = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  const renderStars = rating => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }
  const getCategoryIcon = category => {
    const categoryObj = categoryOptions.find(c => c.value === category)
    const IconComponent = categoryObj?.icon || Tag
    return <IconComponent className="w-3 h-3" />
  }

  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
              <div className="h-3 bg-gray-200 rounded w-3"></div>
            </th>
            {['User', 'Feedback', 'Rating', 'Category', 'Status', 'Date', 'Actions'].map(header => (
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
                  <div className="h-8 w-8 bg-gray-200 rounded-full mr-1.5"></div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-0.5"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-32 mb-0.5"></div>
                <div className="h-2 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-8"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-14"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-12"></div>
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
          <p className="text-xs text-gray-600">Manage and respond to user feedback</p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
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

          <button
            onClick={() => fetchFeedbacks()}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Refresh
          </button>

          {/* Submit Feedback – only if canCreate */}
          {canCreate && (
            <button
              onClick={() => openFeedbackModal()}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Plus className="w-3 h-3" />
              Submit Feedback
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards – only if canViewStats */}
      {canViewStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.number}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gray-50`}>
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-200">
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

            {/* Search and Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-1.5">
              {/* Bulk Actions – only if canBulk and any action possible */}
              {canBulk && (canUpdateStatus || canDelete) && selectedFeedbacks.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="pending">Mark as Pending</option>
                        <option value="reviewed">Mark as Reviewed</option>
                        <option value="in_progress">Mark as In Progress</option>
                        <option value="resolved">Mark as Resolved</option>
                        <option value="closed">Mark as Closed</option>
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
                    {selectedFeedbacks.length} selected
                  </span>
                </div>
              )}

              {/* My Feedbacks Only Toggle – only if canViewMyFeedbacks */}
              {canViewMyFeedbacks && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    id="my-feedbacks-only"
                    checked={showMyFeedbacksOnly}
                    onChange={e => handleMyFeedbacksToggle(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                  />
                  <label
                    htmlFor="my-feedbacks-only"
                    className="text-xs font-medium text-gray-700 flex items-center gap-1 whitespace-nowrap"
                  >
                    <UserCheck className="w-3 h-3" />
                    My Feedbacks Only
                  </label>
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
                  placeholder="Search feedback..."
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
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => handleStatusFilterChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={filters.rating}
                    onChange={e => handleRatingChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {ratingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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

                {/* NEW: My Feedbacks Only Filter in Advanced Panel - Only for admin */}
                {/* {isAdmin && (
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMyFeedbacksOnly}
                        onChange={(e) => handleMyFeedbacksToggle(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                      />
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Show only my feedbacks
                      </span>
                    </label>
                  </div>
                )} */}
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
                    {filters.status !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Status: {statusOptions.find(s => s.value === filters.status)?.label}
                        <button
                          onClick={() => handleStatusFilterChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.category !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Category: {categoryOptions.find(c => c.value === filters.category)?.label}
                        <button
                          onClick={() => handleCategoryChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.rating !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Rating: {ratingOptions.find(r => r.value === filters.rating)?.label}
                        <button
                          onClick={() => handleRatingChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {canViewMyFeedbacks && showMyFeedbacksOnly && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        My Feedbacks Only
                        <button
                          onClick={() => handleMyFeedbacksToggle(false)}
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Feedback</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchFeedbacks}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {/* Checkbox column – only if canBulk */}
                    {canBulk && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedFeedbacks.length === feedbacks.length && feedbacks.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                          disabled={!canBulk}
                        />
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbacks.map(feedback => (
                    <tr key={feedback.feedback_id} className="hover:bg-gray-50 transition-colors">
                      {/* Checkbox – only if canBulk */}
                      {canBulk && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedFeedbacks.includes(feedback.feedback_id)}
                            onChange={() => toggleFeedbackSelection(feedback.feedback_id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2">
                            {feedback.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 line-clamp-1">
                              {feedback.user?.full_name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              <span>{feedback.user?.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-900">
                          <div className="text-gray-600 line-clamp-2">
                            {truncateText(feedback.message, 80)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {renderStars(feedback.rating)}
                          <span className="text-xs text-gray-500 ml-1">({feedback.rating})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(feedback.category)}`}
                        >
                          {getCategoryIcon(feedback.category)}
                          {feedback.category
                            ? feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)
                            : 'General'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {canUpdateStatus ? (
                          <select
                            value={feedback.status || 'pending'}
                            onChange={e => handleStatusUpdate(feedback.feedback_id, e.target.value)}
                            className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(feedback.status || 'pending')}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <StatusBadge
                            status={feedback.status || 'pending'}
                            statusOptions={statusOptions}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(feedback.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-0.5">
                          {/* View/Edit button – only if canView */}
                          {canView && (
                            <button
                              onClick={() => openFeedbackModal(feedback)}
                              className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50 transition-colors"
                              title="View Feedback"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          {/* Delete – only if canDelete */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteFeedback(feedback.feedback_id)}
                              className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                              title="Delete Feedback"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No feedback found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No feedback matches your search criteria. Try adjusting your filters.'
                    : 'No feedback has been submitted yet.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openFeedbackModal()}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 text-xs mx-auto"
                  >
                    <Plus className="w-3 h-3" />
                    Submit First Feedback
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

      {showFeedbackModal && (
        <Suspense fallback={null}>
          <FeedbackModal
            show={showFeedbackModal}
            feedback={editingFeedback}
            onClose={closeFeedbackModal}
            onSaved={handleFeedbackSaved}
          />
        </Suspense>
      )}

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

export default FeedbackManagement