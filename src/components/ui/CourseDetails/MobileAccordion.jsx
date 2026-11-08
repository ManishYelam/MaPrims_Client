// src/components/course/MobileAccordion.jsx
import React, { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const MobileAccordion = React.memo(({ tabs }) => {
  const [expanded, setExpanded] = useState(tabs[0].id)

  const toggleSection = id => {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div className="space-y-3">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <button
            onClick={() => toggleSection(tab.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                {tab.icon === 'BookOpen' && <span className="text-lg">📚</span>}
                {tab.icon === 'Code' && <span className="text-lg">💻</span>}
                {tab.icon === 'Target' && <span className="text-lg">🎯</span>}
                {tab.icon === 'User' && <span className="text-lg">👨‍🏫</span>}
              </div>
              <span className="font-semibold text-gray-900 text-sm">{tab.label}</span>
            </div>
            {expanded === tab.id ? (
              <Minus className="w-4 h-4 text-gray-500" />
            ) : (
              <Plus className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expanded === tab.id && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">{tab.content}</div>
          )}
        </div>
      ))}
    </div>
  )
})

export default MobileAccordion
