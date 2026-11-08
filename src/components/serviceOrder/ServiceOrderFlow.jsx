// src/components/service/ServiceOrderFlow.jsx
import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, User, CreditCard, FileText, AlertCircle, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { loadRazorpay } from '../../utils/loadRazorpay'
import { authAPI, paymentsAPI } from '../../services/api'
import AuthSelectionStep from '../enrollment/AuthSelectionStep'
import ProfileCompletionStep from '../enrollment/ProfileCompletionStep'
import ServicePlanSelectionStep from './ServicePlanSelectionStep'
import ServicePaymentStep from './ServicePaymentStep'
import ServiceConfirmationStep from './ServiceConfirmationStep'

const ServiceOrderFlow = ({ service, onClose }) => {
  const { user, updateUser, isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [orderData, setOrderData] = useState({
    serviceId: service?.service_id,
    payment_plan: 'basic',
    profileComplete: user?.user?.profileComplete || false,
    completedOrder: null,
    addons: null,
  })

  const userData = user?.user || user

  useEffect(() => {
    setError(null)
    setSuccessMessage(null)
  }, [currentStep])

  useEffect(() => {
    if (!isAuthenticated) setCurrentStep(0)
    else if (userData && !userData.profileComplete) setCurrentStep(1)
    else setCurrentStep(2)
  }, [isAuthenticated, userData])

  useEffect(() => {
    if (service?.service_id) setOrderData(prev => ({ ...prev, serviceId: service.service_id }))
  }, [service?.service_id])

  const getSteps = () => {
    if (!isAuthenticated) return [
      { id: 0, title: 'Get Started', icon: LogIn },
      { id: 1, title: 'Complete Profile', icon: User },
      { id: 2, title: 'Choose Plan', icon: FileText },
      { id: 3, title: 'Payment', icon: CreditCard },
      { id: 4, title: 'Confirmation', icon: Check },
    ]
    if (userData && !userData.profileComplete) return [
      { id: 0, title: 'Complete Profile', icon: User },
      { id: 1, title: 'Choose Plan', icon: FileText },
      { id: 2, title: 'Payment', icon: CreditCard },
      { id: 3, title: 'Confirmation', icon: Check },
    ]
    return [
      { id: 0, title: 'Choose Plan', icon: FileText },
      { id: 1, title: 'Payment', icon: CreditCard },
      { id: 2, title: 'Confirmation', icon: Check },
    ]
  }

  const steps = getSteps()

  const getSelectedPlan = () => {
    const plans = service?.metadata?.pricing
    if (!plans) return null
    switch (orderData.payment_plan) {
      case 'basic': return plans.basic
      case 'standard': return plans.standard
      case 'premium': return plans.premium
      default: return plans.basic
    }
  }

  const getPaymentAmounts = () => {
    if (orderData.addons && orderData.addons.totalAmount) {
      // totalAmount is already in rupees, includes base + extras + fast + tip
      return {
        amountForPayment: orderData.addons.totalAmount,
        totalAmount: orderData.addons.totalAmount,
        baseAmount: orderData.addons.subtotal || orderData.addons.totalAmount,
        processingFee: 0,
        isInstallment: false,
        planName: orderData.payment_plan,
        planDetails: getSelectedPlan(),
        addons: orderData.addons,
      }
    }
    const plan = getSelectedPlan()
    const baseFee = parseFloat(plan?.price) || 0
    return {
      amountForPayment: baseFee,
      totalAmount: baseFee,
      baseAmount: baseFee,
      processingFee: 0,
      isInstallment: false,
      planName: orderData.payment_plan,
      planDetails: plan,
      addons: null,
    }
  }

  const showError = msg => { setError(msg); setTimeout(() => setError(null), 5000) }
  const showSuccess = msg => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(null), 3000) }

  const handleAuthComplete = userData => {
    if (userData && !userData.profileComplete) setCurrentStep(1)
    else setCurrentStep(2)
  }

  const handleProfileComplete = async profileData => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.updateProfile(userData.user_id, profileData)
      if (response.data.message === 'User updated successfully') {
        const updatedUser = { ...userData, ...profileData, profileComplete: true }
        updateUser(updatedUser)
        setOrderData(prev => ({ ...prev, profileComplete: true }))
        setCurrentStep(2)
        showSuccess('Profile completed successfully!')
      } else throw new Error(response.data.message || 'Failed to update profile')
    } catch (error) {
      console.error('Profile completion failed:', error)
      showError(error.response?.data?.message || error.message || 'Failed to save profile')
    } finally { setLoading(false) }
  }

  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true)
    setError(null)
    try {
      const serviceId = service?.service_id
      if (!serviceId) throw new Error('Service ID missing')

      const Razorpay = await loadRazorpay()
      if (!Razorpay) throw new Error('Failed to load Razorpay SDK')

      const paymentAmounts = getPaymentAmounts()
      const amountInPaise = Math.round(paymentAmounts.amountForPayment * 100)

      // Build order payload for Razorpay – notes contain all details for backend
      const orderPayload = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `service_${serviceId}_${Date.now()}`,
        reference_type: 'service',
        reference_id: serviceId,
        notes: {
          service_id: serviceId,
          service_title: service.title,
          user_id: userData.user_id,
          user_name: userData.full_name,
          user_email: userData.email,
          payment_plan: orderData.payment_plan,
          amount: Math.round((paymentAmounts.baseAmount || 0) * 100), // base plan price in paise
          fast_delivery_charges: !!(paymentAmounts.addons?.fastDeliveryId),
          extra_services_charges: !!(paymentAmounts.addons?.extraServicesList?.length),
          tip_amount: Math.round((paymentAmounts.addons?.tipAmount || 0) * 100),
          total_amount: Math.round(paymentAmounts.totalAmount * 100),
        },
      }

      const orderResponse = await paymentsAPI.createRazorpayOrder(orderPayload)
      if (!orderResponse.data.success) throw new Error(orderResponse.data.error || 'Order creation failed')

      const razorpayOrder = orderResponse.data.data.order

      const paymentHandler = async response => {
        await handlePaymentSuccess(response, razorpayOrder.id, paymentAmounts)
      }

      const options = {
        key: orderResponse.data.data.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'MaPrims',
        description: `${service.title} - ${paymentAmounts.planName.toUpperCase()} Plan`,
        image: '/uploads/logo-tech2.svg',
        order_id: razorpayOrder.id,
        handler: paymentHandler,
        prefill: {
          name: userData.full_name,
          email: userData.email,
          contact: userData.phone_number || '',
        },
        theme: { color: '#008080' },
        modal: { ondismiss: () => setPaymentProcessing(false) },
      }

      const razorpayInstance = new Razorpay(options)
      razorpayInstance.on('payment.failed', response => {
        console.error('Payment failed:', response.error)
        showError(`Payment failed: ${response.error.description}`)
        setPaymentProcessing(false)
      })
      razorpayInstance.open()
    } catch (error) {
      console.error('Payment init failed:', error)
      setPaymentProcessing(false)
      showError(error.message || 'Payment initialization failed')
    }
  }

  const handlePaymentSuccess = async (paymentResponse, orderId, paymentAmounts) => {
    try {
      // Prepare verification data for backend
      const verificationData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        reference_type: 'service',
        reference_id: service.service_id,
        user_id: userData.user_id,
        amount: Math.round(paymentAmounts.amountForPayment * 100), // total paid in paise
        payment_plan: orderData.payment_plan,
        addons: orderData.addons, // includes all rupee values (tipAmount, totalAmount, etc.) and orderDeliveryDate
        order_delivery_date: orderData.addons?.orderDeliveryDate || null, // ISO string
      }

      const verificationResponse = await paymentsAPI.verifyPayment(verificationData)

      if (verificationResponse.data.success) {
        const result = verificationResponse.data.data
        // Build completedOrder object for confirmation step
        const completedOrder = {
          order_id: result.reference_id,
          payment: {
            rzp_payment_id: result.rzpPaymentId,
            amount: result.amount,
            method: 'Razorpay',
          },
          order: {
            order_id: result.reference_id,
            order_date: new Date().toISOString(),
          },
          selectedPlan: getSelectedPlan(),
        }

        setOrderData(prev => ({
          ...prev,
          completedOrder: {
            ...completedOrder,
            paymentAmounts,
          },
        }))

        setCurrentStep(steps.length - 1)
        showSuccess('Service order completed successfully!')
      } else {
        throw new Error(verificationResponse.data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      showError(error.message || 'Payment verification failed')
      setPaymentProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentStep === 0 && !isAuthenticated && 'Get Started'}
              {currentStep === 0 && isAuthenticated && !userData?.profileComplete && 'Complete Profile'}
              {currentStep === (isAuthenticated && !userData?.profileComplete ? 1 : 0) && 'Choose Plan'}
              {currentStep === (isAuthenticated && !userData?.profileComplete ? 2 : 1) && 'Payment'}
              {currentStep === steps.length - 1 && 'Order Complete'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {currentStep + 1} of {steps.length}{isAuthenticated && userData?.profileComplete && ' • Welcome back!'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={loading || paymentProcessing}><X className="w-4 h-4" /></button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs ${index <= currentStep ? 'bg-primary-500 border-primary-500 text-white' : index === currentStep + 1 ? 'border-primary-500 text-primary-500' : 'border-gray-300 text-gray-400'}`}>
                  {index < currentStep ? <Check className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 ${index < currentStep ? 'bg-primary-500' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1"><p className="text-sm text-red-800 font-medium">Error</p><p className="text-xs text-red-600 mt-0.5">{error}</p></div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1"><p className="text-sm text-green-800 font-medium">Success</p><p className="text-xs text-green-600 mt-0.5">{successMessage}</p></div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isAuthenticated && currentStep === 0 && <AuthSelectionStep onAuthComplete={handleAuthComplete} onClose={onClose} />}
          {isAuthenticated && !userData?.profileComplete && currentStep === 0 && <ProfileCompletionStep user={userData} onComplete={handleProfileComplete} loading={loading} />}
          {((!isAuthenticated && currentStep === 2) || (isAuthenticated && !userData?.profileComplete && currentStep === 1) || (isAuthenticated && userData?.profileComplete && currentStep === 0)) && (
            <ServicePlanSelectionStep service={service} data={orderData} onChange={setOrderData}
              onNext={() => { if (!isAuthenticated) setCurrentStep(3); else if (!userData?.profileComplete) setCurrentStep(2); else setCurrentStep(1); }}
              onBack={() => { if (!isAuthenticated) setCurrentStep(1); else if (!userData?.profileComplete) setCurrentStep(0); }}
              user={userData} isAuthenticated={isAuthenticated} />
          )}
          {((!isAuthenticated && currentStep === 3) || (isAuthenticated && !userData?.profileComplete && currentStep === 2) || (isAuthenticated && userData?.profileComplete && currentStep === 1)) && (
            <ServicePaymentStep service={service} data={orderData} user={userData}
              onBack={() => { if (!isAuthenticated) setCurrentStep(2); else if (!userData?.profileComplete) setCurrentStep(1); else setCurrentStep(0); }}
              onPayment={handleRazorpayPayment} paymentProcessing={paymentProcessing} />
          )}
          {currentStep === steps.length - 1 && (
            <ServiceConfirmationStep service={service} user={userData} orderData={orderData}
              onComplete={() => window.location.href = `/dashboard/services/${service?.service_id}`} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceOrderFlow