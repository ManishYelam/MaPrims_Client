import React from 'react'
import { getAssignmentType } from '../../../utils/courseConstants'

export const AssignmentStats = ({ stats, assignments, difficultyStats }) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-700 mb-1">Total Assignments</div>
          <div className="text-2xl font-bold text-blue-900">{stats.assignments}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-700 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-sm text-yellow-700 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-sm text-purple-700 mb-1">Not Started</div>
          <div className="text-2xl font-bold text-purple-900">{stats.notStarted}</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Difficulty Distribution</h4>
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{
                width: `${(difficultyStats.beginner / assignments.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{
                width: `${(difficultyStats.intermediate / assignments.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{
                width: `${(difficultyStats.advanced / assignments.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Beginner: {difficultyStats.beginner}</span>
          <span>Intermediate: {difficultyStats.intermediate}</span>
          <span>Advanced: {difficultyStats.advanced}</span>
        </div>
      </div>
    </>
  )
}
