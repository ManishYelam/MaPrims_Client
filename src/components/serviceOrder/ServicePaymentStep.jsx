// src/components/service/ServicePaymentStep.jsx
import React, { useState } from 'react'
import { Shield, CreditCard, Loader2, Check } from 'lucide-react'

const ServicePaymentStep = ({ service, data, user, onBack, onPayment, paymentProcessing }) => {
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const formatPrice = price => {
    if (!price && price !== 0) return 'Contact Us'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getSelectedPlan = () => {
    const plans = service?.metadata?.pricing
    if (!plans) return null
    switch (data.payment_plan) {
      case 'basic':   return plans.basic
      case 'standard':return plans.standard
      case 'premium': return plans.premium
      default:        return plans.basic
    }
  }

  const plan = getSelectedPlan()
  const addons = data.addons

  const totalAmount = addons?.totalAmount || plan?.price || 0

  const breakdown = {
    base: addons?.subtotal
      ? addons.subtotal - (addons.extraServicesTotal || 0) - (addons.fastDeliveryCost || 0)
      : plan?.price || 0,
    extras: addons?.extraServicesTotal || 0,
    fast: addons?.fastDeliveryCost || 0,
    tip: addons?.tipAmount || 0,
    tipPercentage: addons?.tipPercentage || 0,
    total: totalAmount,
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Secure Payment</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Service:</span>
          <span className="font-medium text-gray-900 text-right">{service.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Plan:</span>
          <span className="font-medium text-gray-900 capitalize">{data.payment_plan}</span>
        </div>
        {plan && (
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery:</span>
            <span className="font-medium text-gray-900">{plan.delivery_days} days</span>
          </div>
        )}

        {breakdown.extras > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Extra services</span>
            <span className="font-medium text-gray-900">{formatPrice(breakdown.extras)}</span>
          </div>
        )}
        {breakdown.fast > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fast delivery</span>
            <span className="font-medium text-gray-900">{formatPrice(breakdown.fast)}</span>
          </div>
        )}
        {breakdown.tip > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tip ({breakdown.tipPercentage}%)</span>
            <span className="font-medium text-gray-900">{formatPrice(breakdown.tip)}</span>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div><h4 className="font-semibold text-blue-900">Secure Payment</h4><p className="text-blue-700 text-sm">Powered by Razorpay. 128-bit SSL encrypted.</p></div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">We accept:</p>
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <CreditCard className="w-4 h-4" /> Credit/Debit Cards, UPI, Net Banking, Wallet
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} className="mt-0.5 w-4 h-4" disabled={paymentProcessing} />
        <span className="text-sm text-gray-600">I agree to the <a href="/terms" target="_blank" className="text-primary-600 font-medium">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-primary-600 font-medium">Privacy Policy</a>.</span>
      </label>

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} disabled={paymentProcessing} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium">Back</button>
        <button onClick={onPayment} disabled={!agreeToTerms || paymentProcessing} className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2">
          {paymentProcessing ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : (<>Pay {formatPrice(totalAmount)}</>)}
        </button>
      </div>
    </div>
  )
}

export default ServicePaymentStep