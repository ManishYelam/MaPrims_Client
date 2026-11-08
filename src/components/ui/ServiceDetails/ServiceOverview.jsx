// src/components/ui/ServiceDetails/ServiceOverview.jsx
import React from 'react'
import { CheckCircle, Clock, Shield, Zap } from 'lucide-react'

const ServiceOverview = ({ service }) => {
  const benefits = [
    {
      icon: Zap,
      title: 'Fast Turnaround',
      description: `Delivered in ${service.metadata?.pricing?.basic?.delivery_days || '7-14'} days`,
    },
    {
      icon: Shield,
      title: 'Quality Assured',
      description: '100% satisfaction guaranteed or money back',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Dedicated support throughout the process',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">About This Service</h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>{service.description || service.short_description}</p>
          {service.metadata?.detailed_description && (
            <p className="mt-2">{service.metadata.detailed_description}</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What You Get</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <benefit.icon className="w-6 h-6 text-primary-600 mb-2" />
              <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {service.metadata?.process_steps && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Process</h3>
          <div className="space-y-3">
            {service.metadata.process_steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceOverview
