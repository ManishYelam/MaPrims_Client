import React, { useState } from 'react'
import { Shield, CreditCard, Loader2, Check, Calendar, AlertCircle } from 'lucide-react'

const PaymentStep = ({ course, data, user, onBack, onPayment, paymentProcessing }) => {
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // Calculate payment amounts based on selected plan
  const calculatePaymentAmounts = () => {
    const baseFee = parseFloat(course.fee) || 0

    if (data.paymentPlan === 'installment') {
      const totalWithFee = baseFee * 1.1
      const monthlyInstallment = Math.ceil(totalWithFee / 3)
      const processingFee = baseFee * 0.1

      return {
        amountDueNow: monthlyInstallment,
        totalAmount: totalWithFee,
        baseAmount: baseFee,
        processingFee: processingFee,
        planType: 'installment',
        installmentDetails: {
          first: monthlyInstallment,
          second: monthlyInstallment,
          third: monthlyInstallment,
          schedule: ['Today', 'In 30 days', 'In 60 days'],
        },
      }
    } else {
      return {
        amountDueNow: baseFee,
        totalAmount: baseFee,
        baseAmount: baseFee,
        processingFee: 0,
        planType: 'full',
      }
    }
  }

  const paymentDetails = calculatePaymentAmounts()

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPlanName = () => {
    switch (data.paymentPlan) {
      case 'full':
        return 'One-Time Payment'
      case 'installment':
        return '3-Month Installment Plan'
      default:
        return 'Payment Plan'
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Secure Payment</h3>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Course:</span>
          <span className="font-medium text-gray-900 text-right">{course.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Payment Plan:</span>
          <span className="font-medium text-gray-900">{getPlanName()}</span>
        </div>

        {/* Detailed breakdown for installment plan */}
        {paymentDetails.planType === 'installment' ? (
          <>
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700">Payment Schedule:</p>

              {paymentDetails.installmentDetails.schedule.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">
                      {index === 0 ? 'First Payment' : `Installment ${index + 1}`} ({schedule}):
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatPrice(paymentDetails.installmentDetails.first)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Course Fee:</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(paymentDetails.baseAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing Fee (10%):</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(paymentDetails.processingFee)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(paymentDetails.totalAmount)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(paymentDetails.totalAmount)}
            </span>
          </div>
        )}

        {/* Amount Due Now */}
        <div className="bg-primary-50 border border-primary-200 rounded p-3 mt-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-primary-900">Amount Due Now:</span>
              <p className="text-xs text-primary-700">
                {paymentDetails.planType === 'installment'
                  ? 'First installment (Pay now to start learning)'
                  : 'Full payment (Pay now to start learning)'}
              </p>
            </div>
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(paymentDetails.amountDueNow)}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notes for Installment */}
      {paymentDetails.planType === 'installment' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900">Important Installment Information</h4>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    You'll pay <strong>₹{Math.round(paymentDetails.amountDueNow)}</strong> now
                  </span>
                </li>
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Subsequent installments will be automatically billed in 30 and 60 days
                  </span>
                </li>
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>You'll get full course access immediately after first payment</span>
                </li>
                <li className="flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Installments include a 10% processing fee for payment flexibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Payment Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">Secure Payment</h4>
            <p className="text-blue-700 text-sm mt-1">
              Your payment is secured with Razorpay. We never store your card details or banking
              information. All transactions are 128-bit SSL encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* Accepted Payment Methods */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">We accept all major payment methods:</p>
        <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            <span>Credit/Debit Cards</span>
          </div>
          <div>UPI</div>
          <div>Net Banking</div>
          <div>Wallet</div>
        </div>
      </div>

      {/* Terms Agreement */}
      <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          checked={agreeToTerms}
          onChange={e => setAgreeToTerms(e.target.checked)}
          className="mt-0.5 text-primary-500 focus:ring-primary-500 w-4 h-4"
          disabled={paymentProcessing}
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <a
            href="/terms"
            className="text-primary-600 hover:text-primary-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms and Conditions
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="text-primary-600 hover:text-primary-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          . I understand that for installment plans, subsequent payments will be automatically
          charged as per the payment schedule. I will gain immediate access to the course materials
          upon successful first payment.
        </span>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          disabled={paymentProcessing}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={onPayment}
          disabled={!agreeToTerms || paymentProcessing}
          className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {paymentProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatPrice(paymentDetails.amountDueNow)}
              {paymentDetails.planType === 'installment' && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">
                  (1st of 3 installments)
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Installment Note */}
      {paymentDetails.planType === 'installment' && (
        <p className="text-xs text-center text-gray-500 pt-2">
          Subsequent payments: ₹{Math.round(paymentDetails.installmentDetails.second)} in 30 days, ₹
          {Math.round(paymentDetails.installmentDetails.third)} in 60 days
        </p>
      )}
    </div>
  )
}

export default PaymentStep
