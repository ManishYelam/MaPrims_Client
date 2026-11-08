// src/components/enrollment/ConfirmationStep.jsx
import React from 'react'
import {
  Check,
  BookOpen,
  Play,
  ArrowRight,
  Calendar,
  CreditCard,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react'

const ConfirmationStep = ({ course, user, enrollmentData, onComplete }) => {
  const completed = enrollmentData?.completedEnrollment
  const payment = completed?.payment
  const enrollmentDetails = payment?.enrollment
  const courseData = enrollmentDetails?.course || course
  const userData = enrollmentDetails?.user || user
  const courseId = courseData?.course_id

  // Format currency
  const formatCurrency = amount => {
    if (!amount) return '₹0'
    // If amount is in paise (like 1600000), convert to rupees
    const amountInRupees = amount > 1000 ? amount / 100 : amount
    return `₹${amountInRupees.toLocaleString('en-IN')}`
  }

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="text-center py-6">
      {/* Success Header */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">Enrollment Successful!</h3>
      <p className="text-gray-600 mb-1">
        Welcome to <strong className="text-primary-600">{courseData?.title}</strong>
      </p>
      <p className="text-gray-500 text-sm mb-6">
        You now have full access to all course materials and resources.
      </p>

      {/* Enrollment Details Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Enrollment Details
        </h4>

        <div className="space-y-3">
          {/* Enrollment ID */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Enrollment ID:</span>
            <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
              #{enrollmentDetails?.enrollment_id || 'N/A'}
            </span>
          </div>

          {/* Payment Details */}
          {payment && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Payment ID:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {payment.rzp_payment_id?.slice(-8) || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm font-medium capitalize">{payment.method || 'N/A'}</span>
              </div>
            </>
          )}

          {/* Add this section in the ConfirmationStep component after the payment details */}
          {completed?.paymentAmounts?.isInstallment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="font-semibold text-yellow-900 mb-2">
                    Installment Payment Plan Activated
                  </h5>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <p className="flex items-center gap-2">
                      <Check className="w-3 h-3" />
                      <span>
                        First installment of{' '}
                        <strong>₹{Math.round(completed.paymentAmounts.amountForPayment)}</strong>{' '}
                        paid successfully
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Second installment:{' '}
                        <strong>₹{Math.round(completed.paymentAmounts.amountForPayment)}</strong>{' '}
                        due in 30 days
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Third installment:{' '}
                        <strong>₹{Math.round(completed.paymentAmounts.amountForPayment)}</strong>{' '}
                        due in 60 days
                      </span>
                    </p>
                    <p className="pt-2 border-t border-yellow-300 text-xs">
                      Total course fee: ₹{Math.round(completed.paymentAmounts.totalAmount)} (₹
                      {Math.round(completed.paymentAmounts.baseAmount)} + ₹
                      {Math.round(completed.paymentAmounts.processingFee)} processing fee)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className={`text-sm font-medium px-2 py-1 rounded capitalize ${enrollmentDetails?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}
            >
              {enrollmentDetails?.status || 'pending'}
            </span>
          </div>

          {/* Enrollment Date */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Enrolled on:
            </span>
            <span className="text-sm font-medium">
              {formatDate(enrollmentDetails?.enrollment_date)}
            </span>
          </div>

          {/* Student Info */}
          {userData && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <User className="w-3 h-3" />
                Student:
              </span>
              <span className="text-sm font-medium">{userData.full_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Access Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Play className="w-4 h-4 text-primary-600" />
          <span className="font-semibold text-primary-900">Course Access Granted</span>
        </div>
        <p className="text-sm text-primary-700">
          You can now access all course content, videos, and resources from your learning dashboard.
        </p>
      </div>

      {/* What's Next Section */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900 text-left">What's Next?</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <BookOpen className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Explore Course Content</p>
              <p className="text-xs text-gray-600">Access all modules, videos, and learning materials</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Play className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Start Learning</p>
              <p className="text-xs text-gray-600">Begin with the introduction and first module</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Track Progress</p>
              <p className="text-xs text-gray-600">Monitor your learning journey and completion status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => (window.location.href = `/dashboard/learning/course/${courseId}`)}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Learning Now
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            My Dashboard
          </button>
          <button
            onClick={() => (window.location.href = '/courses')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Need help? Contact our support team at{' '}
          <a
            href="mailto:support@sapabap.com"
            className="text-primary-600 hover:text-primary-700 font-medium underline"
          >
            support@sapabap.com
          </a>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Enrollment ID: #{enrollmentDetails?.enrollment_id} • Payment ID:{' '}
          {payment?.rzp_payment_id?.slice(-8)}
        </p>
      </div>
    </div>
  )
}

export default ConfirmationStep