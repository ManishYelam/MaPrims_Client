import React from 'react'
import { getSubmissionStatus, getStatusColor } from '../../../utils/courseConstants'

export const StatusBadge = ({ progress, className = '' }) => {
  const statusDisplay = getSubmissionStatus(progress)
  const statusColorClass = getStatusColor(progress)

  return (
    <span className={`px-2 py-1 rounded ${statusColorClass} ${className}`}>{statusDisplay}</span>
  )
}
