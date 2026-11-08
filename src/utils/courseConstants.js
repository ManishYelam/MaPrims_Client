export const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border border-green-200',
  easy: 'bg-green-100 text-green-800 border border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border border-red-200',
  hard: 'bg-red-100 text-red-800 border border-red-200',
  default: 'bg-gray-100 text-gray-800 border border-gray-200',
}

export const ASSIGNMENT_TYPES = {
  coding_exercise: 'Coding Exercise',
  coding: 'Coding Exercise',
  quiz: 'Quiz',
  project: 'Project',
  written: 'Written Assignment',
  default: 'Assignment',
}

export const SUBMISSION_STATUS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  graded: 'Graded',
  returned_for_revision: 'Needs Revision',
  default: 'Not Submitted',
}

export const STATUS_COLORS = {
  graded: 'bg-green-100 text-green-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  returned_for_revision: 'bg-orange-100 text-orange-800',
  default: 'bg-gray-100 text-gray-800',
}

export const RESOURCE_TYPES = {
  video_links: 'Video Resources',
  reading_materials: 'Reading Materials',
  documentation: 'Documentation',
  external_links: 'External Links',
}

export const formatTime = minutes => {
  if (!minutes) return 'N/A'
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export const getDifficultyColor = level => {
  if (!level) return DIFFICULTY_COLORS.default
  const normalizedLevel = level.toLowerCase()
  return DIFFICULTY_COLORS[normalizedLevel] || DIFFICULTY_COLORS.default
}

export const getAssignmentType = type => {
  if (!type) return ASSIGNMENT_TYPES.default
  const normalizedType = type.toLowerCase()
  return ASSIGNMENT_TYPES[normalizedType] || ASSIGNMENT_TYPES.default
}

export const getSubmissionStatus = progress => {
  if (!progress) return SUBMISSION_STATUS.default
  return SUBMISSION_STATUS[progress.status] || SUBMISSION_STATUS.default
}

export const getStatusColor = progress => {
  if (!progress) return STATUS_COLORS.default
  return STATUS_COLORS[progress.status] || STATUS_COLORS.default
}

export const getSubmissionButtonText = (progress, dueDate, isOverdue) => {
  const now = new Date()
  const due = dueDate ? new Date(dueDate) : null

  if (!progress || !progress.submitted_at) {
    if (due && now > due) return 'Submit Late'
    return 'Submit Assignment'
  }

  const buttonTexts = {
    returned_for_revision: 'Resubmit',
    graded: 'View Grade',
    under_review: 'View Status',
    default: 'View Submission',
  }

  return buttonTexts[progress.status] || buttonTexts.default
}

export const formatResourceType = type => {
  return RESOURCE_TYPES[type] || type
}
