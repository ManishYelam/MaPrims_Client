import React from 'react'
import { Icon } from '../common/Icon'

export const TabNavigation = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: 'lesson', label: 'Lesson', icon: 'BookOpen' },
    { id: 'assignments', label: 'Assignments', icon: 'FileText' },
    { id: 'resources', label: 'Resources', icon: 'Download' },
    { id: 'notes', label: 'Tutorial Notes', icon: 'MessageCircle' },
  ]

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <div className="border-b border-gray-200 min-w-max">
        <nav className="flex px-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
              {counts[tab.id] > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full min-w-[20px] flex items-center justify-center flex-shrink-0">
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
