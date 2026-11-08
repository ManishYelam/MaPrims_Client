import React from 'react'
import { FaBookOpen, FaClock, FaChevronRight, FaCheckCircle, FaGraduationCap } from 'react-icons/fa'
import { formatTime } from '../../utils/courseConstants'

export const CourseSidebar = ({
  modules,
  currentLessonId,
  onSelectLesson,
  onToggleModule,
  expandedModule,
  isLoading,
}) => {
  // Color constants for consistency
  const colors = {
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    success: {
      100: 'bg-emerald-100',
      500: 'bg-emerald-500',
      600: 'bg-emerald-600',
      text: 'text-emerald-600',
    },
    neutral: {
      50: 'bg-gray-50',
      100: 'bg-gray-100',
      500: 'bg-gray-500',
      600: 'bg-gray-600',
    },
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
        <div className="p-2 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Course Content</h3>
        </div>
        <div className="p-2 flex-1">
          <div className="text-center py-4 text-gray-500 text-xs">No content available</div>
        </div>
      </div>
    )
  }

  const totalTopics = modules.reduce((sum, module) => sum + (module.topics?.length || 0), 0)
  const totalDuration = modules.reduce((sum, module) => {
    const moduleDuration =
      module.topics?.reduce((topicSum, topic) => topicSum + (topic.duration || 15), 0) ||
      (module.topics?.length || 0) * 15
    return sum + moduleDuration
  }, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full text-xs">
      {/* Compact Header */}
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
            <FaGraduationCap className="w-3.5 h-3.5 text-blue-600" />
            Course Content
          </h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded">
            {totalTopics}
          </span>
        </div>
        <div className="flex items-center text-gray-600 gap-2">
          <span className="flex items-center gap-1">
            <FaBookOpen className="w-3 h-3 text-blue-500" />
            <span className="font-medium">{modules.length}</span>
          </span>
          <span className="flex items-center gap-1">
            <FaClock className="w-3 h-3 text-amber-500" />
            <span className="font-medium">{formatTime(totalDuration)}</span>
          </span>
        </div>
      </div>

      {/* Compact Content Area */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module, moduleIndex) => {
          const topicCount = module.topics?.length || 0
          const moduleDuration =
            module.topics?.reduce((sum, topic) => sum + (topic.duration || 15), 0) ||
            topicCount * 15
          const isExpanded = expandedModule === module.id || expandedModule === moduleIndex
          const hasSelectedTopic = module.topics?.some(
            (_, topicIndex) => currentLessonId === `${moduleIndex}-${topicIndex}`
          )

          return (
            <div
              key={module.id || moduleIndex}
              className={
                'border-b border-gray-100 last:border-0' +
                (isExpanded ? ` ${colors.primary[50]}` : '') +
                (hasSelectedTopic && !isExpanded ? ' bg-amber-50' : '')
              }
            >
              {/* Compact Module Header */}
              <button
                onClick={() => onToggleModule(module.id || moduleIndex)}
                className={
                  'w-full flex items-center justify-between p-1.5 transition-all duration-150 ' +
                  (isExpanded
                    ? `${colors.primary[100]} border-l-2 ${colors.primary.border}`
                    : 'hover:bg-gray-50 border-l-2 border-transparent') +
                  (hasSelectedTopic && !isExpanded
                    ? ' bg-amber-50 hover:bg-amber-100 border-l-2 border-amber-300'
                    : '')
                }
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Module Number */}
                  <div
                    className={
                      'w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium flex-shrink-0 ' +
                      (module.isCompleted
                        ? `${colors.success[100]} ${colors.success.text}`
                        : isExpanded
                          ? `${colors.primary[100]} ${colors.primary.text}`
                          : hasSelectedTopic
                            ? 'bg-amber-100 text-amber-700'
                            : `${colors.neutral[100]} ${colors.neutral[600]}`)
                    }
                  >
                    {module.isCompleted ? '✓' : moduleIndex + 1}
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <h4
                      className={
                        'font-medium truncate ' +
                        (isExpanded
                          ? colors.primary.text
                          : hasSelectedTopic
                            ? 'text-amber-700'
                            : 'text-gray-900')
                      }
                    >
                      {module.title || module.module}
                    </h4>
                    <div className="flex items-center text-gray-500 mt-0.5 gap-1.5">
                      <span className="text-[10px]">{topicCount}t</span>
                      <span className="flex items-center gap-0.5">
                        <FaClock
                          className={
                            'w-2.5 h-2.5' + (isExpanded ? ` ${colors.primary.text}` : '')
                          }
                        />
                        <span className="text-[10px]">{formatTime(moduleDuration)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {module.isCompleted && <FaCheckCircle className="w-3 h-3 text-emerald-500" />}
                  <FaChevronRight
                    className={
                      'w-2.5 h-2.5 transition-transform duration-200 ' +
                      (isExpanded
                        ? `${colors.primary.text} rotate-90`
                        : hasSelectedTopic
                          ? 'text-amber-500'
                          : 'text-gray-400')
                    }
                  />
                </div>
              </button>

              {/* Compact Topics List */}
              {isExpanded && module.topics && (
                <div className="pb-1 px-1.5">
                  <div className="ml-5 border-l border-dashed border-blue-200 pl-2">
                    {module.topics.map((topic, topicIndex) => {
                      const lessonId = `${moduleIndex}-${topicIndex}`
                      const isCurrent = currentLessonId === lessonId
                      const topicDuration = topic.duration || 15
                      const isCompleted = topic.isCompleted || module.isCompleted

                      return (
                        <button
                          key={topic.id || lessonId}
                          onClick={() => onSelectLesson(lessonId, moduleIndex, topicIndex)}
                          className={
                            'w-full flex items-center justify-between p-1.5 rounded mb-1 transition-all duration-150 relative ' +
                            (isCurrent
                              ? `${colors.primary[100]} border-l-2 ${colors.primary.border}`
                              : 'hover:bg-gray-50 border-l-2 border-transparent') +
                            (isCompleted && !isCurrent ? ' opacity-80' : '')
                          }
                        >
                          {/* Topic Connector */}
                          <div
                            className={
                              'absolute -left-1.5 top-1/2 w-1.5 h-1.5 rounded-full ' +
                              (isCurrent
                                ? `${colors.primary[500]} border border-white`
                                : isCompleted
                                  ? 'bg-emerald-500 border border-white'
                                  : 'bg-gray-300 border border-white')
                            }
                          />

                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {/* Topic Number */}
                            <div
                              className={
                                'w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium flex-shrink-0 ' +
                                (isCurrent
                                  ? `${colors.primary[500]} text-white`
                                  : isCompleted
                                    ? `${colors.success[500]} text-white`
                                    : `${colors.neutral[100]} ${colors.neutral[600]}`)
                              }
                            >
                              {topicIndex + 1}
                            </div>

                            <div className="text-left flex-1 min-w-0">
                              <h5
                                className={
                                  'font-medium truncate ' +
                                  (isCurrent
                                    ? colors.primary.text
                                    : isCompleted
                                      ? colors.success.text
                                      : 'text-gray-900')
                                }
                              >
                                {topic.title || topic}
                              </h5>
                              <div className="flex items-center mt-0.5 gap-1">
                                <FaClock
                                  className={
                                    'w-2.5 h-2.5 ' +
                                    (isCurrent
                                      ? colors.primary.text
                                      : isCompleted
                                        ? colors.success.text
                                        : 'text-gray-500')
                                  }
                                />
                                <span
                                  className={
                                    'text-[10px] ' +
                                    (isCurrent
                                      ? colors.primary.text
                                      : isCompleted
                                        ? colors.success.text
                                        : 'text-gray-500')
                                  }
                                >
                                  {formatTime(topicDuration)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isCurrent && (
                              <span
                                className={`text-[10px] font-medium px-1 py-0.5 rounded ${colors.primary[100]} ${colors.primary.text}`}
                              >
                                Now
                              </span>
                            )}
                            {(isCompleted || isCurrent) && (
                              <FaCheckCircle
                                className={
                                  'w-3 h-3 ' +
                                  (isCurrent ? colors.primary.text : colors.success.text)
                                }
                              />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}