import React from 'react'

export const AssignmentFilters = ({ filter, sort, onFilterChange, onSortChange, stats }) => {
  const filterOptions = [
    { id: 'all', label: `All Assignments` },
    { id: 'not_started', label: `Not Started (${stats.notStarted})` },
    { id: 'in_progress', label: `In Progress (${stats.inProgress})` },
    { id: 'completed', label: `Completed (${stats.completed})` },
    { id: 'mandatory', label: `Mandatory (${stats.mandatory})` },
    { id: 'optional', label: `Optional (${stats.optional})` },
  ]

  const sortOptions = [
    { id: 'sequence', label: 'Sequence' },
    { id: 'difficulty', label: 'Difficulty' },
    { id: 'due_date', label: 'Due Date' },
    { id: 'points', label: 'Points' },
  ]

  return (
    <>
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {filterOptions.map(option => (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors ${
              filter === option.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">Sort by:</div>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {sortOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
