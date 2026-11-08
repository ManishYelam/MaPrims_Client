import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react'
import {
  Search,
  Edit,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Building,
  Filter,
  X,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  User,
  Eye,
  RefreshCw,
  TrendingUp,
  BookOpen,
  FileText,
  CalendarClock,
  FileText as FileTextIcon,
  Users,
} from 'lucide-react'
import { demoRequestAPI } from '../../services/api'
import { coursesAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import DemoRequestModal from './DemoRequestModal'
import toast from 'react-hot-toast'

// Memoized components (unchanged)
const StatusBadge = React.memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0]
  const StatusIcon = statusObj.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}
    >
      <StatusIcon className="w-3 h-3" />
      {statusObj.label}
    </span>
  )
})
StatusBadge.displayName = 'StatusBadge'

const UserAvatar = React.memo(({ name, email }) => (
  <div className="flex items-center">
    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2">
      {name?.charAt(0) || 'U'}
    </div>
    <div>
      <div className="text-xs font-medium text-gray-900 line-clamp-1">{name || 'Unknown User'}</div>
      <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
        <Mail className="w-2.5 h-2.5" />
        <span>{email || 'No email'}</span>
      </div>
    </div>
  </div>
))
UserAvatar.displayName = 'UserAvatar'

const LoadingSkeleton = React.memo(() => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
            <div className="h-3 bg-gray-200 rounded w-3"></div>
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, index) => (
          <tr key={index} className="animate-pulse">
            {Array.from({ length: 6 }).map((_, cellIndex) => (
              <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
))
LoadingSkeleton.displayName = 'LoadingSkeleton'

// Constants
const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    icon: Clock,
    description: 'Awaiting review',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: CalendarClock,
    description: 'Demo scheduled',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border border-green-200',
    icon: CheckCircle,
    description: 'Demo completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border border-red-200',
    icon: AlertCircle,
    description: 'Request cancelled',
  },
]

const DemoRequestManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  // Fine‑grained permissions – fallback to 'manage' or admin
  const canManage = useMemo(
    () => hasPermission('manage', 'demo-request', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canCreate = useMemo(
    () => hasPermission('create', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdate = useMemo(
    () => hasPermission('update', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdateStatus = useMemo(
    () => hasPermission('update_status', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canExport = useMemo(
    () => hasPermission('export', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canBulk = useMemo(
    () => hasPermission('bulk', 'demo-request', 'A2') || canManage,
    [hasPermission, canManage]
  )

  const tableRef = useRef(null)

  const [activeTab, setActiveTab] = useState('all')
  const [demoRequests, setDemoRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRequests, setSelectedRequests] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showDemoRequestModal, setShowDemoRequestModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filter states
  const filtersRef = useRef({
    search: '',
    status: 'all',
    course_id: 'all',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10,
  })
  const [filters, setFilters] = useState(filtersRef.current)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  })

  // Confirmation modal
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
    data: null,
  })

  // Courses for filter dropdown (admin only)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const coursesCacheRef = useRef({ data: [], timestamp: 0, loading: false })

  // Show toast
  const showToast = useCallback((message, type = 'success') => {
    toast[type](message)
  }, [])

  // Date formatting
  const formatDate = useCallback((dateString, includeTime = false) => {
    if (!dateString) return 'Not set'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
        options.hour12 = false
      }
      return date.toLocaleDateString('en-US', options)
    } catch {
      return 'Invalid date'
    }
  }, [])

  const getTimeAgo = useCallback(dateString => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      const now = new Date()
      const seconds = Math.floor((now - date) / 1000)

      let interval = seconds / 31536000
      if (interval > 1)
        return Math.floor(interval) === 1 ? '1 year ago' : `${Math.floor(interval)} years ago`
      interval = seconds / 2592000
      if (interval > 1)
        return Math.floor(interval) === 1 ? '1 month ago' : `${Math.floor(interval)} months ago`
      interval = seconds / 86400
      if (interval > 1)
        return Math.floor(interval) === 1 ? '1 day ago' : `${Math.floor(interval)} days ago`
      interval = seconds / 3600
      if (interval > 1)
        return Math.floor(interval) === 1 ? '1 hour ago' : `${Math.floor(interval)} hours ago`
      interval = seconds / 60
      if (interval > 1)
        return Math.floor(interval) === 1 ? '1 minute ago' : `${Math.floor(interval)} minutes ago`
      return seconds <= 1 ? 'just now' : `${Math.floor(seconds)} seconds ago`
    } catch {
      return 'Invalid date'
    }
  }, [])

  // Has active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.course_id !== 'all' ||
      filters.start_date !== '' ||
      filters.end_date !== ''
    )
  }, [filters])

  // Tabs calculation
  const tabs = useMemo(() => {
    if (!allRequests.length) {
      const baseTabs = [
        { id: 'all', name: 'All Requests', count: 0, icon: FileTextIcon, color: 'text-gray-600' },
        { id: 'pending', name: 'Pending', count: 0, icon: Clock, color: 'text-yellow-600' },
        {
          id: 'scheduled',
          name: 'Scheduled',
          count: 0,
          icon: CalendarClock,
          color: 'text-blue-600',
        },
      ]
      if (canUpdateStatus) {
        baseTabs.push(
          {
            id: 'completed',
            name: 'Completed',
            count: 0,
            icon: CheckCircle,
            color: 'text-green-600',
          },
          { id: 'cancelled', name: 'Cancelled', count: 0, icon: AlertCircle, color: 'text-red-600' }
        )
      }
      return baseTabs
    }

    const allCount = allRequests.length
    const pendingCount = allRequests.filter(req => req.status === 'pending').length
    const scheduledCount = allRequests.filter(req => req.status === 'scheduled').length
    const completedCount = allRequests.filter(req => req.status === 'completed').length
    const cancelledCount = allRequests.filter(req => req.status === 'cancelled').length

    const tabData = [
      {
        id: 'all',
        name: 'All Requests',
        count: allCount,
        icon: FileTextIcon,
        color: 'text-gray-600',
      },
      {
        id: 'pending',
        name: 'Pending',
        count: pendingCount,
        icon: Clock,
        color: 'text-yellow-600',
      },
      {
        id: 'scheduled',
        name: 'Scheduled',
        count: scheduledCount,
        icon: CalendarClock,
        color: 'text-blue-600',
      },
    ]

    if (canUpdateStatus) {
      tabData.push(
        {
          id: 'completed',
          name: 'Completed',
          count: completedCount,
          icon: CheckCircle,
          color: 'text-green-600',
        },
        {
          id: 'cancelled',
          name: 'Cancelled',
          count: cancelledCount,
          icon: AlertCircle,
          color: 'text-red-600',
        }
      )
    }
    return tabData
  }, [allRequests, canUpdateStatus])

  // Upcoming demos count (admin only)
  const upcomingDemos = useMemo(() => {
    if (!demoRequests.length || !isAdmin) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    return demoRequests.filter(request => {
      if (!request.preferred_date) return false
      const demoDate = new Date(request.preferred_date)
      if (isNaN(demoDate.getTime())) return false
      demoDate.setHours(0, 0, 0, 0)
      return demoDate >= today && demoDate <= nextWeek && request.status === 'scheduled'
    }).length
  }, [demoRequests, isAdmin])

  // Stats cards (admin only)
  const statsCards = useMemo(() => {
    if (!stats || statsLoading) {
      return [
        { number: '...', label: 'Total Requests', icon: FileTextIcon, color: 'text-blue-400' },
        { number: '...', label: 'Pending', icon: Clock, color: 'text-yellow-400' },
        { number: '...', label: 'Upcoming Demos', icon: CalendarClock, color: 'text-blue-400' },
        { number: '...', label: 'Completion Rate', icon: CheckCircle, color: 'text-green-400' },
      ]
    }

    const completionRate =
      stats.total > 0
        ? `${Math.round(((stats.byStatus?.find(s => s.status === 'completed')?.count || 0) / stats.total) * 100)}%`
        : '0%'

    return [
      {
        number: stats.total || 0,
        label: 'Total Requests',
        icon: FileTextIcon,
        color: 'text-blue-400',
      },
      {
        number: stats.byStatus?.find(s => s.status === 'pending')?.count || 0,
        label: 'Pending',
        icon: Clock,
        color: 'text-yellow-400',
      },
      {
        number: upcomingDemos,
        label: 'Upcoming Demos',
        icon: CalendarClock,
        color: 'text-blue-400',
      },
      {
        number: completionRate,
        label: 'Completion Rate',
        icon: CheckCircle,
        color: 'text-green-400',
      },
    ]
  }, [stats, statsLoading, upcomingDemos])

  // Build request parameters
  const buildRequestParams = useCallback(
    (includeAll = false) => {
      const params = {
        page: filters.page,
        limit: includeAll ? 10000 : filters.limit,
        search: filters.search.trim() || undefined,
        searchFields: ['name', 'email', 'company', 'message'],
        filters: {
          status: filters.status !== 'all' ? filters.status : undefined,
          course_id: filters.course_id !== 'all' ? filters.course_id : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        },
      }
      Object.keys(params.filters).forEach(
        key => params.filters[key] === undefined && delete params.filters[key]
      )
      return params
    },
    [filters]
  )

  // Transform API response
  const transformRequestData = useCallback(requests => {
    return requests.map(request => ({
      demo_req_id: request.demo_req_id,
      user_id: request.user_id,
      course_id: request.course_id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      company: request.company,
      message: request.message,
      preferred_date: request.preferred_date,
      status: request.status,
      metadata: request.metadata,
      created_at: request.createdAt || request.created_at,
      updated_at: request.updatedAt || request.updated_at,
      Course: request.course || request.Course,
      user: request.user,
    }))
  }, [])

  // Fetch demo requests
  const fetchDemoRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const requestParams = buildRequestParams()
      const response = await demoRequestAPI.getAll(requestParams)
      const responseData = response.data

      if (responseData?.success) {
        const requests = responseData.demoRequests || responseData.data || []
        setDemoRequests(transformRequestData(requests))
        if (responseData.pagination) setPagination(responseData.pagination)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'Failed to load demo requests. Please try again.'
      setError(errorMessage)
      console.error('Error fetching demo requests:', err)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [buildRequestParams, transformRequestData, showToast])

  // Fetch all requests for counting
  const fetchAllRequests = useCallback(async () => {
    try {
      const params = { page: 1, limit: 10000, filters: { sortBy: 'createdAt', sortOrder: 'DESC' } }
      const response = await demoRequestAPI.getAll(params)
      if (response.data?.success) {
        const requests = response.data.demoRequests || response.data.data || []
        setAllRequests(transformRequestData(requests))
      }
    } catch (err) {
      console.error('Error fetching all requests:', err)
    }
  }, [transformRequestData])

  // Fetch courses for filter dropdown (admin only)
  const fetchCourses = useCallback(async () => {
    const cache = coursesCacheRef.current
    const CACHE_TTL = 5 * 60 * 1000

    if (cache.data.length > 0 && Date.now() - cache.timestamp < CACHE_TTL) {
      setCourses(cache.data)
      return
    }
    if (cache.loading) return

    try {
      setCoursesLoading(true)
      cache.loading = true

      const response = await coursesAPI.getDropdownList()
      if (response.data?.success) {
        const coursesData = response.data.courses || []
        setCourses(coursesData)
        cache.data = coursesData
        cache.timestamp = Date.now()
      } else {
        const fallback = await coursesAPI.getAll({
          status: 'published',
          limit: 100,
          sortBy: 'title',
          sortOrder: 'ASC',
        })
        if (fallback.data?.success) {
          const coursesData = fallback.data.courses || []
          setCourses(coursesData)
          cache.data = coursesData
          cache.timestamp = Date.now()
        }
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
      showToast('Failed to load courses', 'error')
    } finally {
      setCoursesLoading(false)
      cache.loading = false
    }
  }, [showToast])

  // Fetch statistics (admin only)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await demoRequestAPI.getStats()
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Export to CSV
  const fetchAllRequestsForExport = useCallback(async () => {
    try {
      const requestParams = buildRequestParams(true)
      const response = await demoRequestAPI.getAll(requestParams)
      if (response.data?.success) {
        const requests = response.data.demoRequests || response.data.data || []
        return transformRequestData(requests)
      }
      return []
    } catch (err) {
      console.error('Error fetching requests for export:', err)
      throw err
    }
  }, [buildRequestParams, transformRequestData])

  const exportToCSV = useCallback(async () => {
    if (!canExport) {
      showToast('You do not have permission to export demo requests', 'error')
      return
    }
    try {
      setExportLoading(true)
      const allRequests = await fetchAllRequestsForExport()
      if (!allRequests || allRequests.length === 0) {
        showToast('No demo requests found to export.', 'error')
        return
      }

      const headers = [
        'Request ID',
        'Name',
        'Email',
        'Phone',
        'Company',
        'Course',
        'Status',
        'Preferred Date',
        'Message',
        'Created At',
        'Updated At',
      ]

      const csvRows = allRequests.map(request => [
        request.demo_req_id,
        `"${(request.name || '').replace(/"/g, '""')}"`,
        `"${(request.email || '').replace(/"/g, '""')}"`,
        `"${(request.phone || '').replace(/"/g, '""')}"`,
        `"${(request.company || '').replace(/"/g, '""')}"`,
        `"${(request.Course?.title || '').replace(/"/g, '""')}"`,
        request.status,
        request.preferred_date ? new Date(request.preferred_date).toISOString() : '',
        `"${(request.message || '').replace(/"/g, '""')}"`,
        request.created_at ? new Date(request.created_at).toISOString() : '',
        request.updated_at ? new Date(request.updated_at).toISOString() : '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `demo_requests_export_${timestamp}`

      if (hasActiveFilters) {
        const filterParts = []
        if (filters.status !== 'all') filterParts.push(filters.status)
        if (filters.course_id !== 'all') filterParts.push('course_filter')
        if (filterParts.length > 0) filename += `_${filterParts.join('_')}`
      }
      filename += '.csv'

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Successfully exported ${allRequests.length} demo requests`, 'success')
    } catch (err) {
      console.error('Error exporting demo requests:', err)
      showToast('Failed to export demo requests. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }, [canExport, fetchAllRequestsForExport, hasActiveFilters, filters, showToast])

  // Debounced search
  const debounceRef = useRef(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchDemoRequests(), 300)
    return () => clearTimeout(debounceRef.current)
  }, [fetchDemoRequests])

  // Initial data fetch
  useEffect(() => {
    fetchDemoRequests()
    fetchAllRequests()
    if (isAdmin) {
      fetchCourses()
      fetchStats()
    }
  }, [fetchDemoRequests, fetchAllRequests, fetchCourses, fetchStats, isAdmin])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchDemoRequests()
    fetchAllRequests()
    if (isAdmin) fetchStats()
  }, [fetchDemoRequests, fetchAllRequests, fetchStats, isAdmin])

  // Filter handlers
  const updateFilters = useCallback(
    updates => setFilters(prev => ({ ...prev, ...updates, page: 1 })),
    []
  )
  const handleSearchChange = useCallback(value => updateFilters({ search: value }), [updateFilters])
  const handleStatusChange = useCallback(
    status => {
      setActiveTab(status)
      updateFilters({ status: status === 'all' ? 'all' : status })
    },
    [updateFilters]
  )
  const handleCourseChange = useCallback(
    courseId => updateFilters({ course_id: courseId }),
    [updateFilters]
  )
  const handleDateChange = useCallback(
    (field, value) => updateFilters({ [field]: value }),
    [updateFilters]
  )
  const handleLimitChange = useCallback(
    newLimit => updateFilters({ limit: parseInt(newLimit) }),
    [updateFilters]
  )
  const handlePageChange = useCallback(
    newPage => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        updateFilters({ page: newPage })
        if (tableRef.current) tableRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [pagination.totalPages, updateFilters]
  )

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      course_id: 'all',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 10,
    })
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }, [showToast])

  // Selection handlers
  const toggleRequestSelection = useCallback(requestId => {
    setSelectedRequests(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    )
  }, [])
  const toggleSelectAll = useCallback(() => {
    setSelectedRequests(
      selectedRequests.length === demoRequests.length
        ? []
        : demoRequests.map(req => req.demo_req_id)
    )
  }, [selectedRequests.length, demoRequests])

  // Modal handlers
  const openDemoRequestModal = useCallback((request = null) => {
    setEditingRequest(request)
    setShowDemoRequestModal(true)
  }, [])
  const closeDemoRequestModal = useCallback(() => {
    setShowDemoRequestModal(false)
    setEditingRequest(null)
  }, [])
  const handleRequestSaved = useCallback(() => {
    closeDemoRequestModal()
    handleRefresh()
    showToast('Demo request saved successfully!', 'success')
  }, [closeDemoRequestModal, handleRefresh, showToast])

  // Confirmation modal
  const showConfirmation = useCallback((title, message, type, onConfirm, data = null) => {
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  }, [])
  const hideConfirmation = useCallback(() => {
    setConfirmationModal({
      show: false,
      title: '',
      message: '',
      type: '',
      onConfirm: null,
      data: null,
    })
  }, [])
  const handleConfirm = useCallback(() => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }, [confirmationModal, hideConfirmation])

  // Bulk action handler
  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedRequests.length === 0) return
    try {
      setActionLoading('bulk')
      if (bulkAction === 'delete') {
        if (!canDelete) {
          showToast('You do not have permission to delete demo requests', 'error')
          return
        }
        showConfirmation(
          'Delete Demo Requests',
          `Are you sure you want to delete ${selectedRequests.length} selected request(s)? This action cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedRequests.map(id => demoRequestAPI.delete(id)))
            setBulkAction('')
            setSelectedRequests([])
            handleRefresh()
            showToast(`Successfully deleted ${selectedRequests.length} requests`, 'success')
          }
        )
      } else {
        if (!canUpdateStatus) {
          showToast('You do not have permission to update demo request status', 'error')
          return
        }
        await Promise.all(selectedRequests.map(id => demoRequestAPI.updateStatus(id, bulkAction)))
        setBulkAction('')
        setSelectedRequests([])
        handleRefresh()
        showToast(`Successfully updated ${selectedRequests.length} requests`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    } finally {
      setActionLoading(null)
    }
  }, [
    bulkAction,
    selectedRequests,
    canDelete,
    canUpdateStatus,
    handleRefresh,
    showToast,
    showConfirmation,
  ])

  // Individual request actions
  const handleStatusUpdate = useCallback(
    async (requestId, newStatus) => {
      if (!canUpdateStatus) {
        showToast('You do not have permission to update demo request status', 'error')
        return
      }
      try {
        setActionLoading(requestId)
        await demoRequestAPI.updateStatus(requestId, newStatus)
        handleRefresh()
        showToast('Request status updated successfully', 'success')
      } catch (err) {
        console.error('Error updating request status:', err)
        showToast('Failed to update request status', 'error')
      } finally {
        setActionLoading(null)
      }
    },
    [canUpdateStatus, handleRefresh, showToast]
  )

  const handleDeleteRequest = useCallback(
    requestId => {
      if (!canDelete) {
        showToast('You do not have permission to delete demo requests', 'error')
        return
      }
      const request = demoRequests.find(r => r.demo_req_id === requestId)
      showConfirmation(
        'Delete Demo Request',
        `Are you sure you want to delete the demo request from "${request?.name}"? This action cannot be undone.`,
        'delete',
        async () => {
          try {
            setActionLoading(requestId)
            await demoRequestAPI.delete(requestId)
            handleRefresh()
            showToast('Demo request deleted successfully', 'success')
          } catch (err) {
            console.error('Error deleting demo request:', err)
            showToast('Failed to delete demo request', 'error')
          } finally {
            setActionLoading(null)
          }
        }
      )
    },
    [demoRequests, canDelete, handleRefresh, showToast, showConfirmation]
  )

  // Memoized table row
  const RequestRow = React.memo(
    ({
      request,
      canUpdate,
      canUpdateStatus,
      canDelete,
      canBulk,
      selectedRequests,
      onSelect,
      onEdit,
      onDelete,
      onStatusUpdate,
    }) => {
      const statusInfo = STATUS_OPTIONS.find(s => s.value === request.status) || STATUS_OPTIONS[0]

      return (
        <tr className="hover:bg-gray-50 transition-colors">
          {/* Checkbox column – only if user has bulk permission */}
          {canBulk && (
            <td className="px-3 py-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedRequests.includes(request.demo_req_id)}
                onChange={() => onSelect(request.demo_req_id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
              />
            </td>
          )}
          <td className="px-3 py-2 whitespace-nowrap">
            <div>
              <div className="text-xs font-medium text-gray-900 line-clamp-1">
                {request.name}
                {request.company && <span className="text-gray-500 ml-1">• {request.company}</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">ID: #{request.demo_req_id}</div>
            </div>
          </td>
          <td className="px-3 py-2 whitespace-nowrap">
            <div className="flex items-center">
              {request.Course?.thumbnail_image ? (
                <img
                  src={request.Course.thumbnail_image}
                  alt={request.Course.title}
                  className="w-6 h-6 rounded mr-1.5 object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-100 rounded mr-1.5 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-gray-500" />
                </div>
              )}
              <div className="max-w-[150px]">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {request.Course?.title || 'Course deleted'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {request.Course?.short_description || 'N/A'}
                </div>
              </div>
            </div>
          </td>
          <td className="px-3 py-2 whitespace-nowrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <Mail className="w-2.5 h-2.5 text-gray-400" />
                <span className="truncate max-w-[120px]">{request.email}</span>
              </div>
              {request.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <Phone className="w-2.5 h-2.5 text-gray-400" />
                  <span>{request.phone}</span>
                </div>
              )}
            </div>
          </td>
          <td className="px-3 py-2 whitespace-nowrap">
            <div className="flex items-center gap-1">
              {statusInfo.icon && (
                <statusInfo.icon
                  className={`w-3 h-3 ${statusInfo.color.replace('bg-', 'text-').split(' ')[0]}`}
                />
              )}
              {canUpdateStatus ? (
                <select
                  value={request.status}
                  onChange={e => onStatusUpdate(request.demo_req_id, e.target.value)}
                  disabled={actionLoading === request.demo_req_id}
                  className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${statusInfo.color} ${actionLoading === request.demo_req_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={request.status} statusOptions={STATUS_OPTIONS} />
              )}
            </div>
            {request.preferred_date && (
              <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                <CalendarDays className="w-2.5 h-2.5 inline mr-0.5 flex-shrink-0" />
                <span className="truncate">{formatDate(request.preferred_date)}</span>
              </div>
            )}
          </td>
          <td className="px-3 py-2 whitespace-nowrap">
            <div className="text-xs text-gray-900">{formatDate(request.created_at, true)}</div>
            <div className="text-xs text-gray-500">{getTimeAgo(request.created_at)}</div>
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
            <div className="flex items-center gap-0.5">
              {canUpdate && (
                <button
                  onClick={() => onEdit(request)}
                  className="text-primary-600 hover:text-primary-900 p-0.5 rounded hover:bg-primary-50 transition-colors"
                  title="Edit"
                  disabled={actionLoading === request.demo_req_id}
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(request.demo_req_id)}
                  className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                  title="Delete"
                  disabled={actionLoading === request.demo_req_id}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </td>
        </tr>
      )
    }
  )
  RequestRow.displayName = 'RequestRow'

  return (
    <div className="space-y-3 p-3 pt-0" ref={tableRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">
            {isAdmin ? 'Manage and track all demo requests' : 'Track your demo session requests'}
          </p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canExport && (
            <button
              onClick={exportToCSV}
              disabled={exportLoading || demoRequests.length === 0}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-2.5 h-2.5" />
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {canCreate && (
            <button
              onClick={() => openDemoRequestModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 
                 hover:from-primary-700 hover:to-primary-800 text-white rounded 
                 font-medium text-xs shadow-sm transition-all duration-200"
            >
              <Plus className="w-2.5 h-2.5" />
              Request Demo
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards – admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.number}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {stat.label === 'Total Requests' && stats && !statsLoading && (
                    <>
                      <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                      <span>+{stats?.monthCount || 0} this month</span>
                    </>
                  )}
                  {stat.label === 'Pending' && statsLoading ? (
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    stat.label === 'Pending' && 'Needs attention'
                  )}
                  {stat.label === 'Upcoming Demos' && statsLoading ? (
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    stat.label === 'Upcoming Demos' && 'Next 7 days'
                  )}
                  {stat.label === 'Completion Rate' && statsLoading ? (
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    stat.label === 'Completion Rate' && 'Completed requests'
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Content */}
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
                    className={`px-2 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
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
              {/* Bulk Actions – only if user has bulk permission AND at least one action permission */}
              {canBulk && (canUpdateStatus || canDelete) && selectedRequests.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md p-1">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    disabled={actionLoading === 'bulk'}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white disabled:opacity-50"
                  >
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="scheduled">Mark as Scheduled</option>
                        <option value="completed">Mark as Completed</option>
                        <option value="cancelled">Mark as Cancelled</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || actionLoading === 'bulk'}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  >
                    {actionLoading === 'bulk' ? 'Processing...' : 'Apply'}
                  </button>
                  <span className="text-xs text-primary-700 font-medium">
                    {selectedRequests.length} selected
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
                <Filter className="w-3 h-3" />
                Filters {hasActiveFilters && '•'}
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search requests..."
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
                {/* Course Filter – admin only */}
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
                    <select
                      value={filters.course_id}
                      onChange={e => handleCourseChange(e.target.value)}
                      disabled={coursesLoading}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    >
                      <option value="all">All Courses</option>
                      {coursesLoading ? (
                        <option>Loading courses...</option>
                      ) : (
                        courses.map(course => (
                          <option key={course.course_id} value={course.course_id}>
                            {course.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Date Range */}
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={e => handleDateChange('start_date', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={e => handleDateChange('end_date', e.target.value)}
                      min={filters.start_date}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Results Per Page */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Per Page</label>
                  <select
                    value={filters.limit}
                    onChange={e => handleLimitChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
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
                    {filters.status !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Status: {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
                        <button
                          onClick={() => handleStatusChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.course_id !== 'all' && isAdmin && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Course:{' '}
                        {courses.find(c => c.course_id == filters.course_id)?.title ||
                          filters.course_id}
                        <button
                          onClick={() => handleCourseChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {(filters.start_date || filters.end_date) && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Date: {filters.start_date || 'Start'} to {filters.end_date || 'End'}
                        <button
                          onClick={() => {
                            handleDateChange('start_date', '')
                            handleDateChange('end_date', '')
                          }}
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
            <div className="flex-1">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Requests</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : demoRequests.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {/* Checkbox header – only if user has bulk permission */}
                    {canBulk && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedRequests.length === demoRequests.length &&
                            demoRequests.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                          disabled={actionLoading === 'bulk'}
                        />
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demoRequests.map(request => (
                    <RequestRow
                      key={request.demo_req_id}
                      request={request}
                      canUpdate={canUpdate}
                      canUpdateStatus={canUpdateStatus}
                      canDelete={canDelete}
                      canBulk={canBulk}
                      selectedRequests={selectedRequests}
                      onSelect={toggleRequestSelection}
                      onEdit={openDemoRequestModal}
                      onDelete={handleDeleteRequest}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileTextIcon className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No demo requests found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No requests match your search criteria. Try adjusting your filters.'
                    : 'Get started by requesting your first demo.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openDemoRequestModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Request Demo
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

      {/* Demo Request Modal */}
      {showDemoRequestModal && (
        <DemoRequestModal
          show={showDemoRequestModal}
          request={editingRequest}
          onClose={closeDemoRequestModal}
          onSaved={handleRequestSaved}
          canCreate={canCreate}
          canUpdate={canUpdate}
        />
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

export default React.memo(DemoRequestManagement)
