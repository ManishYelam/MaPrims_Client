// src/components/ui/ServiceDetails/ServiceDeliveryInfo.jsx
import React from 'react'
import { Calendar, Mail, MessageSquare, FileText, Zap } from 'lucide-react'

const ServiceDeliveryInfo = ({ service }) => {
  const basic = service.metadata?.pricing?.basic || {}
  const standard = service.metadata?.pricing?.standard || {}
  const premium = service.metadata?.pricing?.premium || {}

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Delivery Information</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Timeline
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Basic: {basic.delivery_days || '7-14'} business days</li>
            <li>• Standard: {standard.delivery_days || '4-7'} business days</li>
            <li>• Premium: {premium.delivery_days || '1-3'} business days</li>
            <li>• Revisions included: up to {standard.max_revisions || 2} rounds</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Communication
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Email updates at every milestone</li>
            <li>• Dedicated project manager</li>
            <li>• Weekly progress reports</li>
            <li>
              • {basic.support_level === 'priority' ? 'Priority support' : 'Chat & email support'}
            </li>
          </ul>
        </div>
      </div>

      {service.metadata?.fast_delivery_options?.enabled && (
        <div className="bg-blue-50 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Fast Delivery Options
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {service.metadata.fast_delivery_options.options.map(opt => (
              <div key={opt.id} className="bg-white rounded p-3">
                <div className="font-medium">{opt.name}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
                <div className="mt-1 font-semibold text-primary-600">+₹{opt.extra_price}</div>
                <div className="text-xs">Delivery in {opt.delivery_days} days</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-green-50 rounded-xl p-5">
        <h3 className="font-semibold text-green-900 mb-2">What's Included</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-green-800">
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Source files
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documentation
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> 30-day support
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Revisions policy
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ServiceDeliveryInfo
