import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './common/Icon'

export const QuickActions = ({ courseId, assignmentCount, topicCount }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        <Link
          to={`/dashboard/courses/${courseId}/assignments`}
          className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Icon name="FileText" className="w-4 h-4 mr-3 text-gray-400" />
          View Assignments ({assignmentCount})
        </Link>
        <Link
          to={`/dashboard/courses/${courseId}`}
          className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Icon name="BookOpen" className="w-4 h-4 mr-3 text-gray-400" />
          Course Details
        </Link>
        <Link
          to="/dashboard/progress"
          className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Icon name="BarChart3" className="w-4 h-4 mr-3 text-gray-400" />
          View Progress
        </Link>
        <Link
          to="/dashboard/support"
          className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Icon name="MessageCircle" className="w-4 h-4 mr-3 text-gray-400" />
          Get Help
        </Link>
      </div>
    </div>
  )
}
