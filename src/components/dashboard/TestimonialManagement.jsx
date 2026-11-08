// src/components/admin/TestimonialManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react'
import {
  Search, Edit, Trash2, FileText, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal,
  CheckCircle2, XCircle, RefreshCw, Eye, Heart, Tag, Globe, Calendar as CalendarIcon,
  Star, Users, Briefcase, Link as LinkIcon, Award, TrendingUp,
  Clock, User, CheckCircle, AlertCircle,Linkedin
} from 'lucide-react'
import { testimonialAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import TestimonialModal from '../ui/TestimonialModal'

// ---------- Status Badge ----------
const StatusBadge = React.memo(({ status }) => {
  const config = {
    pending:  { label: 'Pending',  className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border border-green-300' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border border-red-300' }
  }
  const { label, className } = config[status] || config.pending
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
})
StatusBadge.displayName = 'StatusBadge'

// ---------- Main Component ----------
const TestimonialManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  // Permissions
  const canManage = useMemo(() => isAdmin, [isAdmin])
  const canCreate = useMemo(() => hasPermission('create', 'testimonials', 'A2') || canManage, [hasPermission, canManage])
  const canUpdate = useMemo(() => hasPermission('update', 'testimonials', 'A2') || canManage, [hasPermission, canManage])
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'testimonials', 'A2') || canManage, [hasPermission, canManage])
  const canDelete = useMemo(() => hasPermission('delete', 'testimonials', 'A2') || canManage, [hasPermission, canManage])
  const canExport = useMemo(() => hasPermission('export', 'testimonials', 'A2') || canManage, [hasPermission, canManage])
  const canBulk = useMemo(() => hasPermission('bulk', 'testimonials', 'A2') || canManage, [hasPermission, canManage])

  // ---------- State ----------
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [allTestimonialsCount, setAllTestimonialsCount] = useState(0)
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [typeCounts, setTypeCounts] = useState({ general: 0, course: 0, service: 0 })
  const [selectedTestimonials, setSelectedTestimonials] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Filters & pagination
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    testimonial_type: 'all',
    featured: 'all', // all, true, false
    rating_min: '',
    rating_max: '',
    technology: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 7
  })

  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)

  // ---------- Tabs ----------
  const tabs = useMemo(() => {
    const allCount = allTestimonialsCount
    const pendingCount = statusCounts.pending || 0
    const approvedCount = statusCounts.approved || 0
    const rejectedCount = statusCounts.rejected || 0
    return [
      { id: 'all',       name: 'All',        count: allCount,      icon: FileText,      color: 'text-gray-600' },
      { id: 'pending',   name: 'Pending',    count: pendingCount,  icon: Clock,         color: 'text-yellow-600' },
      { id: 'approved',  name: 'Approved',   count: approvedCount, icon: CheckCircle2,  color: 'text-green-600' },
      { id: 'rejected',  name: 'Rejected',   count: rejectedCount, icon: XCircle,       color: 'text-red-600' }
    ]
  }, [allTestimonialsCount, statusCounts])

  // ---------- API Fetch ----------
  const fetchTestimonials = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      const backendFilters = {}
      if (filters.status !== 'all') backendFilters.status = filters.status
      if (filters.testimonial_type !== 'all') backendFilters.testimonial_type = filters.testimonial_type
      if (filters.featured !== 'all') backendFilters.featured = filters.featured === 'true'
      if (filters.technology) backendFilters.technology = filters.technology
      if (filters.rating_min) backendFilters.rating_min = parseInt(filters.rating_min)
      if (filters.rating_max) backendFilters.rating_max = parseInt(filters.rating_max)
      if (filters.fromDate) backendFilters.created_at_gte = new Date(filters.fromDate).toISOString()
      if (filters.toDate) backendFilters.created_at_lte = new Date(filters.toDate).toISOString()

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: ['name', 'content', 'title', 'role', 'company', 'technology'],
        filters: backendFilters,
        sortBy: 'display_order',
        sortOrder: 'ASC'
      }
      
      const response = await testimonialAPI.getAll(payload)
      if (!controller.signal.aborted) {
        const responseData = response.data
        setTestimonials(responseData?.data || [])
        setTotalItems(responseData?.totalRecords || 0)
        setTotalPages(responseData?.totalPages || 1)
        const counts = responseData?.counts || {}
        setAllTestimonialsCount(counts.total || 0)
        setStatusCounts({
          pending: counts.pending || 0,
          approved: counts.approved || 0,
          rejected: counts.rejected || 0
        })
        setTypeCounts({
          general: counts.general || 0,
          course: counts.course || 0,
          service: counts.service || 0
        })
        setError(null)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load testimonials')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
      fetchingRef.current = false
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }, [filters])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchTestimonials()
    showToast('Data refreshed', 'success')
  }, [fetchTestimonials])

  useEffect(() => { fetchTestimonials() }, [fetchTestimonials])
  useEffect(() => { setFilters(prev => ({ ...prev, page: 1 })) }, [filters.search, filters.status, filters.limit])

  // ---------- Toast & Confirmation ----------
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const [confirmationModal, setConfirmationModal] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, data: null
  })
  const showConfirmation = (title, message, type, onConfirm, data = null) =>
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  const hideConfirmation = () => setConfirmationModal({ show: false, title: '', message: '', type: '', onConfirm: null, data: null })
  const handleConfirm = () => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }

  // ---------- Modal handlers ----------
  const openModal = (testimonial = null) => {
    if (testimonial && !canUpdate) { showToast('No permission to edit', 'error'); return }
    if (!testimonial && !canCreate) { showToast('No permission to create', 'error'); return }
    setEditingTestimonial(testimonial)
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditingTestimonial(null) }
  const handleSaved = () => { closeModal(); refreshData(); showToast('Testimonial saved!', 'success') }

  // ---------- Filter UI ----------
  const handleStatusChange = status => setFilters(prev => ({ ...prev, status, page: 1 }))
  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }))
  const handleLimitChange = newLimit => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  const handlePageChange = newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage })) }
  const clearAllFilters = () => {
    setFilters({
      search: '', status: 'all', testimonial_type: 'all', featured: 'all',
      rating_min: '', rating_max: '', technology: '', fromDate: '', toDate: '', page: 1, limit: 7
    })
    showToast('Filters cleared', 'info')
  }
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.status !== 'all' || filters.testimonial_type !== 'all' ||
           filters.featured !== 'all' || filters.rating_min !== '' || filters.rating_max !== '' ||
           filters.technology !== '' || filters.fromDate !== '' || filters.toDate !== ''
  }, [filters])

  // ---------- Bulk actions ----------
  const toggleSelection = id => {
    if (!canBulk) return
    setSelectedTestimonials(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }
  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedTestimonials(selectedTestimonials.length === testimonials.length ? [] : testimonials.map(t => t.testimonial_id))
  }
  const handleBulkAction = async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return }
    if (!bulkAction || selectedTestimonials.length === 0) return
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return }
        showConfirmation('Delete Testimonials', `Delete ${selectedTestimonials.length} testimonial(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedTestimonials.map(id => testimonialAPI.delete(id)))
          setBulkAction(''); setSelectedTestimonials([]); refreshData()
          showToast(`Deleted ${selectedTestimonials.length} testimonials`, 'success')
        })
      } else {
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return }
        await Promise.all(selectedTestimonials.map(id => testimonialAPI.update(id, { status: bulkAction })))
        setBulkAction(''); setSelectedTestimonials([]); refreshData()
        showToast(`Updated ${selectedTestimonials.length} testimonials to ${bulkAction}`, 'success')
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error') }
  }

  // ---------- Individual actions ----------
  const handleStatusUpdate = async (id, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return }
    try {
      await testimonialAPI.update(id, { status: newStatus })
      refreshData(); showToast('Status updated', 'success')
    } catch (err) { console.error(err); showToast('Update failed', 'error') }
  }
  const handleDelete = id => {
    if (!canDelete) { showToast('No permission', 'error'); return }
    const testimonial = testimonials.find(t => t.testimonial_id === id)
    showConfirmation('Delete Testimonial', `Delete testimonial from "${testimonial?.name}"?`, 'delete', async () => {
      await testimonialAPI.delete(id); refreshData(); showToast('Deleted', 'success')
    })
  }
  const handleToggleFeatured = async (id, currentFeatured) => {
    if (!canUpdate) { showToast('No permission', 'error'); return }
    try {
      await testimonialAPI.update(id, { featured: !currentFeatured })
      refreshData(); showToast('Featured toggled', 'success')
    } catch (err) { console.error(err); showToast('Update failed', 'error') }
  }

  // ---------- Export CSV ----------
  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission', 'error'); return }
    if (testimonials.length === 0) { showToast('No data to export', 'error'); return }
    setExportLoading(true)
    try {
      const headers = [
        'ID', 'Name', 'Role', 'Company', 'Rating', 'Title', 'Content',
        'Before Salary', 'After Salary', 'Duration', 'Technology',
        'LinkedIn URL', 'Avatar', 'Status', 'Featured', 'Display Order',
        'Created By', 'Updated By', 'Created At', 'Updated At'
      ]
      const csvRows = testimonials.map(t => [
        t.testimonial_id || '',
        `"${(t.name || '').replace(/"/g, '""')}"`,
        `"${(t.role || '').replace(/"/g, '""')}"`,
        `"${(t.company || '').replace(/"/g, '""')}"`,
        t.rating || '',
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.content || '').replace(/"/g, '""').slice(0, 500)}"`,
        t.before_salary || '',
        t.after_salary || '',
        t.duration || '',
        t.technology || '',
        t.linkedin_url || '',
        t.avatar || '',
        t.status || 'pending',
        t.featured ? 'Yes' : 'No',
        t.display_order || 0,
        t.created_by || '',
        t.updated_by || '',
        t.createdAt ? new Date(t.createdAt).toISOString() : '',
        t.updatedAt ? new Date(t.updatedAt).toISOString() : ''
      ])
      const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `testimonials_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      showToast(`Exported ${testimonials.length} testimonials`, 'success')
    } catch (err) { console.error(err); showToast('Export failed', 'error') }
    finally { setExportLoading(false) }
  }

  // ---------- Helper functions ----------
  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Unknown'
  const truncate = (str, max = 50) => str?.length > max ? str.slice(0, max) + '…' : str || '-'
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
    ))
  }

  // ---------- Loading Skeleton ----------
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {canBulk && <th className="px-3 py-2 w-8"></th>}
              <th className="px-3 py-2">Name / Role</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Content</th>
              <th className="px-3 py-2">Technology</th>
              <th className="px-3 py-2">Salary Hike</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filters.limit }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {canBulk && <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-3"></div></td>}
                <td className="px-3 py-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-100 rounded w-16 mt-1"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-32"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                <td className="px-3 py-2"><div className="h-5 bg-gray-200 rounded w-14"></div></td>
                <td className="px-3 py-2"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                <td className="px-3 py-2"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ---------- Render ----------
  return (
    <div className="space-y-3 p-3 pt-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
          toast.type === 'success' ? 'bg-green-50 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage and monitor all testimonials</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
              <Download className="w-2.5 h-2.5"/> {exportLoading ? 'Exporting...' : 'Export All'}
            </button>
          )}
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`}/> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded text-xs shadow-sm">
              <Plus className="w-2.5 h-2.5"/> New Testimonial
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-sm flex items-center gap-1 ${
                      filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs' : 'text-gray-600 hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-3 h-3 ${filters.status === tab.id ? tab.color : ''}`}/> {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full ${
                      filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selectedTestimonials.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border rounded px-1.5 py-0.5">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="pending">Set Pending</option>
                        <option value="approved">Set Approved</option>
                        <option value="rejected">Set Rejected</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs">
                    Apply
                  </button>
                  <span className="text-xs text-primary-700">{selectedTestimonials.length} selected</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                <SlidersHorizontal className="w-3 h-3"/> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3"/>
                <input type="text" placeholder="Search testimonials..." value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border rounded text-xs w-full sm:w-40"/>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select value={filters.testimonial_type} onChange={e => setFilters(prev => ({ ...prev, testimonial_type: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded">
                    <option value="all">All Types</option>
                    <option value="general">General</option>
                    <option value="course">Course</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Featured</label>
                  <select value={filters.featured} onChange={e => setFilters(prev => ({ ...prev, featured: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded">
                    <option value="all">All</option>
                    <option value="true">Featured</option>
                    <option value="false">Not Featured</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rating</label>
                  <div className="flex gap-1">
                    <input type="number" placeholder="Min" value={filters.rating_min} onChange={e => setFilters(prev => ({ ...prev, rating_min: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded" min="1" max="5"/>
                    <span className="text-xs self-center">–</span>
                    <input type="number" placeholder="Max" value={filters.rating_max} onChange={e => setFilters(prev => ({ ...prev, rating_max: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded" min="1" max="5"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Technology</label>
                  <input type="text" value={filters.technology} onChange={e => setFilters(prev => ({ ...prev, technology: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded" placeholder="e.g., SAP, React"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-1">From Date</label>
                  <input type="date" value={filters.fromDate} onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">To Date</label>
                  <input type="date" value={filters.toDate} onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-20 px-2 py-1 text-xs border rounded">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded mt-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    Active Filters:
                    {filters.search && <span className="bg-blue-100 px-1 rounded">Search: {filters.search} <button onClick={() => handleSearchChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.status !== 'all' && <span className="bg-blue-100 px-1 rounded">Status: {tabs.find(t=>t.id===filters.status)?.name} <button onClick={()=>handleStatusChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.testimonial_type !== 'all' && <span className="bg-blue-100 px-1 rounded">Type: {filters.testimonial_type} <button onClick={()=>setFilters(prev=>({...prev,testimonial_type:'all'}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.featured !== 'all' && <span className="bg-blue-100 px-1 rounded">Featured: {filters.featured} <button onClick={()=>setFilters(prev=>({...prev,featured:'all'}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.technology && <span className="bg-blue-100 px-1 rounded">Tech: {filters.technology} <button onClick={()=>setFilters(prev=>({...prev,technology:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {(filters.rating_min || filters.rating_max) && <span className="bg-blue-100 px-1 rounded">Rating: {filters.rating_min || '0'} – {filters.rating_max || '5'} <button onClick={()=>setFilters(prev=>({...prev,rating_min:'',rating_max:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {(filters.fromDate || filters.toDate) && <span className="bg-blue-100 px-1 rounded">Date: {filters.fromDate} – {filters.toDate} <button onClick={()=>setFilters(prev=>({...prev,fromDate:'',toDate:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                  </div>
                  <button onClick={clearAllFilters} className="text-xs text-blue-600">Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading || refreshing ? <LoadingSkeleton /> : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500"/></div>
                <h3 className="text-sm font-bold">Unable to Load Testimonials</h3><p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
              </div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    {canBulk && <th className="px-3 py-2 w-8"><input type="checkbox" checked={selectedTestimonials.length === testimonials.length && testimonials.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" disabled={!canBulk}/></th>}
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Name / Role</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Company</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Rating</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Content</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Technology</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Salary Hike</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Featured</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map(testimonial => (
                    <tr key={testimonial.testimonial_id} className="hover:bg-gray-50">
                      {canBulk && <td className="px-3 py-2"><input type="checkbox" checked={selectedTestimonials.includes(testimonial.testimonial_id)} onChange={() => toggleSelection(testimonial.testimonial_id)} className="rounded w-3 h-3"/></td>}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                            {testimonial.avatar ? (
                              <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                            ) : (testimonial.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{testimonial.name || 'Anonymous'}</div>
                            <div className="text-[10px] text-gray-500">{testimonial.role || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{testimonial.company || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(testimonial.rating)}
                          <span className="text-xs ml-1 text-gray-600">{testimonial.rating}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="max-w-xs truncate">{truncate(testimonial.content, 60)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {testimonial.technology ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                            <Tag className="w-2.5 h-2.5 mr-0.5"/> {testimonial.technology}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {testimonial.before_salary && testimonial.after_salary ? (
                          <div className="flex flex-col">
                            <span className="text-green-600 font-medium">{testimonial.after_salary}</span>
                            <span className="text-[10px] text-gray-400">from {testimonial.before_salary}</span>
                            {testimonial.duration && <span className="text-[10px] text-gray-500">{testimonial.duration}</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {canUpdateStatus ? (
                          <select value={testimonial.status} onChange={e => handleStatusUpdate(testimonial.testimonial_id, e.target.value)}
                            className={`text-xs rounded-full border-0 focus:ring-1 px-1.5 py-0.5 ${
                              testimonial.status === 'approved' ? 'bg-green-100 text-green-800' :
                              testimonial.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : <StatusBadge status={testimonial.status} />}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleToggleFeatured(testimonial.testimonial_id, testimonial.featured)}
                          className={`p-1 rounded transition-colors ${testimonial.featured ? 'text-yellow-500 hover:text-yellow-700' : 'text-gray-300 hover:text-gray-500'}`}
                          title={testimonial.featured ? 'Unfeature' : 'Feature'}
                          disabled={!canUpdate}
                        >
                          <Star className={`w-4 h-4 ${testimonial.featured ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-0.5">
                          {canUpdate && <button onClick={() => openModal(testimonial)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded"><Edit className="w-3 h-3"/></button>}
                          {canDelete && <button onClick={() => handleDelete(testimonial.testimonial_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded"><Trash2 className="w-3 h-3"/></button>}
                          {testimonial.linkedin_url && (
                            <a href={testimonial.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-0.5 rounded">
                              <Linkedin className="w-3 h-3"/>
                            </a>
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
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><FileText className="w-4 h-4 text-gray-400"/></div>
                <h3 className="text-sm font-medium">No testimonials found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Create your first testimonial.'}</p>
                {canCreate && <button onClick={() => openModal()} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"><Plus className="w-2.5 h-2.5"/> New Testimonial</button>}
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="border-t bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 gap-2">
                <div className="text-xs text-gray-600">
                  Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems}
                </div>
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronsLeft className="w-3 h-3"/></button>
                  <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 border rounded"><ChevronLeft className="w-3 h-3"/></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = totalPages <= 5 ? i + 1 : (filters.page <= 3 ? i + 1 : (filters.page >= totalPages - 2 ? totalPages - 4 + i : filters.page - 2 + i))
                    return (
                      <button key={p} onClick={() => handlePageChange(p)}
                        className={`w-6 h-6 text-xs rounded border ${filters.page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 border rounded"><ChevronRight className="w-3 h-3"/></button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 border rounded"><ChevronsRight className="w-3 h-3"/></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <TestimonialModal show={showModal} testimonial={editingTestimonial} onClose={closeModal} onSaved={handleSaved} />

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className={`p-1.5 rounded-full ${confirmationModal.type.includes('delete') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <AlertCircle className="w-3.5 h-3.5"/>
              </div>
              <div><h3 className="text-sm font-semibold">{confirmationModal.title}</h3><p className="text-xs text-gray-600">This action cannot be undone</p></div>
            </div>
            <div className="p-3"><p className="text-xs text-gray-700">{confirmationModal.message}</p></div>
            <div className="flex justify-end gap-2 p-3 border-t">
              <button onClick={hideConfirmation} className="px-2 py-1 text-xs border rounded">Cancel</button>
              <button onClick={handleConfirm} className={`px-2 py-1 text-xs text-white rounded ${confirmationModal.type.includes('delete') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestimonialManagement