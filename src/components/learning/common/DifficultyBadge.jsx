import React from 'react'
import { getDifficultyColor } from '../../../utils/courseConstants'

export const DifficultyBadge = ({ level, className = '' }) => {
  const difficultyClass = getDifficultyColor(level)

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyClass} ${className}`}>
      {level || 'Beginner'}
    </span>
  )
}
