import React from 'react'
import { AssignmentCard } from '../assignments/AssignmentCard'
import { AssignmentFilters } from '../assignments/AssignmentFilters'
import { AssignmentStats } from '../assignments/AssignmentStats'
import { Icon } from '../common/Icon'

export const AssignmentsTab = ({
  assignments,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onUploadAssignment,
  onViewSubmission,
  onExpandAllSections,
}) => {
  const getFilteredAssignments = () => {
    let filtered = [...assignments]

    const filterMap = {
      not_started: a => !a.user_progress?.submitted_at,
      in_progress: a => a.user_progress?.submitted_at && a.user_progress?.status === 'submitted',
      completed: a => a.user_progress?.status === 'graded',
      mandatory: a => a.is_mandatory,
      optional: a => !a.is_mandatory,
      all: () => true,
    }

    filtered = filtered.filter(filterMap[filter] || filterMap.all)

    const sortMap = {
      difficulty: (a, b) => {
        const difficultyOrder = {
          beginner: 1,
          easy: 1,
          intermediate: 2,
          medium: 2,
          advanced: 3,
          hard: 3,
        }
        const aDiff = difficultyOrder[a.difficulty_level?.toLowerCase()] || 0
        const bDiff = difficultyOrder[b.difficulty_level?.toLowerCase()] || 0
        return aDiff - bDiff
      },
      due_date: (a, b) => {
        if (!a.end_date) return 1
        if (!b.end_date) return -1
        return new Date(a.end_date) - new Date(b.end_date)
      },
      points: (a, b) => {
        const aPoints = a.points || a.total_points || 0
        const bPoints = b.points || b.total_points || 0
        return bPoints - aPoints
      },
      sequence: (a, b) => {
        const aSeq = a.sequence_order || 0
        const bSeq = b.sequence_order || 0
        return aSeq - bSeq
      },
    }

    filtered.sort(sortMap[sort] || sortMap.sequence)

    return filtered
  }

  const getAssignmentStats = () => {
    const stats = {
      completed: assignments.filter(a => a.user_progress?.status === 'graded').length,
      inProgress: assignments.filter(
        a => a.user_progress?.submitted_at && a.user_progress?.status !== 'graded'
      ).length,
      notStarted: assignments.filter(a => !a.user_progress?.submitted_at).length,
      mandatory: assignments.filter(a => a.is_mandatory).length,
      optional: assignments.filter(a => !a.is_mandatory).length,
    }

    return stats
  }

  const getAssignmentsByDifficulty = () => {
    const difficultyCount = { beginner: 0, intermediate: 0, advanced: 0, other: 0 }

    assignments.forEach(assignment => {
      const level = assignment.difficulty_level?.toLowerCase()
      if (['beginner', 'easy'].includes(level)) difficultyCount.beginner++
      else if (['intermediate', 'medium'].includes(level)) difficultyCount.intermediate++
      else if (['advanced', 'hard'].includes(level)) difficultyCount.advanced++
      else difficultyCount.other++
    })

    return difficultyCount
  }

  const EmptyAssignmentsState = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="FileText" className="w-8 h-8 text-gray-600" />
      </div>
      <h4 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h4>
      <p className="text-gray-600">Assignments will be added to this course soon.</p>
    </div>
  )

  const filteredAssignments = getFilteredAssignments()
  const stats = getAssignmentStats()
  const difficultyStats = getAssignmentsByDifficulty()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Course Assignments</h3>
        <div className="text-sm text-gray-600">
          {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} •{' '}
          {stats.completed} completed
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyAssignmentsState />
      ) : (
        <>
          <AssignmentStats
            stats={stats}
            assignments={assignments}
            difficultyStats={difficultyStats}
          />

          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onExpandAllSections}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium px-3 py-1.5 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
            >
              Reset Expansion States
            </button>
            <div className="text-sm text-gray-600">
              Showing {filteredAssignments.length} assignment
              {filteredAssignments.length !== 1 ? 's' : ''}
            </div>
          </div>

          <AssignmentFilters
            filter={filter}
            sort={sort}
            onFilterChange={onFilterChange}
            onSortChange={onSortChange}
            stats={stats}
          />

          <div className="space-y-4">
            {filteredAssignments.map((assignment, index) => (
              <AssignmentCard
                key={assignment.assignment_id}
                assignment={assignment}
                onUpload={onUploadAssignment}
                onViewSubmission={onViewSubmission}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
