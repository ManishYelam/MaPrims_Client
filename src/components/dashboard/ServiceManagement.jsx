import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import {
  Search,
  Edit,
  Trash2,
  Briefcase,
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
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { servicesAPI } from '../../services/api'
import ServiceModal from './ServiceModal'
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

const ServiceManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  const canManage = useMemo(() => isAdmin, [isAdmin])
  const canCreate = useMemo(
    () => hasPermission('create', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdate = useMemo(
    () => hasPermission('update', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canUpdateStatus = useMemo(
    () => hasPermission('update_status', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canExport = useMemo(
    () => hasPermission('export', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canImport = useMemo(
    () => hasPermission('import', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )
  const canBulk = useMemo(
    () => hasPermission('bulk', 'services', 'A2') || canManage,
    [hasPermission, canManage]
  )

  const [activeTab, setActiveTab] = useState('all')
  const [allServices, setAllServices] = useState([]) // Full list from API
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Filter & pagination state (client-side)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 5,
  })

  // --- Client-side filtering ---
  const filteredServices = useMemo(() => {
    let result = [...allServices]

    // Status filter (active tab)
    if (activeTab !== 'all') {
      result = result.filter(s => s.status === activeTab)
    }

    // Search filter (title, description, short_description)
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        s =>
          s.title?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.short_description?.toLowerCase().includes(searchLower)
      )
    }

    // Price range filter (basic price)
    const min = filters.minPrice ? parseFloat(filters.minPrice) : null
    const max = filters.maxPrice ? parseFloat(filters.maxPrice) : null
    if (min !== null || max !== null) {
      result = result.filter(s => {
        const price = s.metadata?.pricing?.basic?.price || 0
        if (min !== null && price < min) return false
        if (max !== null && price > max) return false
        return true
      })
    }

    return result
  }, [allServices, activeTab, filters.search, filters.minPrice, filters.maxPrice])

  // Pagination derived from filtered list
  const totalItems = filteredServices.length
  const totalPages = Math.ceil(totalItems / filters.limit)
  const paginatedServices = useMemo(() => {
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit
    return filteredServices.slice(start, end)
  }, [filteredServices, filters.page, filters.limit])

  // The table will display the paginated services
  const services = paginatedServices

  const pagination = {
    page: filters.page,
    limit: filters.limit,
    totalItems,
    totalPages,
  }

  // --- Status options ---
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

  // --- Tabs with counts (based on allServices) ---
  const tabs = useMemo(() => {
    if (!allServices.length)
      return [
        { id: 'all', name: 'All Services', count: 0, icon: Briefcase, color: 'text-gray-600' },
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

    const allCount = allServices.length
    const publishedCount = allServices.filter(s => s.status === 'published').length
    const draftCount = allServices.filter(s => s.status === 'draft').length
    const archivedCount = allServices.filter(s => s.status === 'archived').length

    return [
      { id: 'all', name: 'All Services', count: allCount, icon: Briefcase, color: 'text-gray-600' },
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
  }, [allServices])

  // --- API call: fetch all services using adminGetAll ---
  const fetchAllServices = useCallback(async () => {
    try {
      const payload = {
        limit: 10000, // effectively get all
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }
      const response = await servicesAPI.adminGetAll(payload)
      const responseData = response.data
      if (responseData && responseData.success) {
        setAllServices(responseData.services || [])
        setError(null)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching all services:', err)
      setError(err.message || 'Failed to load services')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Refresh data (manual refresh or after mutations)
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchAllServices()
    showToast('Data refreshed successfully', 'success')
  }, [fetchAllServices])

  // Initial load
  useEffect(() => {
    fetchAllServices()
  }, [fetchAllServices])

  // Reset page whenever filters (except page itself) change
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }))
  }, [activeTab, filters.search, filters.minPrice, filters.maxPrice, filters.limit])

  // --- Toast helper ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  // --- Confirmation Modal ---
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
    data: null,
  })

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

  // --- Service Modal ---
  const openServiceModal = (service = null) => {
    if (service && !canUpdate) {
      showToast('You do not have permission to edit services', 'error')
      return
    }
    if (!service && !canCreate) {
      showToast('You do not have permission to create services', 'error')
      return
    }
    setEditingService(service)
    setShowServiceModal(true)
  }

  const closeServiceModal = () => {
    setShowServiceModal(false)
    setEditingService(null)
  }

  const handleServiceSaved = () => {
    closeServiceModal()
    refreshData()
    showToast('Service saved successfully!', 'success')
  }

  // --- Filter handlers ---
  const handleStatusChange = status => {
    setActiveTab(status)
    setFilters(prev => ({ ...prev, status: status === 'all' ? 'all' : status, page: 1 }))
  }

  const handleSearchChange = value => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handlePriceRangeChange = (min, max) => {
    setFilters(prev => ({ ...prev, minPrice: min || '', maxPrice: max || '', page: 1 }))
  }

  const handleLimitChange = newLimit => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      minPrice: '',
      maxPrice: '',
      page: 1,
      limit: 5,
    })
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      activeTab !== 'all' ||
      filters.minPrice !== '' ||
      filters.maxPrice !== ''
    )
  }, [filters, activeTab])

  // --- Selection and bulk actions ---
  const toggleServiceSelection = serviceId => {
    if (!canBulk) return
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedServices(
      selectedServices.length === services.length ? [] : services.map(s => s.service_id)
    )
  }

  const handleBulkAction = async () => {
    if (!canBulk) {
      showToast('You do not have permission for bulk actions', 'error')
      return
    }
    if (!bulkAction || selectedServices.length === 0) return

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) {
          showToast('You do not have permission to delete services', 'error')
          return
        }
        showConfirmation(
          'Delete Services',
          `Are you sure you want to delete ${selectedServices.length} selected service(s)? This action cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedServices.map(id => servicesAPI.delete(id)))
            setBulkAction('')
            setSelectedServices([])
            refreshData()
            showToast(`Successfully deleted ${selectedServices.length} services`, 'success')
          }
        )
      } else {
        if (!canUpdateStatus) {
          showToast('You do not have permission to update service status', 'error')
          return
        }
        await Promise.all(
          selectedServices.map(id => servicesAPI.update(id, { status: bulkAction }))
        )
        setBulkAction('')
        setSelectedServices([])
        refreshData()
        showToast(`Successfully updated ${selectedServices.length} services`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    }
  }

  // --- Individual actions ---
  const handleStatusUpdate = async (serviceId, newStatus) => {
    if (!canUpdateStatus) {
      showToast('You do not have permission to update service status', 'error')
      return
    }
    try {
      await servicesAPI.update(serviceId, { status: newStatus })
      refreshData()
      showToast('Service status updated successfully', 'success')
    } catch (err) {
      console.error('Error updating service status:', err)
      showToast('Failed to update service status', 'error')
    }
  }

  const handleDeleteService = serviceId => {
    if (!canDelete) {
      showToast('You do not have permission to delete services', 'error')
      return
    }
    const service = allServices.find(s => s.service_id === serviceId)
    showConfirmation(
      'Delete Service',
      `Are you sure you want to delete the service "${service?.title}"? This action cannot be undone.`,
      'delete',
      async () => {
        try {
          await servicesAPI.delete(serviceId)
          refreshData()
          showToast('Service deleted successfully', 'success')
        } catch (err) {
          console.error('Error deleting service:', err)
          showToast('Failed to delete service', 'error')
        }
      }
    )
  }

  // --- Export to CSV (uses current filtered list) ---
  const exportToCSV = async () => {
    if (!canExport) {
      showToast('You do not have permission to export services', 'error')
      return
    }
    if (filteredServices.length === 0) {
      showToast('No services to export', 'error')
      return
    }

    setExportLoading(true)
    try {
      const headers = [
        'Service ID',
        'Title',
        'Description',
        'Short Description',
        'Status',
        'Is Active',
        'Basic Price',
        'Basic Delivery Days',
        'Standard Price',
        'Standard Delivery Days',
        'Premium Price',
        'Premium Delivery Days',
        'Fast Delivery Enabled',
        'Tip Payment Enabled',
        'View Count',
        'Created At',
        'Updated At',
      ]

      const csvRows = filteredServices.map(service => [
        service.service_id || '',
        `"${(service.title || '').replace(/"/g, '""')}"`,
        `"${(service.description || '').replace(/"/g, '""')}"`,
        `"${(service.short_description || '').replace(/"/g, '""')}"`,
        service.status || '',
        service.is_active ? 'Yes' : 'No',
        service.metadata?.pricing?.basic?.price || '0',
        service.metadata?.pricing?.basic?.delivery_days || '',
        service.metadata?.pricing?.standard?.price || '0',
        service.metadata?.pricing?.standard?.delivery_days || '',
        service.metadata?.pricing?.premium?.price || '0',
        service.metadata?.pricing?.premium?.delivery_days || '',
        service.metadata?.fast_delivery_options?.enabled ? 'Yes' : 'No',
        service.metadata?.tip_payment?.enabled ? 'Yes' : 'No',
        service.view_count || '0',
        service.created_at ? new Date(service.created_at).toISOString() : '',
        service.updated_at ? new Date(service.updated_at).toISOString() : '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `services_export_${timestamp}.csv`
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast(`Successfully exported ${filteredServices.length} services`, 'success')
    } catch (err) {
      console.error('Error exporting services:', err)
      showToast('Failed to export services', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // --- Import CSV (sample + upload) ---
  const generateSampleCSV = () => {
    if (!canImport) {
      showToast('You do not have permission to import services', 'error')
      return
    }
    const sampleData = [
      [
        'title',
        'description',
        'short_description',
        'status',
        'is_active',
        'basic_price',
        'basic_delivery_days',
        'standard_price',
        'standard_delivery_days',
        'premium_price',
        'premium_delivery_days',
        'fast_delivery_enabled',
        'tip_payment_enabled',
      ],
      [
        'Business Registration',
        'Complete business registration service',
        'Register your company quickly',
        'published',
        'true',
        '499',
        '10',
        '999',
        '7',
        '1999',
        '3',
        'true',
        'true',
      ],
      [
        'Digital Marketing Package',
        'SEO, social media, and PPC',
        'Boost your online presence',
        'draft',
        'true',
        '299',
        '14',
        '599',
        '10',
        '1299',
        '7',
        'false',
        'true',
      ],
    ]
    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'service_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Sample CSV template downloaded', 'info')
  }

  const handleFileUpload = async event => {
    if (!canImport) {
      showToast('You do not have permission to import services', 'error')
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
      if (lines.length < 2) throw new Error('CSV must contain header and at least one data row')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const required = [
        'title',
        'description',
        'short_description',
        'status',
        'basic_price',
        'basic_delivery_days',
      ]
      const missing = required.filter(r => !headers.includes(r))
      if (missing.length) throw new Error(`Missing headers: ${missing.join(', ')}`)

      const servicesToImport = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length !== headers.length) throw new Error(`Row ${i + 1} has wrong column count`)
        const serviceData = {}
        headers.forEach((h, idx) => {
          serviceData[h] = values[idx]
        })

        const metadata = {
          pricing: {
            basic: {
              price: parseFloat(serviceData.basic_price) || 0,
              delivery_days: parseInt(serviceData.basic_delivery_days) || 5,
              features: [],
              description: '',
              max_revisions: 0,
              support_level: 'email',
              popular: false,
              included_services: [],
              discount_percentage: 0,
            },
            standard: {
              price: parseFloat(serviceData.standard_price) || 0,
              delivery_days: parseInt(serviceData.standard_delivery_days) || 3,
              features: [],
              description: '',
              max_revisions: 0,
              support_level: 'email',
              popular: false,
              included_services: [],
              discount_percentage: 0,
            },
            premium: {
              price: parseFloat(serviceData.premium_price) || 0,
              delivery_days: parseInt(serviceData.premium_delivery_days) || 1,
              features: [],
              description: '',
              max_revisions: 0,
              support_level: 'email',
              popular: false,
              included_services: [],
              discount_percentage: 0,
            },
          },
          fast_delivery_options: {
            enabled: serviceData.fast_delivery_enabled === 'true',
            options: [],
          },
          tip_payment: {
            enabled: serviceData.tip_payment_enabled === 'true',
            percentages: [5, 10, 15],
          },
          extra_services: [],
          faqs: [],
        }

        const validatedService = {
          title: serviceData.title,
          description: serviceData.description,
          short_description: serviceData.short_description || '',
          status: serviceData.status || 'draft',
          is_active: serviceData.is_active === 'true',
          metadata,
        }
        if (!validatedService.title) throw new Error(`Row ${i + 1}: Title required`)
        if (!['draft', 'published', 'archived'].includes(validatedService.status))
          throw new Error(`Row ${i + 1}: Invalid status`)
        servicesToImport.push(validatedService)
      }

      await Promise.all(servicesToImport.map(s => servicesAPI.create(s)))
      showToast(`Successfully imported ${servicesToImport.length} services`, 'success')
      setShowImportModal(false)
      refreshData()
    } catch (err) {
      console.error(err)
      showToast(`Import failed: ${err.message}`, 'error')
    } finally {
      setImportLoading(false)
      event.target.value = ''
    }
  }

  // --- Helper functions ---
  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
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
    if (isNaN(value)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // --- Loading Skeleton ---
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {canBulk && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                <div className="h-3 bg-gray-200 rounded w-3"></div>
              </th>
            )}
            {['Service', 'Basic Price', 'Delivery', 'Status', 'Created', 'Actions'].map(header => (
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
          {Array.from({ length: filters.limit }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              {canBulk && (
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 rounded w-3"></div>
                </td>
              )}
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
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-14"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
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

  // --- Main Render ---
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
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage and monitor all your services</p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
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
          {canExport && (
            <button
              onClick={exportToCSV}
              disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-2.5 h-2.5" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canCreate && (
            <button
              onClick={() => openServiceModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-xs shadow-sm transition-all"
            >
              <Plus className="w-2.5 h-2.5" />
              New Service
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && canImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Services</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>File must be in CSV format</li>
                  <li>
                    Include required columns: title, description, basic_price, basic_delivery_days,
                    status
                  </li>
                  <li>Status: draft, published, or archived</li>
                  <li>Prices should be numbers (no currency symbols)</li>
                </ul>
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={generateSampleCSV}
                  className="flex items-center gap-1 px-3 py-2 text-xs border border-primary-300 rounded text-primary-700 bg-primary-50 hover:bg-primary-100 font-medium"
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
                    Importing services...
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
              {canBulk && (canUpdateStatus || canDelete) && selectedServices.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white"
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
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium"
                  >
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">
                    {selectedServices.length} selected
                  </span>
                </div>
              )}

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

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price Range (Basic)
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={e => handlePriceRangeChange(e.target.value, filters.maxPrice)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-500 self-center">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={e => handlePriceRangeChange(filters.minPrice, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Per Page</label>
                  <select
                    value={filters.limit}
                    onChange={e => handleLimitChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="15">15 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>

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
                    {activeTab !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Status: {statusOptions.find(s => s.value === activeTab)?.label}
                        <button
                          onClick={() => handleStatusChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Price: {filters.minPrice ? `≥${filters.minPrice}` : ''}{' '}
                        {filters.minPrice && filters.maxPrice ? '–' : ''}{' '}
                        {filters.maxPrice ? `≤${filters.maxPrice}` : ''}
                        <button
                          onClick={() => handlePriceRangeChange('', '')}
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
          {loading || refreshing ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Filter className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Services</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={refreshData}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : services.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedServices.length === services.length && services.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                          disabled={!canBulk}
                        />
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Basic Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {services.map(service => {
                    const basicPrice = service.metadata?.pricing?.basic?.price || 0
                    const basicDays = service.metadata?.pricing?.basic?.delivery_days || '—'
                    return (
                      <tr key={service.service_id} className="hover:bg-gray-50 transition-colors">
                        {canBulk && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.service_id)}
                              onChange={() => toggleServiceSelection(service.service_id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-gray-100 rounded-md flex items-center justify-center mr-1.5 border border-gray-200">
                              <Briefcase className="w-3 h-3 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900 line-clamp-1 flex items-center gap-0.5">
                                {service.title}
                                {service.metadata?.pricing?.basic?.popular && (
                                  <Sparkles
                                    className="w-2.5 h-2.5 text-yellow-500"
                                    title="Popular"
                                  />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {service.short_description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {formatPrice(basicPrice)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-0.5 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {basicDays} days
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {canUpdateStatus ? (
                            <select
                              value={service.status || 'draft'}
                              onChange={e => handleStatusUpdate(service.service_id, e.target.value)}
                              className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(
                                service.status || 'draft'
                              )}`}
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="archived">Archived</option>
                            </select>
                          ) : (
                            <StatusBadge
                              status={service.status || 'draft'}
                              statusOptions={statusOptions}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(service.created_at)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center gap-0.5">
                            {canUpdate && (
                              <button
                                onClick={() => openServiceModal(service)}
                                className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"
                                title="Edit Service"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteService(service.service_id)}
                                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"
                                title="Delete Service"
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
                  <Briefcase className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No services found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No services match your search criteria. Try adjusting your filters.'
                    : 'Get started by creating your first service.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openServiceModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Create New Service
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <span>Showing</span>
                  <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                  <span>to</span>
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, totalItems)}
                  </span>
                  <span>of</span>
                  <span className="font-medium">{totalItems}</span>
                  <span>results</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.page === 1}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) pageNum = i + 1
                    else if (filters.page <= 3) pageNum = i + 1
                    else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = filters.page - 2 + i
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
                    disabled={filters.page === totalPages}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={filters.page === totalPages}
                    className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Modal */}
      <ServiceModal
        show={showServiceModal}
        service={editingService}
        onClose={closeServiceModal}
        onSaved={handleServiceSaved}
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
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-2 py-1 text-xs font-medium text-white rounded ${
                  confirmationModal.type === 'delete' || confirmationModal.type === 'bulkDelete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
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

export default ServiceManagement
