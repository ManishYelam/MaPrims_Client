// src/components/ui/ServiceDetails/MobileAccordion.jsx
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const MobileAccordion = ({ tabs }) => {
  const [openTab, setOpenTab] = useState(null)

  const toggleTab = id => {
    setOpenTab(openTab === id ? null : id)
  }

  return (
    <div className="space-y-3">
      {tabs.map(tab => (
        <div key={tab.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleTab(tab.id)}
            className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
            {openTab === tab.id ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {openTab === tab.id && (
            <div className="p-4 pt-0 border-t border-gray-100">{tab.content}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MobileAccordion
