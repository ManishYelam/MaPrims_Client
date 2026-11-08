// src/components/course/CourseCurriculum.jsx
import React from 'react'
import { ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react'

const CourseCurriculum = React.memo(({ curriculum, modules, expandedModules, onToggleModule }) => {
  // console.log("CourseCurriculum received:", {
  //   curriculum,
  //   modules,
  //   curriculumType: typeof curriculum,
  //   isArray: Array.isArray(curriculum),
  //   curriculumLength: curriculum?.length,
  //   expandedModules: Array.from(expandedModules || [])
  // })

  // Determine what data to use - prefer curriculum if available, otherwise use modules
  let displayData = []

  if (curriculum && Array.isArray(curriculum)) {
    if (curriculum.length > 0) {
      // If curriculum has topics structure, use it as is
      if (typeof curriculum[0] === 'object' && curriculum[0].module) {
        displayData = curriculum
      }
      // If curriculum is array of strings, convert to objects
      else if (typeof curriculum[0] === 'string') {
        displayData = curriculum.map((module, index) => ({
          module,
          topics: [],
          duration: '2-3 hours',
        }))
      }
    }
  }
  // If no curriculum but we have modules array
  else if (modules && Array.isArray(modules) && modules.length > 0) {
    displayData = modules.map((module, index) => ({
      module,
      topics: [],
      duration: '2-3 hours',
    }))
  }

  // console.log("Processed displayData:", displayData)

  if (displayData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-base font-semibold text-gray-900 mb-2">Curriculum Coming Soon</h4>
        <p className="text-sm text-gray-600">
          Detailed curriculum is being prepared with industry experts.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Course Curriculum</h3>
        <p className="text-sm text-gray-600">
          Structured learning with {displayData.length} comprehensive modules
        </p>
      </div>

      <div className="space-y-3">
        {displayData.map((moduleItem, index) => {
          const moduleTitle = typeof moduleItem === 'string' ? moduleItem : moduleItem.module
          const topics = moduleItem.topics || []
          const duration = moduleItem.duration || '2-3 hours'

          return (
            <div
              key={index}
              className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-all"
            >
              <button
                onClick={() => onToggleModule(index)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 text-sm">{moduleTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration}
                      </p>
                      {topics.length > 0 && (
                        <p className="text-xs text-gray-500">• {topics.length} topics</p>
                      )}
                    </div>
                  </div>
                </div>
                {topics.length > 0 ? (
                  expandedModules.has(index) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )
                ) : (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    Coming soon
                  </span>
                )}
              </button>

              {expandedModules.has(index) && topics.length > 0 && (
                <div className="p-4 pt-2 border-t border-gray-100 animate-fadeIn">
                  <div className="space-y-2">
                    {topics.map((topic, topicIndex) => (
                      <div
                        key={topicIndex}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
                            <span className="text-primary-600 text-xs font-medium">
                              {topicIndex + 1}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">{topic}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          45 min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

// Add display name for debugging
CourseCurriculum.displayName = 'CourseCurriculum'

export default CourseCurriculum
