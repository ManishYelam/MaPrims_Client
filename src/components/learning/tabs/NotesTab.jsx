import React, { useState, useEffect } from 'react'
import {
  FiTrendingUp,
  FiFileText,
  FiInfo,
  FiLayout,
  FiBookOpen,
  FiCode,
  FiEdit,
  FiFolder,
  FiTag,
  FiClock,
  FiEye,
  FiStar,
  FiCalendar,
  FiTarget,
  FiBook,
  FiRefreshCw,
  FiCoffee,
  FiExternalLink,
  FiFile,
} from 'react-icons/fi'

export const NotesTab = ({ tutorialNote = null }) => {
  const [expandedSections, setExpandedSections] = useState({})
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (tutorialNote) {
      const initialExpanded = {
        introduction: true,
        theory: true,
        examples: false,
        practice: false,
        quickRefs: false,
        bestPractices: false,
        commonMistakes: false,
        stepByStep: false,
        furtherReading: false,
      }
      setExpandedSections(initialExpanded)
    }
  }, [tutorialNote])

  const toggleSection = sectionName => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
  }

  const renderDifficultyBadge = score => {
    if (!score) return null

    let colorClass = 'bg-green-100 text-green-800'
    if (score >= 8) colorClass = 'bg-red-100 text-red-800'
    else if (score >= 5) colorClass = 'bg-yellow-100 text-yellow-800'

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        <FiTrendingUp className="w-3 h-3 mr-1" />
        Difficulty: {score}/10
      </span>
    )
  }

  if (!tutorialNote) {
    return (
      <div className="py-10 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <FiFileText className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Tutorial Notes Available</h3>
        <p className="text-gray-600 text-sm mb-5">
          The tutor has not added any notes for this course yet.
        </p>
        <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs">
          <FiInfo className="w-3.5 h-3.5 mr-1.5" />
          <span>Notes will appear here when added by your tutor</span>
        </div>
      </div>
    )
  }

  const { title, content, metadata, view_count, rating, updatedAt } = tutorialNote

  const studyContent = content?.study_content || {}
  const tutorialNotes = content?.tutorial_notes || {}
  const examples = content?.examples_repository || {}
  const practice = content?.practice_exercises || {}
  const quickRefs = content?.quick_references || {}

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiLayout },
    { id: 'theory', label: 'Theory', icon: FiBookOpen },
    { id: 'examples', label: 'Examples', icon: FiCode },
    { id: 'practice', label: 'Practice', icon: FiEdit },
    { id: 'resources', label: 'Resources', icon: FiFolder },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="pr-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {metadata?.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  <FiTag className="w-2.5 h-2.5 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-700 text-base">{studyContent.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {renderDifficultyBadge(metadata?.complexity?.difficulty_score)}
            {tutorialNotes.estimated_study_time && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <FiClock className="w-3 h-3 mr-1" />
                {tutorialNotes.estimated_study_time} min study
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-primary-200 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiEye className="w-3.5 h-3.5" />
            <span>{view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiStar className="w-3.5 h-3.5 text-yellow-500" />
            <span>Rating: {rating || 'Not rated'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiCalendar className="w-3.5 h-3.5" />
            <span>Updated: {new Date(updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2.5 px-1 text-xs font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-1.5">
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {studyContent.introduction && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <FiBookOpen className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Introduction</h2>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {studyContent.introduction.title}
              </h3>
              <p className="text-gray-700 mb-5 text-base">{studyContent.introduction.content}</p>

              {studyContent.introduction.objectives &&
                studyContent.introduction.objectives.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-base font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                      <FiTarget className="w-4 h-4 text-primary-600" />
                      Learning Objectives
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {studyContent.introduction.objectives.map((objective, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 text-sm">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Theory Sections</p>
                  <p className="text-xl font-bold text-gray-900">
                    {tutorialNotes.total_sections || 0}
                  </p>
                </div>
                <FiBook className="w-6 h-6 text-primary-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Code Examples</p>
                  <p className="text-xl font-bold text-gray-900">
                    {examples.code_examples?.length || 0}
                  </p>
                </div>
                <FiCode className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Practice Items</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(practice.warmup_exercises?.length || 0) +
                      (practice.challenge_problems?.length || 0)}
                  </p>
                </div>
                <FiEdit className="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Last Updated</p>
                  <p className="text-base font-bold text-gray-900">
                    {tutorialNotes.last_updated
                      ? new Date(tutorialNotes.last_updated).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <FiRefreshCw className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theory Tab */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          {tutorialNotes.sections && tutorialNotes.sections.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-1.5">Theory Concepts</h2>
                <p className="text-gray-600 text-sm">
                  Explore the foundational concepts and theoretical knowledge
                </p>
              </div>

              <div className="p-5">
                <div className="space-y-6">
                  {tutorialNotes.sections.map((section, index) => (
                    <div key={index} className="border-l-3 border-primary-500 pl-5 py-1.5">
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {section.order}. {section.title}
                          </h3>
                          {section.estimated_time && (
                            <div className="flex items-center gap-2.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3.5 h-3.5" />
                                {section.estimated_time} min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {section.content?.headings && (
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-600 mb-1.5">
                            Topics Covered
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {section.content.headings.map((heading, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
                              >
                                {heading}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.content?.paragraphs && (
                        <div className="prose prose-base max-w-none text-gray-700">
                          {section.content.paragraphs.map((para, idx) => (
                            <p key={idx} className="mb-3 leading-relaxed text-sm">
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          {examples.code_examples && examples.code_examples.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FiCode className="w-5 h-5 text-green-600" />
                Code Examples
              </h2>
              <div className="space-y-5">
                {examples.code_examples.map((example, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-3.5 py-2.5 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiFile className="w-4 h-4 text-gray-300" />
                          <h5 className="font-semibold text-gray-100 text-sm">{example.title}</h5>
                        </div>
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-900 rounded">
                          {example.language}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <pre className="bg-gray-900 text-gray-100 p-3.5 rounded-lg overflow-x-auto text-xs">
                        <code>{example.code}</code>
                      </pre>
                      {example.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-1.5">
                            <FiInfo className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-blue-800 text-sm">{example.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {practice.warmup_exercises && practice.warmup_exercises.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-1.5">
                <FiEdit className="w-5 h-5 text-yellow-600" />
                Practice Exercises
              </h2>

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <FiCoffee className="w-4 h-4 text-green-600" />
                  Warmup Exercises
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {practice.warmup_exercises.map((exercise, index) => (
                    <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-900 text-sm">
                          Exercise {index + 1}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Beginner
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{exercise}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <FiEdit className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">No Practice Exercises Yet</h3>
              <p className="text-gray-600 text-sm">Practice exercises will be added soon.</p>
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {studyContent.further_reading && studyContent.further_reading.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3.5 flex items-center gap-1.5">
                <FiExternalLink className="w-4 h-4 text-blue-600" />
                Further Reading
              </h3>
              <div className="space-y-3">
                {studyContent.further_reading.map((reading, index) => (
                  <a
                    key={index}
                    href={reading.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {reading.title}
                        </h4>
                        {reading.author && (
                          <p className="text-xs text-gray-600 mt-0.5">By {reading.author}</p>
                        )}
                      </div>
                      <FiExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
