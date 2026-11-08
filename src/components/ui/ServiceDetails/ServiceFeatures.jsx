// src/components/ui/ServiceDetails/ServiceFeatures.jsx
import React from 'react'
import { Check, Star, Crown, Rocket } from 'lucide-react'

const ServiceFeatures = ({ basicPlan, premiumPlan, standardPlan }) => {
  const plans = [
    { name: 'Basic', plan: basicPlan, icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    {
      name: 'Standard',
      plan: standardPlan,
      icon: Rocket,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      popular: standardPlan?.popular,
    },
    {
      name: 'Premium',
      plan: premiumPlan,
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ].filter(p => p.plan)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Service Plans & Features</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`relative rounded-xl border border-gray-200 p-5 ${plan.bgColor}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                Most Popular
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <plan.icon className={`w-5 h-5 ${plan.color}`} />
              <h3 className="font-bold text-gray-900">{plan.name} Plan</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-3">
              ₹{plan.plan.price?.toLocaleString('en-IN')}
            </div>
            <ul className="space-y-2">
              {plan.plan.features?.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Delivery: {plan.plan.delivery_days} days • Revisions: {plan.plan.max_revisions}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceFeatures
