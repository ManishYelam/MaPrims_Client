import React from 'react'
import { Icon } from '../common/Icon'

export const LessonTab = ({
  currentLesson,
  currentModule,
  course,
  onMarkComplete,
  onNextLesson,
  isLastLesson = false,
}) => {
  const smallContainerClass = 'bg-gray-50 rounded-lg p-3 mb-3' // reused small container
  const smallHeaderClass = 'text-sm font-medium mb-1'

  return (
    <div>
      {/* Module Label */}
      <div className="mb-2">
        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          {currentModule?.module || 'Module'}
        </span>
      </div>

      {/* Lesson Title & Description */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{currentLesson.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{currentLesson.description}</p>

      {/* Learning Objectives */}
      {course.metadata?.learning_objectives && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <h4 className="font-semibold text-gray-900 mb-1">Learning Objectives</h4>
          <ul className="text-gray-700 list-disc pl-4 space-y-0.5 text-sm">
            {course.metadata.learning_objectives.map((objective, idx) => (
              <li key={idx}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {course.metadata?.prerequisites && currentLesson.moduleIndex === 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 mb-3">
          <h4 className="font-semibold text-gray-900 mb-1">Prerequisites</h4>
          <ul className="text-gray-700 list-disc pl-4 space-y-0.5 text-sm">
            {course.metadata.prerequisites.map((prerequisite, idx) => (
              <li key={idx}>{prerequisite}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Topic Content */}
      <div className={smallContainerClass}>
        <h4 className="font-semibold text-gray-900 mb-1">Topic Content</h4>
        <p className="text-gray-700 text-sm">
          This topic covers important concepts related to {currentLesson.title}. Watch the video
          above and refer to the course materials for detailed information.
        </p>

        {currentModule?.topics && (
          <div className="mt-2">
            <h5 className="text-xs font-medium text-gray-900 mb-1">Other topics in this module:</h5>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {currentModule.topics
                .filter((_, idx) => idx !== currentLesson.topicIndex)
                .slice(0, 3)
                .map((topic, idx) => (
                  <li key={idx}>• {topic}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-2">
        <button
          onClick={onMarkComplete}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center text-sm ${
            currentLesson.completed
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {currentLesson.completed ? (
            <>
              <Icon name="CheckCircle" className="w-4 h-4 inline mr-1" />
              Topic Completed
            </>
          ) : (
            'Mark as Complete'
          )}
        </button>

        <button
          onClick={onNextLesson}
          disabled={isLastLesson}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center text-sm ${
            isLastLesson
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          Next Topic
          <Icon name="ChevronRight" className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  )
}
