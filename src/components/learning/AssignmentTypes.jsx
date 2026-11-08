import React from 'react'
import { getAssignmentType } from '../../utils/courseConstants'

export const AssignmentTypes = ({ assignments }) => {
  if (assignments.length === 0) return null

  const typeCounts = {}
  assignments.forEach(assignment => {
    const type = assignment.assignment_type
    if (!typeCounts[type]) typeCounts[type] = 0
    typeCounts[type]++
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3">Assignment Types</h3>
      <div className="space-y-2">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{getAssignmentType(type)}</span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
