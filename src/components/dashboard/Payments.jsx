// src/components/dashboard/PaymentManagement.jsx
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Filter,
  Plus,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  IndianRupee,
  Shield,
  Zap,
  BarChart3,
  MoreVertical,
} from 'lucide-react'
import { paymentsAPI } from '../../services/api'
import PaymentModal from './PaymentModal'

const PaymentManagement = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [payments, setPayments] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPayments, setSelectedPayments] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Advanced Filter States
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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
        value: 'created',
        label: 'Created',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
      },
      {
        value: 'paid',
        label: 'Paid',
        color: 'bg-green-100 text-green-800 border border-green-200',
      },
      { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800 border border-red-200' },
      {
        value: 'refunded',
        label: 'Refunded',
        color: 'bg-purple-100 text-purple-800 border border-purple-200',
      },
    ],
    []
  )

  const paymentMethodOptions = useMemo(
    () => [
      { value: 'all', label: 'All Methods' },
      {
        value: 'card',
        label: 'Credit/Debit Card',
        color: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        icon: CreditCard,
      },
      {
        value: 'netbanking',
        label: 'Net Banking',
        color: 'bg-teal-100 text-teal-800 border border-teal-200',
        icon: BarChart3,
      },
      {
        value: 'upi',
        label: 'UPI',
        color: 'bg-orange-100 text-orange-800 border border-orange-200',
        icon: Zap,
      },
      {
        value: 'wallet',
        label: 'Wallet',
        color: 'bg-pink-100 text-pink-800 border border-pink-200',
        icon: DollarSign,
      },
    ],
    []
  )

  // Calculate tab counts based on allPayments
  const tabs = useMemo(() => {
    if (!allPayments.length)
      return [
        { id: 'all', name: 'All Payments', count: 0, icon: Users, color: 'text-gray-600' },
        { id: 'paid', name: 'Paid', count: 0, icon: CheckCircle2, color: 'text-green-600' },
        { id: 'failed', name: 'Failed', count: 0, icon: XCircle, color: 'text-red-600' },
        { id: 'refunded', name: 'Refunded', count: 0, icon: RefreshCw, color: 'text-purple-600' },
      ]

    const allCount = allPayments.length
    const paidCount = allPayments.filter(payment => payment.status === 'paid').length
    const failedCount = allPayments.filter(payment => payment.status === 'failed').length
    const refundedCount = allPayments.filter(payment => payment.status === 'refunded').length

    return [
      { id: 'all', name: 'All Payments', count: allCount, icon: Users, color: 'text-gray-600' },
      { id: 'paid', name: 'Paid', count: paidCount, icon: CheckCircle2, color: 'text-green-600' },
      { id: 'failed', name: 'Failed', count: failedCount, icon: XCircle, color: 'text-red-600' },
      {
        id: 'refunded',
        name: 'Refunded',
        count: refundedCount,
        icon: RefreshCw,
        color: 'text-purple-600',
      },
    ]
  }, [allPayments])

  // Stats calculation using actual API fields
  const stats = useMemo(() => {
    if (!allPayments.length)
      return [
        {
          number: '0',
          label: 'Total Payments',
          icon: DollarSign,
          color: 'text-blue-400',
          trend: '+0%',
        },
        {
          number: '₹0',
          label: 'Total Revenue',
          icon: IndianRupee,
          color: 'text-green-400',
          trend: '+0%',
        },
        {
          number: '0',
          label: 'Success Rate',
          icon: CheckCircle,
          color: 'text-teal-400',
          trend: '+0%',
        },
        {
          number: '₹0',
          label: 'Avg. Order Value',
          icon: BarChart3,
          color: 'text-purple-400',
          trend: '+0%',
        },
      ]

    const totalPayments = allPayments.length
    const paidPayments = allPayments.filter(payment => payment.status === 'paid')
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const successRate =
      totalPayments > 0 ? Math.round((paidPayments.length / totalPayments) * 100) : 0
    const averageOrderValue =
      paidPayments.length > 0 ? Math.round(totalRevenue / paidPayments.length) : 0

    return [
      {
        number: totalPayments.toLocaleString(),
        label: 'Total Payments',
        icon: DollarSign,
        color: 'text-blue-400',
        trend: '+12%',
      },
      {
        number: `₹${(totalRevenue / 100).toLocaleString()}`,
        label: 'Total Revenue',
        icon: IndianRupee,
        color: 'text-green-400',
        trend: '+18%',
      },
      {
        number: `${successRate}%`,
        label: 'Success Rate',
        icon: CheckCircle,
        color: 'text-teal-400',
        trend: '+5%',
      },
      {
        number: `₹${(averageOrderValue / 100).toLocaleString()}`,
        label: 'Avg. Order Value',
        icon: BarChart3,
        color: 'text-purple-400',
        trend: '+8%',
      },
    ]
  }, [allPayments])

  // Fetch payments with filtering
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const requestData = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: ['rzp_payment_id', 'rzp_order_id', 'email', 'contact'],
        filters: {
          status: filters.status !== 'all' ? filters.status : undefined,
          payment_mode: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
          minAmount: filters.minAmount ? parseInt(filters.minAmount) * 100 : undefined,
          maxAmount: filters.maxAmount ? parseInt(filters.maxAmount) * 100 : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      }

      const response = await paymentsAPI.getAllUserPayments(requestData)
      const responseData = response.data

      // console.log('Payment API Response:', responseData)

      if (responseData && responseData.success) {
        const paymentsData = responseData.data?.payments || []
        setPayments(paymentsData)

        // Update pagination from API response
        const paginationData = responseData.data?.pagination
        setPagination({
          page: paginationData?.page || filters.page,
          limit: filters.limit,
          totalItems: paginationData?.totalItems || paymentsData.length,
          totalPages:
            paginationData?.totalPages ||
            Math.ceil((paginationData?.totalItems || paymentsData.length) / filters.limit),
        })
      } else {
        console.warn('Unexpected API response structure:', responseData)
        setPayments([])
        setPagination({
          page: 1,
          limit: filters.limit,
          totalItems: 0,
          totalPages: 0,
        })
      }
    } catch (err) {
      setError('Failed to load payments. Please try again.')
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch all payments for counting and export
  const fetchAllPayments = useCallback(async () => {
    try {
      const requestData = {
        page: 1,
        limit: 1000,
        filters: {},
      }

      const response = await paymentsAPI.getAllUserPayments(requestData)
      const responseData = response.data

      if (responseData && responseData.success) {
        const paymentsData = responseData.data?.payments || []
        setAllPayments(paymentsData)
      } else {
        console.warn('Unexpected API response structure in fetchAllPayments:', responseData)
        setAllPayments([])
      }
    } catch (err) {
      console.error('Error fetching all payments:', err)
      setAllPayments([])
    }
  }, [])

  // Fetch all payments for export
  const fetchAllPaymentsForExport = async () => {
    try {
      const requestData = {
        page: 1,
        limit: 1000,
        search: filters.search,
        searchFields: ['rzp_payment_id', 'rzp_order_id', 'email', 'contact'],
        filters: {
          status: filters.status !== 'all' ? filters.status : undefined,
          payment_mode: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
          minAmount: filters.minAmount ? parseInt(filters.minAmount) * 100 : undefined,
          maxAmount: filters.maxAmount ? parseInt(filters.maxAmount) * 100 : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      }

      const response = await paymentsAPI.getAllUserPayments(requestData)
      const responseData = response.data

      if (responseData && responseData.success) {
        return responseData.data?.payments || []
      } else {
        console.warn('Unexpected API response structure in export:', responseData)
        return []
      }
    } catch (err) {
      console.error('Error fetching payments for export:', err)
      throw err
    }
  }

  // Export to CSV functionality
  const exportToCSV = async () => {
    try {
      setExportLoading(true)

      const allPayments = await fetchAllPaymentsForExport()

      if (!allPayments || allPayments.length === 0) {
        showToast('No payments found to export.', 'error')
        return
      }

      const headers = [
        'Payment ID',
        'Order ID',
        'User Name',
        'User Email',
        'Amount (₹)',
        'Status',
        'Payment Method',
        'Course',
        'Contact',
        'Created At',
        'Razorpay Payment ID',
      ]

      const csvRows = allPayments.map(payment => [
        payment.payment_id || '',
        payment.rzp_order_id || '',
        `"${(payment.User?.full_name || '').replace(/"/g, '""')}"`,
        `"${(payment.User?.email || '').replace(/"/g, '""')}"`,
        (payment.amount / 100).toFixed(2),
        payment.status || '',
        payment.method || '',
        `"${(payment.Course?.title || '').replace(/"/g, '""')}"`,
        payment.contact || '',
        payment.createdAt ? new Date(payment.createdAt).toISOString() : '',
        payment.rzp_payment_id || '',
      ])

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `payments_export_${timestamp}`

      if (hasActiveFilters) {
        const filterParts = []
        if (filters.status !== 'all') filterParts.push(filters.status)
        if (filters.paymentMethod !== 'all') filterParts.push(filters.paymentMethod)

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

      showToast(
        `Successfully exported ${allPayments.length} payment records to ${filename}`,
        'success'
      )
    } catch (err) {
      console.error('Error exporting payments:', err)
      showToast('Failed to export payments. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Debounced search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPayments()
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [fetchPayments])

  // Fetch all payments for counting on component mount
  useEffect(() => {
    fetchAllPayments()
  }, [fetchAllPayments])

  // Confirmation Modal Functions
  const showConfirmation = (title, message, type, onConfirm, data = null) => {
    setConfirmationModal({
      show: true,
      title,
      message,
      type,
      onConfirm,
      data,
    })
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
    if (confirmationModal.onConfirm) {
      confirmationModal.onConfirm(confirmationModal.data)
    }
    hideConfirmation()
  }

  // Payment Modal Functions
  const openPaymentModal = (payment = null) => {
    setEditingPayment(payment)
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setEditingPayment(null)
  }

  const handlePaymentUpdated = () => {
    closePaymentModal()
    fetchPayments()
    fetchAllPayments()
    showToast('Payment updated successfully!', 'success')
  }

  // Handle status change from tabs
  const handleStatusChange = status => {
    setActiveTab(status)
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? 'all' : status,
      page: 1,
    }))
  }

  // Filter handlers
  const handleSearchChange = value => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1,
    }))
  }

  const handleStatusFilterChange = status => {
    setFilters(prev => ({
      ...prev,
      status: status,
      page: 1,
    }))
  }

  const handlePaymentMethodChange = method => {
    setFilters(prev => ({
      ...prev,
      paymentMethod: method,
      page: 1,
    }))
  }

  const handleAmountFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1,
    }))
  }

  const handleDateFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1,
    }))
  }

  const handleLimitChange = newLimit => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(newLimit),
      page: 1,
    }))
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentMethod: 'all',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    })
    setActiveTab('all')
    showToast('All filters cleared', 'info')
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.paymentMethod !== 'all' ||
      filters.minAmount !== '' ||
      filters.maxAmount !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== ''
    )
  }, [filters])

  // Payment selection and bulk actions
  const togglePaymentSelection = paymentId => {
    setSelectedPayments(prev =>
      prev.includes(paymentId) ? prev.filter(id => id !== paymentId) : [...prev, paymentId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedPayments(
      selectedPayments.length === payments.length ? [] : payments.map(payment => payment.payment_id)
    )
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPayments.length === 0) return

    try {
      if (bulkAction === 'refund') {
        showConfirmation(
          'Process Refund',
          `Are you sure you want to refund ${selectedPayments.length} selected payments? This action cannot be undone.`,
          'bulkRefund',
          async () => {
            // Implement bulk refund logic here
            await Promise.all(selectedPayments.map(id => paymentsAPI.refundPayment(id)))
            setBulkAction('')
            setSelectedPayments([])
            fetchPayments()
            fetchAllPayments()
            showToast(
              `Successfully processed refund for ${selectedPayments.length} payments`,
              'success'
            )
          }
        )
      } else {
        // Bulk status update
        await Promise.all(
          selectedPayments.map(id => paymentsAPI.updatePaymentStatus(id, bulkAction))
        )
        setBulkAction('')
        setSelectedPayments([])
        fetchPayments()
        fetchAllPayments()
        showToast(`Successfully updated ${selectedPayments.length} payments`, 'success')
      }
    } catch (err) {
      console.error('Error performing bulk action:', err)
      showToast('Failed to perform bulk action', 'error')
    }
  }

  // Individual payment actions
  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await paymentsAPI.updatePaymentStatus(paymentId, newStatus)
      fetchPayments()
      fetchAllPayments()
      showToast('Payment status updated successfully', 'success')
    } catch (err) {
      console.error('Error updating payment status:', err)
      showToast('Failed to update payment status', 'error')
    }
  }

  const handleRefundPayment = paymentId => {
    const payment = payments.find(p => p.payment_id === paymentId)
    showConfirmation(
      'Process Refund',
      `Are you sure you want to refund payment of ₹${(payment?.amount / 100).toFixed(2)} from "${payment?.User?.full_name}"? This action cannot be undone.`,
      'refund',
      async () => {
        try {
          await paymentsAPI.refundPayment(paymentId)
          fetchPayments()
          fetchAllPayments()
          showToast('Payment refunded successfully', 'success')
        } catch (err) {
          console.error('Error refunding payment:', err)
          showToast('Failed to refund payment', 'error')
        }
      }
    )
  }

  // Utility functions
  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  const getPaymentMethodColor = method => {
    const methodObj = paymentMethodOptions.find(m => m.value === method)
    return methodObj ? methodObj.color : 'bg-gray-100 text-gray-700 border border-gray-300'
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

  const formatAmount = amount => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  const getPaymentMethodIcon = method => {
    const methodObj = paymentMethodOptions.find(m => m.value === method)
    const IconComponent = methodObj?.icon || CreditCard
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
            {['User', 'Amount', 'Order ID', 'Course', 'Method', 'Status', 'Date', 'Actions'].map(
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
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-20 mb-0.5"></div>
                <div className="h-2 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
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
          <h1 className="text-xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-xs text-gray-600">Manage and track all payment transactions</p>
        </div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          <button
            onClick={exportToCSV}
            disabled={exportLoading}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-2.5 h-2.5" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>

          <button
            onClick={() => fetchPayments()}
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
                  <p className="text-xs text-green-600 font-medium">{stat.trend}</p>
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
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md">
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
              {/* Bulk Actions */}
              {selectedPayments.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="refund">Process Refund</option>
                    <option value="paid">Mark as Paid</option>
                    <option value="failed">Mark as Failed</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  >
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">
                    {selectedPayments.length} selected
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
                  placeholder="Search payments..."
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

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={e => handlePaymentMethodChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {paymentMethodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={e => handleAmountFilterChange('minAmount', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={e => handleAmountFilterChange('maxAmount', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
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

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => handleDateFilterChange('startDate', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => handleDateFilterChange('endDate', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                    {filters.paymentMethod !== 'all' && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Method:{' '}
                        {paymentMethodOptions.find(m => m.value === filters.paymentMethod)?.label}
                        <button
                          onClick={() => handlePaymentMethodChange('all')}
                          className="ml-0.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {(filters.minAmount || filters.maxAmount) && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        Amount: ₹{filters.minAmount || '0'} - ₹{filters.maxAmount || '∞'}
                        <button
                          onClick={() => {
                            handleAmountFilterChange('minAmount', '')
                            handleAmountFilterChange('maxAmount', '')
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Payments</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchPayments}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-xs font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : payments.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedPayments.length === payments.length && payments.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
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
                  {payments.map(payment => (
                    <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.payment_id)}
                          onChange={() => togglePaymentSelection(payment.payment_id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2">
                            {payment.User?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 line-clamp-1">
                              {payment.User?.full_name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              <span>{payment.User?.email || payment.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-900">
                          {formatAmount(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">{payment.currency || 'INR'}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded border">
                          {payment.rzp_order_id ? payment.rzp_order_id.slice(-8) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-900 font-medium line-clamp-2">
                          {payment.Course?.title || 'No Course'}
                        </div>
                        {payment.Enrollment && (
                          <div className="text-xs text-gray-500">
                            Enrollment: {payment.Enrollment.enrollment_id}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.method)}`}
                        >
                          {getPaymentMethodIcon(payment.method)}
                          {payment.method
                            ? payment.method.charAt(0).toUpperCase() + payment.method.slice(1)
                            : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <select
                          value={payment.status || 'created'}
                          onChange={e => handleStatusUpdate(payment.payment_id, e.target.value)}
                          className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(payment.status || 'created')}`}
                        >
                          <option value="created">Created</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(payment.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openPaymentModal(payment)}
                            className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50 transition-colors"
                            title="View Payment Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {payment.status === 'paid' && (
                            <button
                              onClick={() => handleRefundPayment(payment.payment_id)}
                              className="text-purple-600 hover:text-purple-900 p-0.5 rounded hover:bg-purple-50 transition-colors"
                              title="Refund Payment"
                            >
                              <RefreshCw className="w-3 h-3" />
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
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No payments found</h3>
                <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No payments match your search criteria. Try adjusting your filters.'
                    : 'No payment transactions have been recorded yet.'}
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

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        payment={editingPayment}
        onClose={closePaymentModal}
        onUpdated={handlePaymentUpdated}
      />

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200">
              <div
                className={`p-1.5 rounded-full ${
                  confirmationModal.type === 'refund' || confirmationModal.type === 'bulkRefund'
                    ? 'bg-purple-100 text-purple-600'
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
                  confirmationModal.type === 'refund' || confirmationModal.type === 'bulkRefund'
                    ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
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

export default PaymentManagement
