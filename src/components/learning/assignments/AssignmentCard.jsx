import React from 'react'
import { useExpansion } from '../hooks/useExpansion'
import { AnimatedSection } from '../common/AnimatedSection'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { DifficultyBadge } from '../common/DifficultyBadge'
import {
  formatTime,
  getAssignmentType,
  getSubmissionButtonText,
  formatResourceType,
} from '../../../utils/courseConstants'
import { formatDate } from '../../../utils/helpers'

export const AssignmentCard = ({ assignment, onUpload, onViewSubmission, index }) => {
  // Add a new expansion hook for the entire card
  const cardExp = useExpansion(`${assignment.assignment_id}_card`, {
    defaultExpanded: true, // Default to expanded, you can change to false if you want collapsed by default
  })

  const objectivesExp = useExpansion(`${assignment.assignment_id}_objectives`)
  const tasksExp = useExpansion(`${assignment.assignment_id}_tasks`)
  const criteriaExp = useExpansion(`${assignment.assignment_id}_criteria`)
  const tagsExp = useExpansion(`${assignment.assignment_id}_tags`)
  const resourcesExp = useExpansion(`${assignment.assignment_id}_resources`)

  const assignmentTypeDisplay = getAssignmentType(assignment.assignment_type)

  const getTechnologyDisplay = () => {
    if (assignment.technology_display) return assignment.technology_display
    if (assignment.technology_specific?.programming_language) {
      const language = assignment.technology_specific.programming_language
      const framework = assignment.technology_specific.framework
      return framework ? `${language} (${framework})` : language
    }
    return 'Programming'
  }

  const getLearningObjectives = () => {
    return assignment.metadata?.learning_objectives || []
  }

  const getTags = () => {
    return assignment.metadata?.tags || []
  }

  const getEvaluationCriteria = () => {
    return assignment.evaluation_criteria?.rubric || []
  }

  const getInstructionsTasks = () => {
    return assignment.instructions?.tasks || []
  }

  const getResources = () => {
    const defaultResources = {
      video_links: [],
      reading_materials: [],
      documentation: [],
      external_links: [],
    }

    if (!assignment.resources) return defaultResources

    return {
      video_links: assignment.resources.video_links || [],
      reading_materials: assignment.resources.reading_materials || [],
      documentation: assignment.resources.documentation || [],
      external_links: assignment.resources.external_links || [],
    }
  }

  const getResourceCount = () => {
    const resources = getResources()
    return Object.values(resources).reduce((sum, arr) => sum + arr.length, 0)
  }

  const getAcceptedFilesDisplay = () => {
    if (assignment.submission_format) {
      const formats = assignment.submission_format.split('_')
      return formats.join(', ').toUpperCase()
    }
    return 'ZIP, PDF, DOC, TXT'
  }

  const isOverdue = () => {
    if (!assignment.end_date) return false
    const now = new Date()
    const due = new Date(assignment.end_date)
    return now > due
  }

  const buttonText = getSubmissionButtonText(
    assignment.user_progress,
    assignment.end_date,
    isOverdue()
  )

  const resources = getResources()
  const resourceCount = getResourceCount()
  const learningObjectives = getLearningObjectives()
  const tags = getTags()
  const tasks = getInstructionsTasks()
  const criteria = getEvaluationCriteria()

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-primary-300 overflow-hidden">
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={cardExp.toggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-xs font-medium bg-primary-100 text-primary-800 px-2 py-0.5 rounded mr-2">
                #{assignment.sequence_order || index + 1}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${assignment.is_mandatory ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
              >
                {assignment.is_mandatory ? 'Mandatory' : 'Optional'}
              </span>
              {assignment.has_prerequisites && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                  Has Prerequisites
                </span>
              )}
              {isOverdue() && !assignment.user_progress?.submitted_at && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                  Overdue
                </span>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm mt-2">{assignment.title}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {assignment.short_description ||
                    assignment.description ||
                    'Complete this assignment and upload your solution.'}
                </p>

                {assignment.module_topic && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <Icon name="BookOpen" className="w-3 h-3 mr-1" />
                    <span className="font-medium">Module:</span> {assignment.module_topic}
                  </div>
                )}
              </div>

              <div className="flex items-center ml-4">
                <DifficultyBadge level={assignment.difficulty_level} />
                <button
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={e => {
                    e.stopPropagation()
                    cardExp.toggle()
                  }}
                  aria-label={
                    cardExp.isExpanded ? 'Collapse assignment details' : 'Expand assignment details'
                  }
                >
                  <Icon
                    name="ChevronDown"
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      cardExp.isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats - Always Visible */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex items-center text-xs text-gray-500">
            <Icon name="Clock" className="w-3 h-3 mr-1" />
            <span>{formatTime(assignment.estimated_time)}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Icon name="Award" className="w-3 h-3 mr-1" />
            <span>{assignment.points || assignment.total_points || 100} points</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Icon name="Calendar" className="w-3 h-3 mr-1" />
            <span className={isOverdue() ? 'text-red-600' : ''}>
              Due: {formatDate(assignment.end_date)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <StatusBadge progress={assignment.user_progress} />
            {assignment.user_progress?.grade && (
              <span className="ml-2 text-xs text-gray-600">
                Grade: {assignment.user_progress.grade}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatedSection isExpanded={cardExp.isExpanded}>
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Detailed Content */}
          <div className="grid grid-cols-2 gap-2 mb-3 pt-3">
            <div className="flex items-center text-xs text-gray-500">
              <Icon name="FileText" className="w-3 h-3 mr-1" />
              <span>{getAcceptedFilesDisplay()}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Icon name="Code" className="w-3 h-3 mr-1" />
              <span>{getTechnologyDisplay()}</span>
            </div>
          </div>

          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <Icon name="FileText" className="w-3 h-3 mr-1 text-gray-500" />
              Submission Requirements:
            </h5>
            <div className="space-y-2 text-xs text-gray-600">
              {assignment.submission_guidelines && (
                <div>
                  <span className="font-medium">Guidelines:</span>{' '}
                  {assignment.submission_guidelines}
                </div>
              )}
              <div className="flex items-center">
                <span className="font-medium mr-2">Accepted Formats:</span>
                <span className="bg-white px-2 py-0.5 rounded border">
                  {getAcceptedFilesDisplay()}
                </span>
              </div>
              {assignment.max_file_size && (
                <div>
                  <span className="font-medium">Max File Size:</span> {assignment.max_file_size}MB
                </div>
              )}
            </div>
          </div>

          {learningObjectives.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700 flex items-center">
                  <Icon name="BookOpen" className="w-3 h-3 mr-1 text-blue-500" />
                  Learning Objectives:
                </h5>
                {learningObjectives.length > 3 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      objectivesExp.toggle()
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-0.5 transition-colors flex items-center"
                  >
                    {objectivesExp.isExpanded ? (
                      <>
                        Show less
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1 transform rotate-180" />
                      </>
                    ) : (
                      <>
                        +{learningObjectives.length - 3} more
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <AnimatedSection isExpanded={true}>
                <div className="flex flex-wrap gap-1">
                  {learningObjectives
                    .slice(0, objectivesExp.isExpanded ? learningObjectives.length : 3)
                    .map((objective, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                        title={objective}
                      >
                        {objective.length > 40 ? objective.substring(0, 40) + '...' : objective}
                      </span>
                    ))}
                </div>
              </AnimatedSection>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700">Tags:</h5>
                {tags.length > 5 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      tagsExp.toggle()
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-0.5 transition-colors flex items-center"
                  >
                    {tagsExp.isExpanded ? (
                      <>
                        Show less
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1 transform rotate-180" />
                      </>
                    ) : (
                      <>
                        +{tags.length - 5} more
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <AnimatedSection isExpanded={true}>
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, tagsExp.isExpanded ? tags.length : 5).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                      title={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700 flex items-center">
                  <Icon name="FileText" className="w-3 h-3 mr-1 text-green-500" />
                  Tasks to Complete:
                </h5>
                {tasks.length > 2 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      tasksExp.toggle()
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-0.5 transition-colors flex items-center"
                  >
                    {tasksExp.isExpanded ? (
                      <>
                        Show less
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1 transform rotate-180" />
                      </>
                    ) : (
                      <>
                        +{tasks.length - 2} more tasks
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <AnimatedSection isExpanded={true}>
                <ul className="text-xs text-gray-600 list-disc pl-4">
                  {tasks.slice(0, tasksExp.isExpanded ? tasks.length : 2).map((task, idx) => (
                    <li
                      key={idx}
                      className="mb-1 p-1 hover:bg-gray-50 rounded transition-colors"
                      title={task}
                    >
                      {task.length > 80 ? task.substring(0, 80) + '...' : task}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </div>
          )}

          {resourceCount > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700 flex items-center">
                  <Icon name="Download" className="w-3 h-3 mr-1 text-purple-500" />
                  Helpful Resources:
                </h5>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    resourcesExp.toggle()
                  }}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-0.5 transition-colors flex items-center"
                >
                  {resourcesExp.isExpanded ? (
                    <>
                      Hide details
                      <Icon name="ChevronDown" className="w-3 h-3 ml-1 transform rotate-180" />
                    </>
                  ) : (
                    <>
                      Show details ({resourceCount})
                      <Icon name="ChevronDown" className="w-3 h-3 ml-1" />
                    </>
                  )}
                </button>
              </div>
              <AnimatedSection isExpanded={resourcesExp.isExpanded}>
                <div className="space-y-2 pl-1">
                  {Object.entries(resources).map(([type, items]) => {
                    if (items.length === 0) return null

                    return (
                      <div key={type} className="text-xs">
                        <h6 className="font-medium text-gray-700 mb-1">
                          {formatResourceType(type)} ({items.length})
                        </h6>
                        <ul className="list-disc pl-4 text-gray-600">
                          {items
                            .slice(0, resourcesExp.isExpanded ? items.length : 2)
                            .map((item, idx) => (
                              <li key={idx} className="mb-1">
                                {typeof item === 'string' ? item : item.title || item.url}
                              </li>
                            ))}
                          {items.length > 2 && !resourcesExp.isExpanded && (
                            <li className="text-gray-500">... and {items.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </AnimatedSection>
            </div>
          )}

          {criteria.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700 flex items-center">
                  <Icon name="Award" className="w-3 h-3 mr-1 text-yellow-500" />
                  Grading Rubric:
                </h5>
                {criteria.length > 2 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      criteriaExp.toggle()
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-0.5 transition-colors flex items-center"
                  >
                    {criteriaExp.isExpanded ? (
                      <>
                        Show less
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1 transform rotate-180" />
                      </>
                    ) : (
                      <>
                        +{criteria.length - 2} more criteria
                        <Icon name="ChevronDown" className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <AnimatedSection isExpanded={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {criteria
                    .slice(0, criteriaExp.isExpanded ? criteria.length : 2)
                    .map((criterion, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition-colors"
                      >
                        <div className="font-medium mb-1">{criterion.criteria}</div>
                        <div className="text-purple-900">
                          <span className="font-semibold">Weight:</span> {criterion.weight}%
                        </div>
                        {criterion.description && (
                          <div className="text-purple-800 mt-1 text-xs">
                            {criterion.description}
                          </div>
                        )}
                        {criterion.max_score && (
                          <div className="text-purple-900 mt-1">
                            <span className="font-semibold">Max Score:</span> {criterion.max_score}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </AnimatedSection>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-xs flex items-center">
              <StatusBadge progress={assignment.user_progress} />
              {assignment.user_progress?.submitted_at && (
                <span className="ml-2 text-gray-600">
                  Submitted: {formatDate(assignment.user_progress.submitted_at)}
                </span>
              )}
              {assignment.user_progress?.grade && (
                <span className="ml-2 text-gray-600">Grade: {assignment.user_progress.grade}%</span>
              )}
            </div>
            <div className="flex space-x-2">
              {assignment.user_progress?.submitted_at && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onViewSubmission(assignment.assignment_id)
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                >
                  View Submission
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation()
                  onUpload(assignment)
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  assignment.user_progress?.status === 'graded'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : assignment.user_progress?.status === 'returned_for_revision'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {buttonText}
              </button>
            </div>
          </div>

          <div className="mt-2 flex justify-between text-xs text-gray-500">
            {assignment.end_date && (
              <div className="flex items-center">
                <Icon name="Calendar" className="w-3 h-3 mr-1" />
                <span className={isOverdue() ? 'text-red-600' : ''}>
                  Due: {formatDate(assignment.end_date)} {isOverdue() && '• OVERDUE'}
                </span>
              </div>
            )}
            {assignment.allow_late_submission && (
              <div>
                <span className="text-green-600">Late submission allowed</span>
              </div>
            )}
          </div>

          {assignment.completion_stats && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Downloads: {assignment.completion_stats.download_count || 0}</span>
                <span>Submissions: {assignment.completion_stats.submission_count || 0}</span>
                <span>Avg Grade: {assignment.completion_stats.average_grade || '0.00'}%</span>
              </div>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  )
}
