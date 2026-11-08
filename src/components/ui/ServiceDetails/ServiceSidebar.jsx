// ServiceSidebar.jsx
import React from 'react'
import { MessageCircle, Clock, CheckCircle, Shield, Headphones, PlayCircle } from 'lucide-react'

const ServiceSidebar = ({
  service,
  basicPlan,
  formatPrice,
  onOrderNow,
  onWhatsAppClick,
  isAuthenticated,
  isPurchased = false,
}) => {
  const price = basicPlan?.price || service.fee || 0
  const deliveryDays = basicPlan?.delivery_days || '7-14'
  const revisions = basicPlan?.max_revisions || 2

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 p-5">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900">{formatPrice(price)}</div>
          <div className="text-sm text-gray-500 mt-1">
            per {basicPlan?.delivery_unit || 'project'}
          </div>
        </div>

        <button
          onClick={onOrderNow}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm mb-4 flex items-center justify-center gap-2"
        >
          {isPurchased && <PlayCircle className="w-4 h-4" />}
          {isPurchased ? 'Continue' : 'Order Now'}
        </button>

        <div className="space-y-2 mb-4">
          <button
            onClick={onWhatsAppClick}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Inquiry
          </button>
        </div>

        <hr className="my-4" />

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-primary-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Delivery</p>
              <p className="text-xs text-gray-500">{deliveryDays} business days</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Revisions</p>
              <p className="text-xs text-gray-500">{revisions} rounds included</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Money-back guarantee</p>
              <p className="text-xs text-gray-500">100% satisfaction or refund</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Headphones className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Support</p>
              <p className="text-xs text-gray-500">
                {basicPlan?.support_level === 'priority' ? 'Priority support' : 'Standard support'}
              </p>
            </div>
          </div>
        </div>

        {service.metadata?.tip_payment?.enabled && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">Tip the creator (optional)</p>
            <div className="flex justify-center gap-2 mt-2">
              {service.metadata.tip_payment.percentages.map(pct => (
                <span key={pct} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {pct}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceSidebar