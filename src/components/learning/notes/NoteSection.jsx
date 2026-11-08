// components/learning/tabs/NoteSection.jsx
import React from 'react'
import { Icon } from '../common/Icon'

export const NoteSection = ({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  badge,
  className = '',
}) => {
  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {icon && <Icon name={icon} className="w-5 h-5 text-primary-600" />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} className="w-5 h-5 text-gray-500" />
      </button>

      {isExpanded && <div className="p-6 border-t border-gray-200">{children}</div>}
    </div>
  )
}
