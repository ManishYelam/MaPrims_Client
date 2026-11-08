// src/components/ui/ServiceDetails/ServiceFAQ.jsx
import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const ServiceFAQ = ({ faqs, expandedFaqs, onToggle }) => {
  if (!faqs || faqs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No FAQs available. Contact us for any questions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, idx) => {
          const isExpanded = expandedFaqs.has(idx)
          return (
            <div key={idx} className="py-4">
              <button
                onClick={() => onToggle(idx)}
                className="flex justify-between items-center w-full text-left"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {isExpanded && (
                <div className="mt-2 text-gray-600 text-sm leading-relaxed">{faq.answer}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ServiceFAQ
