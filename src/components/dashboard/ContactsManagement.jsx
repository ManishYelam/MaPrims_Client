// src/pages/dashboard/ContactsManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Filter,
  Plus,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Flag,
  Archive,
  RefreshCw,
} from 'lucide-react'
import { contactAPI } from '../../services/api'
import { usePermissions } from '../../hooks/usePermissions'
import ContactModal from './ContactModal'

const ContactsManagement = () => {
  const { hasPermission, canView, isAdmin } = usePermissions()

  const canExport = useMemo(
    () => hasPermission('export', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canUpdateStatus = useMemo(
    () => hasPermission('update_status', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canMarkRead = useMemo(
    () => hasPermission('mark_read', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canSendMail = useMemo(
    () => hasPermission('send_mail', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )
  const canBulk = useMemo(
    () => hasPermission('bulk', 'contact', 'A2') || isAdmin,
    [hasPermission, isAdmin]
  )

  const [activeTab, setActiveTab] = useState('all')
  const [contacts, setContacts] = useState([])
  const [allContacts, setAllContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContacts, setSelectedContacts] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Advanced Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    is_read: 'all',
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
    setTimeout(() => setToast(null), 4000)
  }

  // Available filter options
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      {
        value: 'Pending',
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      },
      {
        value: 'Reviewed',
        label: 'Reviewed',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
      },
      {
        value: 'Resolved',
        label: 'Resolved',
        color: 'bg-green-100 text-green-800 border border-green-200',
      },
    ],
    []
  )

  const priorityOptions = useMemo(
    () => [
      { value: 'all', label: 'All Priorities' },
      { value: 'Low', label: 'Low', color: 'bg-gray-100 text-gray-800 border border-gray-200' },
      {
        value: 'Medium',
        label: 'Medium',
        color: 'bg-orange-100 text-orange-800 border border-orange-200',
      },
      { value: 'High', label: 'High', color: 'bg-red-100 text-red-800 border border-red-200' },
    ],
    []
  )

  const readStatusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Read Status' },
      { value: 'read', label: 'Read' },
      { value: 'unread', label: 'Unread' },
    ],
    []
  )

  // Calculate tab counts based on allContacts
  const tabs = useMemo(() => {
    if (!allContacts.length)
      return [
        { id: 'all', name: 'All Contacts', count: 0, icon: Users, color: 'text-gray-600' },
        {
          id: 'Pending',
          name: 'Pending',
          count: 0,
          icon: Clock,
          color: 'text-yellow-600',
        },
        { id: 'unread', name: 'Unread', count: 0, icon: AlertCircle, color: 'text-red-600' },
        { id: 'Resolved', name: 'Resolved', count: 0, icon: CheckCircle2, color: 'text-green-600' },
      ]

    const allCount = allContacts.length
    const pendingCount = allContacts.filter(contact => contact.status === 'Pending').length
    const unreadCount = allContacts.filter(contact => !contact.is_read).length
    const resolvedCount = allContacts.filter(contact => contact.status === 'Resolved').length

    return [
      { id: 'all', name: 'All Contacts', count: allCount, icon: Users, color: 'text-gray-600' },
      {
        id: 'Pending',
        name: 'Pending',
        count: pendingCount,
        icon: Clock,
        color: 'text-yellow-600',
      },
      {
        id: 'unread',
        name: 'Unread',
        count: unreadCount,
        icon: AlertCircle,
        color: 'text-red-600',
      },
      {
        id: 'Resolved',
        name: 'Resolved',
        count: resolvedCount,
        icon: CheckCircle2,
        color: 'text-green-600',
      },
    ]
  }, [allContacts])

  // Stats calculation using actual API fields
  const stats = useMemo(() => {
    if (!allContacts.length)
      return [
        { number: '0', label: 'Total Contacts', icon: Users, color: 'text-blue-400' },
        { number: '0', label: 'Pending', icon: Clock, color: 'text-yellow-400' },
        { number: '0', label: 'Unread', icon: AlertCircle, color: 'text-red-400' },
        { number: '0', label: 'Resolved', icon: CheckCircle2, color: 'text-green-400' },
      ]

    const totalContacts = allContacts.length
    const pendingContacts = allContacts.filter(contact => contact.status === 'Pending').length
    const unreadContacts = allContacts.filter(contact => !contact.is_read).length
    const resolvedContacts = allContacts.filter(contact => contact.status === 'Resolved').length

    return [
      {
        number: totalContacts.toLocaleString(),
        label: 'Total Contacts',
        icon: Users,
        color: 'text-blue-400',
      },
      {
        number: pendingContacts.toLocaleString(),
        label: 'Pending',
        icon: Clock,
        color: 'text-yellow-400',
      },
      {
        number: unreadContacts.toLocaleString(),
        label: 'Unread',
        icon: AlertCircle,
        color: 'text-red-400',
      },
      {
        number: resolvedContacts.toLocaleString(),
        label: 'Resolved',
        icon: CheckCircle2,
        color: 'text-green-400',
      },
    ]
  }, [allContacts])

  // Fetch contacts with filtering
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
      }

      if (filters.status !== 'all') params.status = filters.status
      if (filters.priority !== 'all') params.priority = filters.priority
      if (filters.is_read !== 'all') params.is_read = filters.is_read === 'read'

      const response = await contactAPI.getContacts(params)
      const responseData = response.data

      if (responseData && responseData.success) {
        const contactsData = responseData.data || []
        setContacts(contactsData)
        setPagination({
          page: responseData.currentPage || filters.page,
          limit: filters.limit,
          totalItems: responseData.totalRecords || contactsData.length,
          totalPages:
            responseData.totalPages ||
            Math.ceil((responseData.totalRecords || contactsData.length) / filters.limit),
        })
      } else {
        setContacts([])
        setPagination({ page: 1, limit: filters.limit, totalItems: 0, totalPages: 0 })
      }
    } catch (err) {
      setError('Failed to load contacts. Please try again.')
      console.error('Error fetching contacts:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch all contacts for counting and export
  const fetchAllContacts = useCallback(async () => {
    try {
      const response = await contactAPI.getContacts({ limit: 1000 })
      const responseData = response.data
      if (responseData && responseData.success) {
        setAllContacts(responseData.data || [])
      } else {
        setAllContacts([])
      }
    } catch (err) {
      console.error('Error fetching all contacts:', err)
      setAllContacts([])
    }
  }, [])

  // Fetch contact statistics
  const fetchContactStats = useCallback(async () => {
    try {
      const response = await contactAPI.getStats()
      const responseData = response.data
      if (responseData && responseData.success) {
        return responseData.data
      }
      return null
    } catch (err) {
      console.error('Error fetching contact stats:', err)
      return null
    }
  }, [])

  // Fetch all contacts for export (with filters)
  const fetchAllContactsForExport = async () => {
    try {
      const params = { limit: 1000 }
      if (filters.search.trim()) params.search = filters.search.trim()
      if (filters.status !== 'all') params.status = filters.status
      if (filters.priority !== 'all') params.priority = filters.priority
      if (filters.is_read !== 'all') params.is_read = filters.is_read === 'read'

      const response = await contactAPI.getContacts(params)
      const responseData = response.data
      if (responseData && responseData.success) {
        return responseData.data || []
      }
      return []
    } catch (err) {
      console.error('Error fetching contacts for export:', err)
      throw err
    }
  }

  // Export to CSV
  const exportToCSV = async () => {
    if (!canExport) {
      showToast('You do not have permission to export contacts', 'error')
      return
    }
    try {
      setExportLoading(true)
      const allContacts = await fetchAllContactsForExport()

      if (!allContacts || allContacts.length === 0) {
        showToast('No contacts found to export.', 'error')
        return
      }

      const headers = [
        'Contact ID',
        'Name',
        'Email',
        'Phone',
        'Subject',
        'Message',
        'Status',
        'Priority',
        'Read Status',
        'Admin Remarks',
        'Responded At',
        'Created At',
        'Updated At',
      ]

      const csvRows = allContacts.map(contact => [
        contact.contact_id || '',
        `"${(contact.name || '').replace(/"/g, '""')}"`,
        `"${(contact.email || '').replace(/"/g, '""')}"`,
        `"${(contact.phone || '').replace(/"/g, '""')}"`,
        `"${(contact.subject || '').replace(/"/g, '""')}"`,
        `"${(contact.message || '').replace(/"/g, '""')}"`,
        contact.status || '',
        contact.priority || '',
        contact.is_read ? 'Read' : 'Unread',
        `"${(contact.admin_remarks || '').replace(/"/g, '""')}"`,
        contact.responded_at ? new Date(contact.responded_at).toISOString() : '',
        contact.createdAt ? new Date(contact.createdAt).toISOString() : '',
        contact.updatedAt ? new Date(contact.updatedAt).toISOString() : '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `contacts_export_${timestamp}`

      if (hasActiveFilters) {
        const filterParts = []
        if (filters.search) filterParts.push('search')
        if (filters.status !== 'all') filterParts.push(filters.status)
        if (filters.priority !== 'all') filterParts.push(filters.priority)
        if (filters.is_read !== 'all') filterParts.push(filters.is_read)
        if (filterParts.length > 0) filename += `_${filterParts.join('_')}`
      }
      filename += '.csv'

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Successfully exported ${allContacts.length} contacts to ${filename}`, 'success')
    } catch (err) {
      console.error('Error exporting contacts:', err)
      showToast('Failed to export contacts. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Debounced search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchContacts(), 350)
    return () => clearTimeout(timeoutId)
  }, [fetchContacts])

  // Fetch all contacts for counting on mount
  useEffect(() => {
    fetchAllContacts()
    fetchContactStats()
  }, [fetchAllContacts, fetchContactStats])

  // Confirmation modal handlers
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

  // Contact modal handlers
  const openContactModal = (contact = null) => {
    setEditingContact(contact)
    setShowContactModal(true)
  }
  const closeContactModal = () => {
    setShowContactModal(false)
    setEditingContact(null)
  }
  const handleContactSaved = () => {
    closeContactModal()
    fetchContacts()
    fetchAllContacts()
    showToast('Contact updated successfully!', 'success')
  }

  // Filter change handlers
  const handleStatusChange = status => {
    setActiveTab(status)
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? 'all' : status === 'unread' ? 'all' : status,
      is_read: status === 'unread' ? 'unread' : 'all',
      page: 1,
    }))
  }

  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }))
  const handleStatusFilterChange = status => setFilters(prev => ({ ...prev, status, page: 1 }))
  const handlePriorityChange = priority => setFilters(prev => ({ ...prev, priority, page: 1 }))
  const handleReadStatusChange = readStatus =>
    setFilters(prev => ({ ...prev, is_read: readStatus, page: 1 }))
  const handleLimitChange = newLimit =>
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      is_read: 'all',
      page: 1,
      limit: 5,
    })
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.is_read !== 'all'
    )
  }, [filters])

  // Selection handlers
  const toggleContactSelection = contactId => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    )
  }
  const toggleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === contacts.length ? [] : contacts.map(c => c.contact_id)
    )
  }

  // Bulk action handler – now uses canBulk to show the dropdown, and individual permissions inside
  const handleBulkAction = async () => {
    if (!bulkAction || selectedContacts.length === 0) return

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) {
          showToast('You do not have permission to delete contacts', 'error')
          return
        }
        showConfirmation(
          'Delete Contacts',
          `Are you sure you want to delete ${selectedContacts.length} selected contact(s)? This action cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedContacts.map(id => contactAPI.deleteContact(id)))
            setBulkAction('')
            setSelectedContacts([])
            fetchContacts()
            fetchAllContacts()
            showToast(`Successfully deleted ${selectedContacts.length} contacts`, 'success')
          }
        )
      } else {
        // Bulk status update
        if (!canUpdateStatus) {
          showToast('You do not have permission to update contact status', 'error')
          return
        }
        await Promise.all(
          selectedContacts.map(id => contactAPI.updateStatus(id, { status: bulkAction }))
        )
        setBulkAction('')
        setSelectedContacts([])
        fetchContacts()
        fetchAllContacts()
        showToast(`Successfully updated ${selectedContacts.length} contacts`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    }
  }

  // Individual contact actions
  const handleStatusUpdate = async (contactId, newStatus) => {
    if (!canUpdateStatus) {
      showToast('You do not have permission to update contact status', 'error')
      return
    }
    try {
      await contactAPI.updateStatus(contactId, { status: newStatus })
      fetchContacts()
      fetchAllContacts()
      showToast('Contact status updated successfully', 'success')
    } catch (err) {
      console.error('Error updating contact status:', err)
      showToast('Failed to update contact status', 'error')
    }
  }

  const handleMarkAsRead = async contactId => {
    if (!canMarkRead) {
      showToast('You do not have permission to mark contacts as read', 'error')
      return
    }
    try {
      await contactAPI.updateStatus(contactId, { is_read: true })
      fetchContacts()
      fetchAllContacts()
      showToast('Contact marked as read', 'success')
    } catch (err) {
      console.error('Error marking contact as read:', err)
      showToast('Failed to mark contact as read', 'error')
    }
  }

  const handleDeleteContact = contactId => {
    if (!canDelete) {
      showToast('You do not have permission to delete contacts', 'error')
      return
    }
    const contact = contacts.find(c => c.contact_id === contactId)
    showConfirmation(
      'Delete Contact',
      `Are you sure you want to delete the contact from "${contact?.name}"? This action cannot be undone.`,
      'delete',
      async () => {
        try {
          await contactAPI.deleteContact(contactId)
          fetchContacts()
          fetchAllContacts()
          showToast('Contact deleted successfully', 'success')
        } catch (err) {
          console.error('Error deleting contact:', err)
          showToast('Failed to delete contact', 'error')
        }
      }
    )
  }

  // Utility functions
  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  const getPriorityColor = priority => {
    const priorityObj = priorityOptions.find(p => p.value === priority)
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
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

  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
              <div className="h-3 bg-gray-200 rounded w-3"></div>
            </th>
            {['Contact', 'Phone', 'Message', 'Status', 'Priority', 'Read', 'Date', 'Actions'].map(
              header => (
                <th
                  key={header}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-3 bg-gray-200 rounded w-14"></div>
                </th>
              )
            )}
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
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-32 mb-0.5"></div>
                <div className="h-2 bg-gray-200 rounded w-24"></div>
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

  // If user doesn't have view permission, show access denied
  if (!canView) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-sm text-gray-600">You do not have permission to view contacts.</p>
      </div>
    )
  }

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
          <h1 className="text-xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-xs text-gray-600">Manage and respond to contact form submissions</p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
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
            onClick={() => fetchContacts()}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
              {/* Bulk Actions – only if user has bulk permission AND at least one action permission */}
              {canBulk && (canUpdateStatus || canDelete) && selectedContacts.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="Pending">Mark as Pending</option>
                        <option value="Reviewed">Mark as Reviewed</option>
                        <option value="Resolved">Mark as Resolved</option>
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
                    {selectedContacts.length} selected
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
                  placeholder="Search contacts..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
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

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={e => handlePriorityChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Read Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Read Status
                  </label>
                  <select
                    value={filters.is_read}
                    onChange={e => handleReadStatusChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {readStatusOptions.map(option => (
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
                    {filters.priority !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
                        <button
                          onClick={() => handlePriorityChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {filters.is_read !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Read: {readStatusOptions.find(r => r.value === filters.is_read)?.label}
                        <button
                          onClick={() => handleReadStatusChange('all')}
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

        {/* Table Container with Fixed Height */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Filter className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Contacts</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchContacts}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : contacts.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Read
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
                  {contacts.map(contact => (
                    <tr key={contact.contact_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.contact_id)}
                          onChange={() => toggleContactSelection(contact.contact_id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2">
                            {contact.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 line-clamp-1">
                              {contact.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              <span>{contact.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5 text-gray-400" />
                          <span>{contact.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-900">
                          <div className="font-medium text-gray-900 mb-0.5">
                            {contact.subject || 'No Subject'}
                          </div>
                          <div className="text-gray-600 line-clamp-2">
                            {truncateText(contact.message, 80)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {canUpdateStatus ? (
                          <select
                            value={contact.status || 'Pending'}
                            onChange={e => handleStatusUpdate(contact.contact_id, e.target.value)}
                            className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(contact.status || 'Pending')}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status || 'Pending')}`}
                          >
                            {contact.status || 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(contact.priority)}`}
                        >
                          {contact.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.is_read
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {contact.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(contact.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openContactModal(contact)}
                            className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50 transition-colors"
                            title="View Contact"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canMarkRead && !contact.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(contact.contact_id)}
                              className="text-blue-600 hover:text-blue-900 p-0.5 rounded hover:bg-blue-50 transition-colors"
                              title="Mark as Read"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          {canSendMail && (
                            <button
                              onClick={() => {
                                window.location.href = `mailto:${contact.email}`
                              }}
                              className="text-green-600 hover:text-green-900 p-0.5 rounded hover:bg-green-50 transition-colors"
                              title="Send Email"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteContact(contact.contact_id)}
                              className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                              title="Delete Contact"
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
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No contacts found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No contacts match your search criteria. Try adjusting your filters.'
                    : 'No contact messages have been submitted yet.'}
                </p>
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

      {/* Contact Modal */}
      <ContactModal
        show={showContactModal}
        contact={editingContact}
        onClose={closeContactModal}
        onSaved={handleContactSaved}
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

export default ContactsManagement
