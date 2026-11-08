import React from 'react'
import { Icon } from '../common/Icon'

export const ResourcesTab = ({ resources, onDownloadResource }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Resources</h3>
      <div className="space-y-3">
        {resources.map(resource => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Icon name="FileText" className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                <p className="text-sm text-gray-500">{resource.size}</p>
              </div>
            </div>
            <button
              onClick={() => onDownloadResource(resource)}
              className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              title="Download"
            >
              <Icon name="Download" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
