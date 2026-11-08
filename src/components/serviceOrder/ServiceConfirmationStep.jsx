// src/components/service/ServiceConfirmationStep.jsx
import React from 'react'
import { Check, Play, ArrowRight, Calendar, CreditCard, User, FileText, AlertCircle } from 'lucide-react'

const ServiceConfirmationStep = ({ service, user, orderData, onComplete }) => {
  const order = orderData?.completedOrder
  const payment = order?.payment
  const selectedPlan = order?.selectedPlan
  const serviceData = order?.service || service
  const userData = order?.user || user
  const orderDetails = order?.order

  const formatCurrency = amount => {
    if (!amount) return '₹0'
    const inRupees = amount > 1000 ? amount / 100 : amount
    return `₹${inRupees.toLocaleString('en-IN')}`
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Order Successful!</h3>
      <p className="text-gray-600 mb-1">Your <strong className="text-primary-600">{serviceData?.title}</strong> order has been placed.</p>
      <p className="text-gray-500 text-sm mb-6">We'll start working on your service shortly.</p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Order Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between"><span className="text-sm text-gray-600">Order ID:</span><span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">#{orderDetails?.order_id || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-sm text-gray-600">Plan:</span><span className="text-sm font-medium capitalize">{orderData.payment_plan}</span></div>
          {payment && (
            <>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Payment ID:</span><span className="text-sm font-medium">{payment.rzp_payment_id?.slice(-8) || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Amount Paid:</span><span className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Payment Method:</span><span className="text-sm font-medium capitalize">{payment.method || 'N/A'}</span></div>
            </>
          )}
          <div className="flex justify-between"><span className="text-sm text-gray-600">Delivery:</span><span className="text-sm font-medium">{selectedPlan?.delivery_days} days</span></div>
          <div className="flex justify-between"><span className="text-sm text-gray-600">Ordered on:</span><span className="text-sm font-medium">{formatDate(orderDetails?.order_date)}</span></div>
          {userData && <div className="flex justify-between pt-2 border-t"><span className="text-sm text-gray-600">Customer:</span><span className="text-sm font-medium">{userData.full_name}</span></div>}
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 text-center">
        <Play className="w-4 h-4 text-primary-600 mx-auto mb-1" />
        <p className="text-sm text-primary-700">Our team will contact you within 24 hours to begin work.</p>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onComplete} className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
          <Play className="w-4 h-4" /> Go to My Services <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.location.href = '/dashboard'} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Dashboard</button>
          <button onClick={() => window.location.href = '/services'} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">Browse Services</button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
        Need help? <a href="mailto:support@shirsattechhub.com" className="text-primary-600 underline">support@shirsattechhub.com</a><br />
        Order ID: #{orderDetails?.order_id} • Payment ID: {payment?.rzp_payment_id?.slice(-8)}
      </div>
    </div>
  )
}

export default ServiceConfirmationStep