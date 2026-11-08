import React from 'react'

export const CourseStats = ({ assignments, modules, enrollment }) => {
  const getCourseStats = () => {
    const stats = {
      progress: enrollment?.progress || 0,
      assignments: assignments.length,
      completed: assignments.filter(a => a.user_progress?.status === 'graded').length,
      modules: modules.length,
      topics: modules.reduce((sum, module) => sum + (module.topics?.length || 0), 0),
      averageScore: 0,
      totalPoints: 0,
      earnedPoints: 0,
      inProgress: assignments.filter(
        a => a.user_progress?.submitted_at && a.user_progress?.status !== 'graded'
      ).length,
      notStarted: assignments.filter(a => !a.user_progress?.submitted_at).length,
      mandatory: assignments.filter(a => a.is_mandatory).length,
      optional: assignments.filter(a => !a.is_mandatory).length,
    }

    if (assignments.length > 0) {
      const completedAssignments = assignments.filter(a => a.user_progress?.status === 'graded')
      if (completedAssignments.length > 0) {
        const totalScore = completedAssignments.reduce(
          (sum, a) => sum + (a.user_progress?.grade || 0),
          0
        )
        stats.averageScore = Math.round(totalScore / completedAssignments.length)
      }

      stats.totalPoints = assignments.reduce((sum, a) => sum + (a.points || a.total_points || 0), 0)
      stats.earnedPoints = completedAssignments.reduce((sum, a) => {
        const points = a.points || a.total_points || 0
        const score = a.user_progress?.grade || 0
        return sum + Math.round((points * score) / 100)
      }, 0)
    }

    return stats
  }

  const stats = getCourseStats()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3">Course Stats</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="font-medium">{stats.progress}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Modules</span>
          <span className="font-medium">{stats.modules}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Topics</span>
          <span className="font-medium">{stats.topics}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Assignments</span>
          <span className="font-medium">{stats.assignments}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Completed</span>
          <span className="font-medium">
            {stats.completed}/{stats.assignments}
          </span>
        </div>
        {stats.averageScore > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average Score</span>
            <span className="font-medium">{stats.averageScore}%</span>
          </div>
        )}
        {stats.totalPoints > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Points Earned</span>
            <span className="font-medium">
              {stats.earnedPoints}/{stats.totalPoints}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
