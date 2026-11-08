import React from 'react'
import { formatDate } from '../../utils/helpers'

export const Deadlines = ({ assignments, onUploadAssignment }) => {
  const upcomingAssignments = assignments
    .filter(a => !a.user_progress?.submitted_at && a.end_date)
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .slice(0, 3)

  if (upcomingAssignments.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3">Upcoming Deadlines</h3>
      <div className="space-y-3">
        {upcomingAssignments.map(assignment => (
          <div
            key={assignment.assignment_id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">{assignment.title}</h4>
              <p className="text-xs text-gray-500">{formatDate(assignment.end_date)}</p>
            </div>
            <button
              onClick={() => onUploadAssignment(assignment)}
              className="ml-2 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 whitespace-nowrap"
            >
              {assignment.user_progress?.submitted_at ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
