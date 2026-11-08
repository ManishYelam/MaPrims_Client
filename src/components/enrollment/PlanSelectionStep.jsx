import React, { useState } from 'react'
import { BookOpen, Clock, Play, Check, AlertCircle } from 'lucide-react'
import DemoRequestModal from '../dashboard/DemoRequestModal'

const PlanSelectionStep = ({
  course,
  data,
  onChange,
  onNext,
  onBack,
  user,
  isAuthenticated,
  getCourseImage,
}) => {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoRequestData, setDemoRequestData] = useState(null)

  // Calculate installment amounts
  const calculateInstallments = () => {
    const baseFee = parseFloat(course.fee) || 0
    const totalWithFee = baseFee * 1.1 // Add 10% processing fee
    const monthlyInstallment = Math.ceil(totalWithFee / 3)
    const totalSavings = baseFee * 0.15 // 15% savings for one-time payment
    const processingFeeAmount = baseFee * 0.1 // 10% processing fee

    return {
      baseFee,
      totalWithFee,
      monthlyInstallment,
      totalSavings,
      processingFeeAmount,
      installmentDetails: {
        firstInstallment: monthlyInstallment,
        remainingInstallments: monthlyInstallment,
        totalInstallments: 3,
      },
    }
  }

  const installmentCalc = calculateInstallments()

  const pricingPlans = [
    {
      id: 'full',
      name: 'One-Time Payment',
      type: 'full',
      price: installmentCalc.baseFee,
      savings: `Save ₹${Math.round(installmentCalc.totalSavings)}`,
      description: 'Pay once, save more',
      popular: false,
      features: [
        'Full course access immediately',
        'Lifetime updates',
        'Certificate included',
        'Priority support',
        `Save ₹${Math.round(installmentCalc.totalSavings)} compared to installments`,
      ],
    },
    {
      id: 'installment',
      name: '3-Month Installment Plan',
      type: 'installment',
      price: installmentCalc.monthlyInstallment,
      total: installmentCalc.totalWithFee,
      processingFee: `+10% (₹${Math.round(installmentCalc.processingFeeAmount)}) processing fee`,
      note: 'Pay in 3 easy monthly installments',
      popular: true,
      features: [
        `First installment: ₹${installmentCalc.monthlyInstallment}`,
        `Subsequent installments: ₹${installmentCalc.monthlyInstallment}/month`,
        `Total: ₹${Math.round(installmentCalc.totalWithFee)} (includes 10% processing fee)`,
        'Full course access after first payment',
        'Certificate included',
        'Standard support',
        'No extra charges after enrollment',
      ],
    },
  ]

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleFreeDemo = () => {
    setDemoRequestData({
      course_id: course.course_id || course.id,
      Course: {
        course_id: course.course_id || course.id,
        title: course.title,
        instructor: course.instructor,
        thumbnail_image: getCourseImage(),
      },
    })
    setShowDemoModal(true)
  }

  const handleDemoRequestClose = () => {
    setShowDemoModal(false)
    setDemoRequestData(null)
  }

  const handleDemoRequestSaved = () => {
    setShowDemoModal(false)
  }

  const handlePlanSelect = planId => {
    onChange({ ...data, paymentPlan: planId })
  }

  return (
    <div className="space-y-6">
      {/* Course Summary */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <img
            src={getCourseImage()}
            alt={course.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 hidden">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{course.title}</h3>
          <p className="text-gray-600 text-sm mt-1 truncate">{course.instructor}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{course.duration}</span>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Choose Payment Plan</h4>
        <p className="text-sm text-gray-600">Select a payment option that works best for you</p>

        <div className="space-y-3">
          {pricingPlans.map(plan => (
            <div
              key={plan.id}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                data.paymentPlan === plan.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'relative' : ''}`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Flexible
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                        data.paymentPlan === plan.id
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {data.paymentPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{plan.name}</span>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.id === 'installment' && (
                        <span className="text-sm text-gray-600">/month × 3 months</span>
                      )}
                      {plan.savings && (
                        <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                          {plan.savings}
                        </span>
                      )}
                    </div>

                    {plan.processingFee && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          {plan.processingFee}
                        </span>
                      </div>
                    )}

                    {plan.note && <p className="text-sm text-gray-600">{plan.note}</p>}

                    {plan.total && (
                      <div className="mt-2 p-2 bg-gray-100 rounded">
                        <p className="text-sm font-medium text-gray-900">
                          Total payable:{' '}
                          <span className="font-bold">{formatPrice(plan.total)}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          (Base: {formatPrice(installmentCalc.baseFee)} + 10% processing fee)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Plan includes:</p>
                    <div className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Breakdown Note */}
        {data.paymentPlan === 'installment' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Installment Payment Plan Details:
                </p>
                <div className="text-xs text-blue-700 mt-1 space-y-1">
                  <p>
                    • First installment: <strong>₹{installmentCalc.monthlyInstallment}</strong>{' '}
                    (payable now)
                  </p>
                  <p>
                    • Second installment: <strong>₹{installmentCalc.monthlyInstallment}</strong>{' '}
                    (due in 30 days)
                  </p>
                  <p>
                    • Third installment: <strong>₹{installmentCalc.monthlyInstallment}</strong> (due
                    in 60 days)
                  </p>
                  <p>
                    • Total amount: <strong>₹{Math.round(installmentCalc.totalWithFee)}</strong> (₹
                    {Math.round(installmentCalc.baseFee)} + ₹
                    {Math.round(installmentCalc.processingFeeAmount)} processing fee)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Free Demo Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 text-lg mb-2">Not sure yet?</h4>
          <p className="text-gray-600 mb-4">
            Try our free demo sessions to experience the course quality before enrolling
          </p>
          <button
            onClick={handleFreeDemo}
            className="w-full px-6 py-3 border-2 border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5" />
            Request Free Demo Sessions
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Includes 2 demo classes + detailed course syllabus + instructor introduction
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.paymentPlan}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
            data.paymentPlan
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Payment
        </button>
      </div>

      {/* Demo Request Modal */}
      <DemoRequestModal
        show={showDemoModal}
        request={demoRequestData}
        onClose={handleDemoRequestClose}
        onSaved={handleDemoRequestSaved}
        isAdmin={false}
      />
    </div>
  )
}

export default PlanSelectionStep
