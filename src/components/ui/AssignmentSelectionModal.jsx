// src/components/ui/AssignmentSelectionModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Search, FileText, Check, Code, Target, Clock, Award, Layers, Star } from 'lucide-react'
import { assignmentAPI } from '../../services/api'

// Assignment type icons mapping
const assignmentTypeIcons = {
  coding_exercise: Code,
  multiple_choice: FileText,
  project_based: Layers,
  theoretical: FileText,
  practical_lab: Code,
  case_study: Target,
  quiz: Star,
  peer_review: Award,
}

// Assignment difficulty colors
const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-orange-100 text-orange-800 border-orange-200',
  expert: 'bg-red-100 text-red-800 border-red-200',
}

// Difficulty labels
const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

// Assignment type labels
const assignmentTypeLabels = {
  coding_exercise: 'Coding Exercise',
  multiple_choice: 'Multiple Choice',
  project_based: 'Project Based',
  theoretical: 'Theoretical',
  practical_lab: 'Practical Lab',
  case_study: 'Case Study',
  quiz: 'Quiz',
  peer_review: 'Peer Review',
}

const AssignmentSelectionModal = ({
  show,
  onClose,
  onSelect,
  courseId,
  selectedAssignmentId = null,
  showFilters = true,
}) => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(selectedAssignmentId)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  // Filter states
  const [filters, setFilters] = useState({
    difficulty: '',
    type: '',
    active: true,
    search: '',
    technology: '',
    sort_by: 'sequence_order',
    sort_order: 'ASC',
  })

  useEffect(() => {
    if (show && courseId) {
      fetchAssignments(1)
      setSelectedId(selectedAssignmentId)
    }
  }, [show, courseId, selectedAssignmentId])

  const fetchAssignments = async (page = 1) => {
    try {
      setLoading(true)

      // Build query params
      const params = {
        page: page,
        limit: 10,
        ...filters,
      }

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const response = await assignmentAPI.getCourseAssignments(courseId, params)

      if (response.data?.success) {
        setAssignments(response.data.data || [])
        setPagination({
          currentPage: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.total_pages || 1,
          totalItems: response.data.pagination?.total || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = e => {
    const value = e.target.value
    setSearchQuery(value)
    setFilters(prev => ({ ...prev, search: value }))

    // Debounce search
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      fetchAssignments(1)
    }, 300)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))

    // Refetch with new filters
    clearTimeout(window.filterTimeout)
    window.filterTimeout = setTimeout(() => {
      fetchAssignments(1)
    }, 300)
  }

  const handleSelect = assignment => {
    setSelectedId(assignment.assignment_id || assignment.id)
  }

  const handleConfirm = () => {
    if (selectedId) {
      const selectedAssignment = assignments.find(
        a => a.assignment_id === selectedId || a.id === selectedId
      )
      onSelect(selectedAssignment)
    }
    onClose()
  }

  const handlePageChange = page => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchAssignments(page)
    }
  }

  const clearFilters = () => {
    setFilters({
      difficulty: '',
      type: '',
      active: true,
      search: '',
      technology: '',
      sort_by: 'sequence_order',
      sort_order: 'ASC',
    })
    setSearchQuery('')
    fetchAssignments(1)
  }

  // Get assignment type icon
  const getAssignmentTypeIcon = type => {
    const IconComponent = assignmentTypeIcons[type] || FileText
    return <IconComponent className="w-2.5 h-2.5" />
  }

  // Format sequence order
  const formatSequence = seq => {
    if (!seq) return 'N/A'
    return `#${seq}`
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Assignment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose an assignment for this course</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search assignments..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={e => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={e => handleFilterChange('type', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="">All Assignment Types</option>
              <option value="coding_exercise">Coding Exercise</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="project_based">Project Based</option>
              <option value="theoretical">Theoretical</option>
              <option value="practical_lab">Practical Lab</option>
              <option value="case_study">Case Study</option>
              <option value="quiz">Quiz</option>
              <option value="peer_review">Peer Review</option>
            </select>
          </div>

          {/* Technology and Sort Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Technology Filter */}
            <input
              type="text"
              value={filters.technology}
              onChange={e => handleFilterChange('technology', e.target.value)}
              placeholder="Filter by technology..."
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />

            {/* Sort By */}
            <select
              value={filters.sort_by}
              onChange={e => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="sequence_order">Sort by Sequence</option>
              <option value="title">Sort by Title</option>
              <option value="difficulty_level">Sort by Difficulty</option>
              <option value="created_at">Sort by Date Created</option>
            </select>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <select
                value={filters.sort_order}
                onChange={e => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
              <button
                onClick={clearFilters}
                className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5"></div>
                <p className="text-xs text-gray-600">Loading assignments...</p>
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 p-3">
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
              <h3 className="text-xs font-medium text-gray-900 mb-1">No assignments found</h3>
              <p className="text-xs text-gray-600 text-center">
                {searchQuery || filters.difficulty || filters.type
                  ? 'No assignments match your filters.'
                  : 'No assignments are available for this course.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-250px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Sequence
                    </th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map(assignment => {
                    const isSelected = selectedId === (assignment.assignment_id || assignment.id)
                    return (
                      <tr
                        key={assignment.assignment_id || assignment.id}
                        onClick={() => handleSelect(assignment)}
                        className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-2">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              {getAssignmentTypeIcon(assignment.assignment_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 mb-0.5">
                                {assignment.title}
                              </h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-0.5">
                                {assignment.description || 'No description'}
                              </p>
                              {assignment.module_topic && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <span>📚</span>
                                  <span>{assignment.module_topic}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-700">
                              {assignmentTypeLabels[assignment.assignment_type] ||
                                assignment.assignment_type}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${difficultyColors[assignment.difficulty_level] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                          >
                            {difficultyLabels[assignment.difficulty_level] ||
                              assignment.difficulty_level}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {formatSequence(assignment.sequence_order)}
                              </span>
                            </div>
                            {assignment.estimated_time && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-2.5 h-2.5" />
                                {assignment.estimated_time}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {assignments.length > 0 && (
          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-gray-600">
                Showing {assignments.length} of {pagination.totalItems} assignments
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 py-1 text-[11px] font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-6 h-6 text-[11px] flex items-center justify-center rounded ${
                          pagination.currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-gray-400 text-xs">...</span>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className={`w-6 h-6 text-[11px] flex items-center justify-center rounded ${
                          pagination.currentPage === pagination.totalPages
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-2 py-1 text-[11px] font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {selectedId ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-green-500" />
                  Assignment selected
                </span>
              ) : (
                'No assignment selected'
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                  selectedId
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Select Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentSelectionModal
