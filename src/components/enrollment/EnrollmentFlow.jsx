// src/components/enrollment/EnrollmentFlow.jsx
import React, { useState, useEffect } from 'react'
import {
  X,
  Check,
  Star,
  Loader2,
  User,
  CreditCard,
  FileText,
  Shield,
  Clock,
  BookOpen,
  Play,
  LogIn,
  UserPlus,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { loadRazorpay } from '../../utils/loadRazorpay'
import { authAPI, paymentsAPI, coursesAPI } from '../../services/api'
import AuthSelectionStep from './AuthSelectionStep'
import ProfileCompletionStep from './ProfileCompletionStep'
import PlanSelectionStep from './PlanSelectionStep'
import PaymentStep from './PaymentStep'
import ConfirmationStep from './ConfirmationStep'

const EnrollmentFlow = ({ course, onClose }) => {
  const { user, updateUser, isAuthenticated, login } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [enrollmentData, setEnrollmentData] = useState({
    courseId: course?.course_id,
    paymentPlan: 'full',
    profileComplete: user?.user?.profileComplete || false,
    completedEnrollment: null,
  })

  const userData = user?.user || user

  // Sample course images for fallback
  const sampleCourseImages = [
    '/images/courses/abap-basic.jpg',
    '/images/courses/abap-advanced.jpg',
    '/images/courses/abap-oop.jpg',
    '/images/courses/abap-performance.jpg',
  ]

  // Get course image with fallback
  const getCourseImage = () => {
    if (course?.thumbnail_image) {
      return course.thumbnail_image
    }
    const courseId = course?.course_id
    if (courseId) {
      const index = courseId % sampleCourseImages.length
      return sampleCourseImages[index]
    }
    const randomIndex = Math.floor(Math.random() * sampleCourseImages.length)
    return sampleCourseImages[randomIndex]
  }

  // Clear error when step changes
  useEffect(() => {
    setError(null)
    setSuccessMessage(null)
  }, [currentStep])

  // Initialize steps based on authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      // Non-logged in user flow
      setCurrentStep(0) // Start with auth selection
    } else if (userData && !userData.profileComplete) {
      // Logged in but profile incomplete
      setCurrentStep(1) // Profile completion
    } else {
      // Logged in with complete profile
      setCurrentStep(2) // Plan selection
    }
  }, [isAuthenticated, userData])

  // Update enrollmentData when course changes
  useEffect(() => {
    if (course?.course_id) {
      setEnrollmentData(prev => ({
        ...prev,
        courseId: course.course_id,
      }))
    }
  }, [course?.course_id])

  // Define steps based on authentication
  const getSteps = () => {
    if (!isAuthenticated) {
      return [
        { id: 0, title: 'Get Started', icon: LogIn },
        { id: 1, title: 'Complete Profile', icon: User },
        { id: 2, title: 'Choose Plan', icon: FileText },
        { id: 3, title: 'Payment', icon: CreditCard },
        { id: 4, title: 'Confirmation', icon: Check },
      ]
    } else if (userData && !userData.profileComplete) {
      return [
        { id: 0, title: 'Complete Profile', icon: User },
        { id: 1, title: 'Choose Plan', icon: FileText },
        { id: 2, title: 'Payment', icon: CreditCard },
        { id: 3, title: 'Confirmation', icon: Check },
      ]
    } else {
      return [
        { id: 0, title: 'Choose Plan', icon: FileText },
        { id: 1, title: 'Payment', icon: CreditCard },
        { id: 2, title: 'Confirmation', icon: Check },
      ]
    }
  }

  const steps = getSteps()

  // Calculate payment amounts based on selected plan
  const getPaymentAmounts = () => {
    const baseFee = parseFloat(course.fee) || 0

    if (enrollmentData.paymentPlan === 'installment') {
      // Add 10% processing fee for installments
      const totalWithFee = Math.ceil(baseFee * 1.1)
      // Divide into 3 equal parts
      const monthlyInstallment = Math.ceil(totalWithFee / 3)
      const processingFee = Math.ceil(baseFee * 0.1)

      return {
        amountForPayment: monthlyInstallment, // First installment amount
        totalAmount: totalWithFee, // Total with 10% fee
        baseAmount: baseFee, // Original course fee
        processingFee: processingFee, // 10% processing fee
        isInstallment: true,
        installmentDetails: {
          first: monthlyInstallment,
          second: monthlyInstallment,
          third: monthlyInstallment,
          schedule: ['Today', 'In 30 days', 'In 60 days'],
        },
      }
    } else {
      return {
        amountForPayment: baseFee, // Full amount
        totalAmount: baseFee, // Same as base
        baseAmount: baseFee,
        processingFee: 0,
        isInstallment: false,
      }
    }
  }

  // Show error message
  const showError = message => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  // Show success message
  const showSuccess = message => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Handle authentication completion
  const handleAuthComplete = userData => {
    if (userData && !userData.profileComplete) {
      setCurrentStep(1) // Move to profile completion
    } else {
      setCurrentStep(2) // Move directly to plan selection
    }
  }

  // Handle profile completion
  const handleProfileComplete = async profileData => {
    setLoading(true)
    setError(null)
    try {
      // Update user profile via API
      const response = await authAPI.updateProfile(userData.user_id, profileData)

      if (response.data.message === 'User updated successfully') {
        const updatedUser = {
          ...userData,
          ...profileData,
          profileComplete: true,
        }
        updateUser(updatedUser)
        setEnrollmentData(prev => ({ ...prev, profileComplete: true }))
        setCurrentStep(2) // Move to plan selection
        showSuccess('Profile completed successfully!')
      } else {
        throw new Error(response.data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile completion failed:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to save profile. Please try again.'
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true)
    setError(null)
    try {
      const courseId = course?.course_id

      if (!courseId) {
        throw new Error('Course ID is missing. Cannot proceed with payment.')
      }

      const Razorpay = await loadRazorpay()
      if (!Razorpay) {
        throw new Error('Failed to load Razorpay SDK')
      }

      // Calculate payment amounts based on selected plan
      const paymentAmounts = getPaymentAmounts()
      const amountInPaise = Math.round(paymentAmounts.amountForPayment * 100)

      const orderData = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `course_${courseId}_${Date.now()}`,
        // courseId: courseId,
        reference_type: 'course',
        reference_id: courseId,
        notes: {
          courseId: courseId,
          courseTitle: course.title,
          userId: userData.user_id,
          userName: userData.full_name,
          userEmail: userData.email,
          paymentPlan: enrollmentData.paymentPlan,
          actualAmount: paymentAmounts.baseAmount,
          totalAmount: paymentAmounts.totalAmount,
          processingFee: paymentAmounts.processingFee,
          isInstallmentPlan: paymentAmounts.isInstallment,
          installmentNumber: 1,
          totalInstallments: paymentAmounts.isInstallment ? 3 : 1,
        },
      }

      const orderResponse = await paymentsAPI.createRazorpayOrder(orderData)

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create payment order')
      }

      const razorpayOrder = orderResponse.data.data.order

      // Create the handler function that has access to paymentAmounts
      const paymentHandler = async response => {
        await handlePaymentSuccess(response, razorpayOrder.id, paymentAmounts)
      }

      const options = {
        key: orderResponse.data.data.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Shirsat Tech Hub',
        description: `Enrollment for ${course.title} - ${
          paymentAmounts.isInstallment ? 'Installment 1 of 3' : 'One-Time Payment'
        }`,
        image: '/uploads/logo-tech2.svg',
        order_id: razorpayOrder.id,
        handler: paymentHandler, // Use the defined handler
        prefill: {
          name: userData.full_name || `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          contact: userData.phone_number || '',
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: false,
          emi: false,
          paylater: false,
        },
        notes: {
          course: course.title,
          courseId: courseId,
          userId: userData.user_id,
          paymentPlan: enrollmentData.paymentPlan,
          actualAmount: paymentAmounts.baseAmount,
          totalAmount: paymentAmounts.totalAmount,
          processingFee: paymentAmounts.processingFee,
          installmentDetails: paymentAmounts.isInstallment
            ? '1st of 3 installments'
            : 'Full payment',
        },
        theme: {
          color: '#008080',
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false)
          },
        },
      }

      const razorpayInstance = new Razorpay(options)
      razorpayInstance.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        showError(`Payment failed: ${response.error.description}`)
        setPaymentProcessing(false)
      })

      razorpayInstance.open()
    } catch (error) {
      console.error('Payment initialization failed:', error)
      setPaymentProcessing(false)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Payment initialization failed. Please try again.'
      showError(errorMessage)
    }
  }

  const handlePaymentSuccess = async (paymentResponse, orderId, paymentAmounts) => {
    try {
      // console.log('payment_amt:', paymentAmounts)

      const courseId = course?.course_id
      const verificationData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        // courseId: courseId,
        reference_type: 'course',
        reference_id: courseId,
        userId: userData.user_id,
        amount: paymentAmounts.amountForPayment,
        totalAmount: paymentAmounts.totalAmount,
        baseAmount: paymentAmounts.baseAmount,
        processingFee: paymentAmounts.processingFee,
        paymentPlan: enrollmentData.paymentPlan,
        installmentNumber: paymentAmounts.isInstallment ? 1 : null,
        totalInstallments: paymentAmounts.isInstallment ? 3 : 1,
      }
      // console.log(verificationData)

      const verificationResponse = await paymentsAPI.verifyPayment(verificationData)

      if (verificationResponse.data.success) {
        await completeEnrollment(verificationResponse.data.data.rzpPaymentId, paymentAmounts)
      } else {
        throw new Error(verificationResponse.data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Payment verification failed. Please contact support.'
      showError(errorMessage)
      setPaymentProcessing(false)
    }
  }

  const completeEnrollment = async (paymentId, paymentAmounts) => {
    setLoading(true)
    setError(null)
    try {
      const courseId = course?.course_id

      const enrollmentPayload = {
        course_id: courseId,
        user_id: userData.user_id,
        rzp_payment_id: paymentId,
        payment_plan: enrollmentData.paymentPlan,
        amount_paid: paymentAmounts.amountForPayment,
        total_amount: paymentAmounts.totalAmount,
        base_amount: paymentAmounts.baseAmount,
        processing_fee: paymentAmounts.processingFee,
        is_installment: enrollmentData.paymentPlan === 'installment',
        installment_number: enrollmentData.paymentPlan === 'installment' ? 1 : null,
        total_installments: enrollmentData.paymentPlan === 'installment' ? 3 : 1,
      }

      const enrollmentResponse = await coursesAPI.completeEnrollment(enrollmentPayload)

      if (enrollmentResponse.data.success) {
        const updatedUser = {
          ...userData,
          enrolledCourses: [...(userData.enrolledCourses || []), courseId],
        }
        updateUser(updatedUser)

        setEnrollmentData(prev => ({
          ...prev,
          completedEnrollment: {
            ...enrollmentResponse.data.data,
            paymentAmounts: paymentAmounts,
          },
        }))

        setCurrentStep(steps.length - 1)
        showSuccess('Enrollment completed successfully!')
      } else {
        throw new Error(enrollmentResponse.data.message || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment failed:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Enrollment failed. Please try again.'
      showError(errorMessage)
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentStep === 0 && !isAuthenticated && 'Get Started'}
              {currentStep === 0 &&
                isAuthenticated &&
                !userData?.profileComplete &&
                'Complete Profile'}
              {currentStep === (isAuthenticated && !userData?.profileComplete ? 1 : 0) &&
                'Choose Plan'}
              {currentStep === (isAuthenticated && !userData?.profileComplete ? 2 : 1) && 'Payment'}
              {currentStep === steps.length - 1 && 'Enrollment Complete'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {currentStep + 1} of {steps.length}
              {isAuthenticated && userData?.profileComplete && (
                <span className="text-primary-600"> • Welcome back!</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={loading || paymentProcessing}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Steps - Compact */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs ${
                    index <= currentStep
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : index === currentStep + 1
                        ? 'border-primary-500 text-primary-500'
                        : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <step.icon className="w-3 h-3" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 ${
                      index < currentStep ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-xs text-green-600 mt-0.5">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Step Content with Scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Authentication Step - Only for non-logged in users */}
          {!isAuthenticated && currentStep === 0 && (
            <AuthSelectionStep onAuthComplete={handleAuthComplete} onClose={onClose} />
          )}

          {/* Profile Completion Step - Only for logged in users with incomplete profile */}
          {isAuthenticated && !userData?.profileComplete && currentStep === 0 && (
            <ProfileCompletionStep
              user={userData}
              onComplete={handleProfileComplete}
              loading={loading}
            />
          )}

          {/* Plan Selection Step */}
          {((!isAuthenticated && currentStep === 2) ||
            (isAuthenticated && !userData?.profileComplete && currentStep === 1) ||
            (isAuthenticated && userData?.profileComplete && currentStep === 0)) && (
            <PlanSelectionStep
              course={course}
              data={enrollmentData}
              onChange={setEnrollmentData}
              onNext={() => {
                if (!isAuthenticated) {
                  setCurrentStep(3) // Payment step for non-logged in
                } else {
                  setCurrentStep(userData?.profileComplete ? 1 : 2) // Payment step for logged in
                }
              }}
              onBack={() => {
                if (!isAuthenticated) {
                  setCurrentStep(1) // Back to profile completion
                } else if (!userData?.profileComplete) {
                  setCurrentStep(0) // Back to profile completion
                }
              }}
              user={userData}
              isAuthenticated={isAuthenticated}
              getCourseImage={getCourseImage}
            />
          )}

          {/* Payment Step */}
          {((!isAuthenticated && currentStep === 3) ||
            (isAuthenticated && !userData?.profileComplete && currentStep === 2) ||
            (isAuthenticated && userData?.profileComplete && currentStep === 1)) && (
            <PaymentStep
              course={course}
              data={enrollmentData}
              user={userData}
              onBack={() => {
                if (!isAuthenticated) {
                  setCurrentStep(2) // Back to plan selection
                } else if (!userData?.profileComplete) {
                  setCurrentStep(1) // Back to plan selection
                } else {
                  setCurrentStep(0) // Back to plan selection
                }
              }}
              onPayment={handleRazorpayPayment}
              paymentProcessing={paymentProcessing}
            />
          )}

          {/* Confirmation Step */}
          {currentStep === steps.length - 1 && (
            <ConfirmationStep
              course={course}
              user={userData}
              enrollmentData={enrollmentData}
              onComplete={() => (window.location.href = `/dashboard/courses/${course?.course_id}`)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default EnrollmentFlow
