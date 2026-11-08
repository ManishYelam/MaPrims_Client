import React from 'react'
import {
  FaBook,
  FaClock,
  FaList,
  FaEye,
  FaDownload,
  FaEdit,
  FaChartBar,
  FaStar,
  FaCheckCircle,
  FaCode,
  FaImages,
  FaListOl,
  FaLightbulb,
  FaQuestionCircle,
} from 'react-icons/fa'

const TutorialNotesPreview = ({ tutorialNote, onView, onDownload, onEdit }) => {
  if (!tutorialNote) return null

  const stats = {
    sections: tutorialNote.content?.tutorial_notes?.total_sections || 0,
    studyTime: tutorialNote.content?.tutorial_notes?.estimated_study_time || 0,
    codeExamples: tutorialNote.content?.examples_repository?.code_examples?.length || 0,
    exercises: tutorialNote.content?.practice_exercises?.warmup_exercises?.length || 0,
    visualAids: tutorialNote.content?.visual_aids?.diagrams?.length || 0,
    lastUpdated: tutorialNote.content?.tutorial_notes?.last_updated
      ? new Date(tutorialNote.content.tutorial_notes.last_updated).toLocaleDateString()
      : 'Never',
  }

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaBook className="text-purple-500 w-5 h-5" />
          <h3 className="text-sm font-semibold text-gray-900">Tutorial Notes Preview</h3>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1 transition-colors"
            >
              <FaEdit className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            onClick={onView}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1 transition-colors"
          >
            <FaEye className="w-3 h-3" /> View
          </button>
          <button
            onClick={onDownload}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1 transition-colors"
          >
            <FaDownload className="w-3 h-3" /> Download
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaList className="text-blue-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Sections</div>
            <div className="text-sm font-semibold">{stats.sections}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaClock className="text-green-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Study Time</div>
            <div className="text-sm font-semibold">{stats.studyTime} min</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaChartBar className="text-orange-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Code Examples</div>
            <div className="text-sm font-semibold">{stats.codeExamples}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaStar className="text-yellow-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Exercises</div>
            <div className="text-sm font-semibold">{stats.exercises}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaCode className="text-purple-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Templates</div>
            <div className="text-sm font-semibold">
              {tutorialNote.content?.examples_repository?.templates?.length || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <FaCheckCircle className="text-gray-500 w-4 h-4" />
          <div>
            <div className="text-xs text-gray-500">Last Updated</div>
            <div className="text-sm font-semibold">{stats.lastUpdated}</div>
          </div>
        </div>
      </div>

      {/* Introduction Preview */}
      {tutorialNote.content?.study_content?.introduction?.content && (
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="text-xs font-medium text-blue-900">Introduction</div>
          </div>
          <p className="text-xs text-gray-700 line-clamp-3">
            {tutorialNote.content.study_content.introduction.content}
          </p>
        </div>
      )}

      {/* Learning Objectives */}
      {tutorialNote.content?.study_content?.introduction?.objectives &&
        tutorialNote.content.study_content.introduction.objectives.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-xs font-medium text-green-900">Learning Objectives</div>
            </div>
            <ul className="space-y-1">
              {tutorialNote.content.study_content.introduction.objectives
                .slice(0, 3)
                .map((obj, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{obj}</span>
                  </li>
                ))}
              {tutorialNote.content.study_content.introduction.objectives.length > 3 && (
                <li className="text-xs text-gray-500">
                  +{tutorialNote.content.study_content.introduction.objectives.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

      {/* Content Types */}
      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <FaLightbulb className="text-purple-500 w-4 h-4" />
          <div className="text-xs font-medium text-gray-900">Content Types Included</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tutorialNote.content?.study_content?.theory_concepts &&
            tutorialNote.content.study_content.theory_concepts.length > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Theory
              </span>
            )}
          {tutorialNote.content?.examples_repository?.code_examples &&
            tutorialNote.content.examples_repository.code_examples.length > 0 && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Code Examples
              </span>
            )}
          {tutorialNote.content?.practice_exercises?.warmup_exercises &&
            tutorialNote.content.practice_exercises.warmup_exercises.length > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Exercises
              </span>
            )}
          {tutorialNote.content?.visual_aids?.diagrams &&
            tutorialNote.content.visual_aids.diagrams.length > 0 && (
              <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded-full">
                Diagrams
              </span>
            )}
          {tutorialNote.content?.quick_references?.cheat_sheets &&
            tutorialNote.content.quick_references.cheat_sheets.length > 0 && (
              <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                Cheat Sheets
              </span>
            )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              tutorialNote.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {tutorialNote.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            v{tutorialNote.content?.tutorial_notes?.version || '1.0'}
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default TutorialNotesPreview
