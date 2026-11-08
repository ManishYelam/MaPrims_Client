// src/components/dashboard/PaymentModal.jsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react'
import {
  X,
  Mail,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  Shield,
  ExternalLink,
  Copy,
  BarChart3,
  Zap,
  Smartphone,
  BookOpen,
  RefreshCw,
} from 'lucide-react'
import { paymentsAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'

// Memoized components
const UserAvatar = React.memo(({ user }) => (
  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
    {user?.full_name?.charAt(0) || 'U'}
  </div>
))

UserAvatar.displayName = 'UserAvatar'

const StatusBadge = React.memo(({ status }) => {
  const getStatusColor = status => {
    switch (status) {
      case 'created':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'created':
        return <Clock className="w-4 h-4" />
      case 'paid':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      case 'refunded':
        return <Shield className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Created'}
    </span>
  )
})

StatusBadge.displayName = 'StatusBadge'

const PaymentMethodBadge = React.memo(({ method }) => {
  const getPaymentMethodIcon = method => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />
      case 'netbanking':
        return <BarChart3 className="w-4 h-4" />
      case 'upi':
        return <Zap className="w-4 h-4" />
      case 'wallet':
        return <Smartphone className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700">
      {getPaymentMethodIcon(method)}
      {method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown'}
    </span>
  )
})

PaymentMethodBadge.displayName = 'PaymentMethodBadge'

const CopyButton = React.memo(({ text, title }) => (
  <button
    onClick={() => navigator.clipboard.writeText(text || '')}
    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
    title={title}
  >
    <Copy className="w-3 h-3" />
  </button>
))

CopyButton.displayName = 'CopyButton'

const CourseImage = React.memo(({ course, imageError, onImageError }) => {
  const getCourseGradient = () => {
    if (!course) return 'from-blue-100 to-blue-200'
    const courseId = course.course_id || 0
    const gradients = [
      'from-blue-100 to-blue-200',
      'from-green-100 to-green-200',
      'from-purple-100 to-purple-200',
      'from-orange-100 to-orange-200',
      'from-teal-100 to-teal-200',
      'from-pink-100 to-pink-200',
    ]
    return gradients[courseId % gradients.length]
  }

  const getCourseInitial = () => {
    if (!course || !course.title) return 'C'
    return course.title.charAt(0).toUpperCase()
  }

  if (course?.thumbnail_image && !imageError) {
    return (
      <img
        src={course.thumbnail_image}
        alt={course.title}
        className="w-16 h-12 object-cover rounded border"
        onError={onImageError}
      />
    )
  }

  return (
    <div
      className={`w-16 h-12 bg-gradient-to-br ${getCourseGradient()} rounded border flex items-center justify-center`}
    >
      <span className="text-lg font-bold text-gray-700">{getCourseInitial()}</span>
    </div>
  )
})

CourseImage.displayName = 'CourseImage'

const MetadataSection = React.memo(({ payment, isAdmin, formatAmount }) => (
  <div className="border-t pt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">
      {isAdmin ? 'Additional Information' : 'Payment Details'}
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
      <div>
        <strong>Currency:</strong> {payment.currency || 'INR'}
      </div>
      {payment.attempts && (
        <div>
          <strong>Attempts:</strong> {payment.attempts}
        </div>
      )}
      {payment.amount_due !== undefined && (
        <div>
          <strong>Amount Due:</strong> {formatAmount(payment.amount_due)}
        </div>
      )}
      {payment.amount_paid !== undefined && (
        <div>
          <strong>Amount Paid:</strong> {formatAmount(payment.amount_paid)}
        </div>
      )}
      {isAdmin && payment.metadata?.enrollment_type && (
        <div>
          <strong>Enrollment Type:</strong> {payment.metadata.enrollment_type}
        </div>
      )}

      {payment.notes && (
        <div className="md:col-span-2">
          <strong>Payment Notes:</strong>
          {isAdmin ? (
            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
              {JSON.stringify(payment.notes, null, 2)}
            </pre>
          ) : (
            <div className="mt-1 text-xs bg-gray-50 p-2 rounded border">
              <div>
                <strong>Course:</strong> {payment.notes.courseTitle}
              </div>
              <div>
                <strong>Plan:</strong> {payment.notes.paymentPlan}
              </div>
              {payment.notes.actualAmount && (
                <div>
                  <strong>Original Price:</strong> ₹{payment.notes.actualAmount.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && payment.metadata && Object.keys(payment.metadata).length > 0 && (
        <div className="md:col-span-2">
          <strong>Razorpay Metadata:</strong>
          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
            {JSON.stringify(payment.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </div>
))

MetadataSection.displayName = 'MetadataSection'

const Footer = React.memo(
  ({ payment, isAdmin, loading, refundLoading, onClose, onRefund, onSubmit, formatDate }) => (
    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
      <div className="text-xs text-gray-500">
        Payment ID: {payment?.payment_id || 'N/A'} • Created:{' '}
        {payment?.createdAt ? formatDate(payment.createdAt) : 'N/A'}
        {isAdmin && payment?.user_id && ` • User ID: ${payment.user_id}`}
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && payment?.status === 'paid' && (
          <button
            onClick={onRefund}
            disabled={refundLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refundLoading ? 'animate-spin' : ''}`} />
            {refundLoading ? 'Processing...' : 'Refund Payment'}
          </button>
        )}

        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
        >
          Close
        </button>

        {isAdmin && payment && (
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Notes'
            )}
          </button>
        )}
      </div>
    </div>
  )
)

Footer.displayName = 'Footer'

const PaymentModal = React.memo(
  ({ show, payment, onClose, onUpdated, userRole: propUserRole, isAdmin: propIsAdmin }) => {
    const { user: authUser } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [refundLoading, setRefundLoading] = useState(false)
    const [formData, setFormData] = useState({ adminNotes: '' })
    const [imageError, setImageError] = useState(false)
    const [error, setError] = useState(null)

    // Memoized user role calculation
    const { userRole, isAdmin } = useMemo(() => {
      if (propUserRole && propIsAdmin !== undefined) {
        return { userRole: propUserRole, isAdmin: propIsAdmin }
      }

      const role = authUser?.role || authUser?.user?.role || authUser?.data?.role || 'student'
      return {
        userRole: role,
        isAdmin: role === 'admin',
      }
    }, [authUser, propUserRole, propIsAdmin])

    // Memoized utility functions
    const formatAmount = useCallback(amount => `₹${(amount / 100).toFixed(2)}`, [])

    const formatDate = useCallback(dateString => {
      if (!dateString) return 'Never'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }, [])

    const handleImageError = useCallback(() => {
      setImageError(true)
    }, [])

    const openRazorpayDashboard = useCallback(() => {
      if (payment?.rzp_payment_id) {
        window.open(
          `https://dashboard.razorpay.com/app/payments/${payment.rzp_payment_id}`,
          '_blank'
        )
      }
    }, [payment])

    // Initialize form data
    useEffect(() => {
      if (payment) {
        setFormData({
          adminNotes: payment.metadata?.adminNotes || '',
        })
        setImageError(false)
        setError(null)
      }
    }, [payment])

    const handleSubmit = useCallback(
      async e => {
        e.preventDefault()
        if (!payment) return

        setLoading(true)
        setError(null)
        try {
          await paymentsAPI.updatePaymentMetadata({
            payment_id: payment.payment_id,
            metadata: {
              ...payment.metadata,
              adminNotes: formData.adminNotes,
            },
          })
          onUpdated()
        } catch (error) {
          console.error('Error updating payment:', error)
          setError(error.response?.data?.message || 'Failed to update payment notes')
        } finally {
          setLoading(false)
        }
      },
      [payment, formData.adminNotes, onUpdated]
    )

    const handleRefund = useCallback(async () => {
      if (!payment) return

      if (
        !window.confirm(
          'Are you sure you want to refund this payment? This action cannot be undone.'
        )
      ) {
        return
      }

      setRefundLoading(true)
      setError(null)
      try {
        await paymentsAPI.refundPayment(payment.payment_id)
        onUpdated()
      } catch (error) {
        console.error('Error refunding payment:', error)
        setError(error.response?.data?.message || 'Failed to process refund')
      } finally {
        setRefundLoading(false)
      }
    }, [payment, onUpdated])

    const handleInputChange = useCallback((field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    if (!show) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isAdmin ? 'Payment Details' : 'Payment Receipt'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {payment ? (
              <div className="space-y-6">
                {/* Payment Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={payment.user} />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {payment.user?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isAdmin ? payment.user?.occupation || 'Customer' : 'Student'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${payment.user?.email || payment.email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {payment.user?.email || payment.email || 'No email'}
                        </a>
                      </div>

                      {payment.contact && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span>{payment.contact}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Paid: {formatDate(payment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Amount:</span>
                      <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        {formatAmount(payment.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <StatusBadge status={payment.status} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Method:</span>
                      <PaymentMethodBadge method={payment.method} />
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Order ID:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {payment.rzp_order_id?.slice(-8) || 'N/A'}
                        </code>
                        <CopyButton text={payment.rzp_order_id} title="Copy Order ID" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Payment ID:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {payment.rzp_payment_id?.slice(-8) || 'N/A'}
                        </code>
                        <CopyButton text={payment.rzp_payment_id} title="Copy Payment ID" />
                      </div>
                    </div>

                    {payment.receipt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Receipt:</span>
                        <span className="text-sm text-gray-600">{payment.receipt}</span>
                      </div>
                    )}

                    {isAdmin && payment.rzp_payment_id && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Razorpay:</span>
                        <button
                          onClick={openRazorpayDashboard}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 rounded border border-primary-200 hover:bg-primary-100 transition-colors"
                          title="Open in Razorpay Dashboard"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View in Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Information */}
                {payment.course && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Course Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{payment.course.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {payment.notes?.courseTitle || payment.course.title}
                          </p>
                          {payment.notes?.actualAmount && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Original Price:</strong> ₹
                              {payment.notes.actualAmount.toFixed(2)}
                            </p>
                          )}
                          {payment.notes?.paymentPlan && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Payment Plan:</strong> {payment.notes.paymentPlan}
                            </p>
                          )}
                        </div>
                        <CourseImage
                          course={payment.course}
                          imageError={imageError}
                          onImageError={handleImageError}
                        />
                      </div>
                      {payment.enrollment && (
                        <div className="mt-3 text-xs text-gray-500">
                          <strong>Enrollment ID:</strong> {payment.enrollment.enrollment_id} •
                          <strong> Status:</strong> {payment.enrollment.status} •
                          <strong> Progress:</strong> {payment.enrollment.progress || 0}%
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Metadata */}
                <div className="space-y-4">
                  {isAdmin && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h4>
                      <textarea
                        value={formData.adminNotes}
                        onChange={e => handleInputChange('adminNotes', e.target.value)}
                        placeholder="Add internal notes about this payment..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        rows="3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        These notes are for internal use only.
                      </p>
                    </div>
                  )}

                  {(payment.metadata || payment.notes) && (
                    <MetadataSection
                      payment={payment}
                      isAdmin={isAdmin}
                      formatAmount={formatAmount}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No payment data available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <Footer
            payment={payment}
            isAdmin={isAdmin}
            loading={loading}
            refundLoading={refundLoading}
            onClose={onClose}
            onRefund={handleRefund}
            onSubmit={handleSubmit}
            formatDate={formatDate}
          />
        </div>
      </div>
    )
  }
)

PaymentModal.displayName = 'PaymentModal'

export default PaymentModal
