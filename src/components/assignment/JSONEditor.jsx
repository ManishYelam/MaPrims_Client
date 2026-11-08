import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react'
import {
  FaSave,
  FaTimes,
  FaCode,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaDownload,
  FaUpload,
  FaFileCode,
  FaObjectGroup,
  FaUndo,
  FaRedo,
  FaCloudDownloadAlt,
  FaShieldAlt,
  FaBrain,
  FaDatabase,
  FaCog,
  FaRobot,
  FaBook,
  FaSearch,
  FaCloudUploadAlt,
  FaSpinner,
  FaInfoCircle,
  FaExclamationCircle,
  FaMagic,
  FaExpand,
  FaCompress,
  FaChevronRight,
  FaChevronLeft,
  FaBookOpen,
  FaFileAlt,
  FaSync,
  FaLayerGroup,
  FaRegEdit,
  FaRegTrashAlt,
  FaEye,
  FaFileImport,
  FaMoon,
  FaSun,
  FaPalette,
  FaChartBar,
  FaChevronDown,
  FaCheck,
  FaWrench,
  FaSlidersH,
  FaStar,
  FaListAlt,
  FaGraduationCap,
  FaLightbulb,
  FaVideo,
  FaImage,
  FaTable,
  FaListOl,
  FaQuoteLeft,
  FaExclamation,
  FaQuestionCircle,
} from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'
import JSONLinter from './JSONLinter'
import CourseSelectionModal from '../ui/CourseSelectionModal'
import AssignmentSelectionModal from '../ui/AssignmentSelectionModal'
import TutorialNotesPreview from './TutorialNotesPreview'
import { assignmentAPI, tutorialNoteAPI } from '../../services/api'

import { validateAssignmentData, formatAndValidateJSON, generateSampleJSON } from './jsonValidator'
import { validateTutorialNoteData, generateSampleTutorialNote } from './tutorialNoteValidator'
import JSONSchemaDoc from './JSONSchemaDoc'

import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

// UI Components - Compact Versions
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded ${className}`} {...props}>
    {children}
  </div>
)

const Button = ({
  children,
  variant = 'default',
  size = 'sm',
  leftIcon,
  rightIcon,
  className = '',
  disabled = false,
  onClick,
  as = 'button',
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    outline:
      'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:opacity-50',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning:
      'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-300',
    default: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100',
  }

  const sizes = {
    xs: 'px-1.5 py-1 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm',
  }

  const Component = as

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      type={type}
      {...props}
    >
      {leftIcon && <span className="mr-1">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1">{rightIcon}</span>}
    </Component>
  )
}

const Alert = ({ children, variant = 'info', className = '', icon, ...props }) => {
  const variants = {
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
  }

  const icons = {
    info: <FaInfoCircle className="w-3 h-3 text-blue-500" />,
    success: <FaCheckCircle className="w-3 h-3 text-green-500" />,
    warning: <FaExclamationTriangle className="w-3 h-3 text-yellow-500" />,
    error: <FaExclamationCircle className="w-3 h-3 text-red-500" />,
  }

  return (
    <div className={`p-2 rounded ${variants[variant]} ${className}`} {...props}>
      <div className="flex items-start">
        {icon || icons[variant]}
        <div className="ml-2 flex-1 text-xs">{children}</div>
      </div>
    </div>
  )
}

const Badge = ({ children, variant = 'default', size = 'sm', className = '', ...props }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

const Modal = ({ isOpen, onClose, children, size = 'md', ...props }) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-2',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 pt-2 pb-16 text-center">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block w-full ${sizes[size]} my-4 overflow-hidden text-left align-middle transition-all transform bg-white rounded shadow-xl`}
          {...props}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const ModalHeader = ({ children, className = '', ...props }) => (
  <div className={`px-2 py-2 border-b border-gray-200 ${className}`} {...props}>
    <h3 className="text-sm font-medium text-gray-900">{children}</h3>
  </div>
)

const ModalBody = ({ children, className = '', ...props }) => (
  <div className={`px-2 py-2 ${className}`} {...props}>
    {children}
  </div>
)

const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`px-2 py-2 bg-gray-50 border-t border-gray-200 ${className}`} {...props}>
    <div className="flex justify-end space-x-2">{children}</div>
  </div>
)

const Spinner = ({ size = 'sm', className = '', ...props }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

const Textarea = React.forwardRef(({ className = '', rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`w-full px-2 py-1.5 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs ${className}`}
    {...props}
  />
))

const Tooltip = ({ content, children, placement = 'top', className = '', ...props }) => {
  const [show, setShow] = useState(false)

  const placements = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-1',
  }

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-block"
      >
        {children}
      </div>
      {show && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow whitespace-nowrap ${placements[placement]}`}
        >
          {content}
          <div
            className={`absolute w-1.5 h-1.5 bg-gray-900 transform rotate-45 ${
              placement === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-0.5'
                : placement === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 -mb-0.5'
                  : placement === 'left'
                    ? 'left-full top-1/2 -translate-y-1/2 -ml-0.5'
                    : 'right-full top-1/2 -translate-y-1/2 -mr-0.5'
            }`}
          />
        </div>
      )}
    </div>
  )
}

// Editor History Class
class EditorHistory {
  constructor(maxHistory = 50) {
    this.history = []
    this.currentIndex = -1
    this.maxHistory = maxHistory
  }

  push(state) {
    if (state === this.getCurrent()) return
    this.history = this.history.slice(0, this.currentIndex + 1)
    this.history.push(state)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    } else {
      this.currentIndex = this.history.length - 1
    }
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++
      return this.history[this.currentIndex]
    }
    return null
  }

  canUndo() {
    return this.currentIndex > 0
  }
  canRedo() {
    return this.currentIndex < this.history.length - 1
  }
  getCurrent() {
    return this.history[this.currentIndex] || ''
  }
  clear() {
    this.history = []
    this.currentIndex = -1
  }
}

// Custom Hooks
const useEditorHistory = (initialState = '') => {
  const historyRef = useRef(new EditorHistory())
  useEffect(() => {
    if (initialState && initialState !== historyRef.current.getCurrent()) {
      historyRef.current.push(initialState)
    }
  }, [initialState])
  return historyRef.current
}

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// Helper function to detect content type
const detectContentType = content => {
  if (!content || !content.trim()) return 'assignment'
  try {
    const parsed = JSON.parse(content)
    if (parsed.content?.tutorial_notes || parsed.content?.study_content) {
      return 'tutorial_note'
    }
    if (parsed.instructions || parsed.evaluation_criteria || parsed.assignment_type) {
      return 'assignment'
    }
    return 'assignment'
  } catch (e) {
    return 'assignment'
  }
}

// Helper to map content type to permission resource type
const getResourceTypeForContentType = type => {
  if (type === 'tutorial_note') return 'tutorial'
  return type // 'assignment' stays as is
}

// Main Component
const JSONEditor = ({
  assignmentId,
  courseId,
  mode = 'create',
  onSave,
  onCancel,
  initialData = null,
  showGuidelines = true,
  onModeChange,
}) => {
  // ===== Permission helpers with level support =====
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  // State
  const [jsonContent, setJsonContent] = useState('')
  const [parsedJson, setParsedJson] = useState(null)
  const [validation, setValidation] = useState({
    isValid: false,
    errors: [],
    warnings: [],
    info: [],
  })
  const [lintResults, setLintResults] = useState({
    errors: [],
    warnings: [],
    suggestions: [],
    score: 100,
  })
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSchemaDoc, setShowSchemaDoc] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showLeftPanel, setShowLeftPanel] = useState(true)

  const [editorTheme, setEditorTheme] = useState('light')
  const [autoFormat, setAutoFormat] = useState(true)
  const [validationLevel, setValidationLevel] = useState('strict')
  const [lintingEnabled, setLintingEnabled] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [internalMode, setInternalMode] = useState(mode)

  const [tutorialNote, setTutorialNote] = useState(null)
  const [isLoadingTutorialNote, setIsLoadingTutorialNote] = useState(false)
  const [isSavingTutorialNote, setIsSavingTutorialNote] = useState(false)
  const [showTutorialNoteModal, setShowTutorialNoteModal] = useState(false)

  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingTutorialNote, setIsDeletingTutorialNote] = useState(false)

  const [contentType, setContentType] = useState('assignment')
  const [isReadOnly, setIsReadOnly] = useState(false)

  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const history = useEditorHistory()
  const debouncedContent = useDebounce(jsonContent, 500)

  // ===== Permissions for current content type – using mapped resource type =====
  const resourceType = useMemo(() => getResourceTypeForContentType(contentType), [contentType])

  const canCreate = useMemo(
    () => hasPermission('create', resourceType),
    [resourceType, hasPermission]
  )
  const canUpdate = useMemo(
    () => hasPermission('update', resourceType),
    [resourceType, hasPermission]
  )
  const canDelete = useMemo(
    () => hasPermission('delete', resourceType),
    [resourceType, hasPermission]
  )
  const canView = useMemo(
    () => hasPermission('view', resourceType) || isAdmin,
    [resourceType, hasPermission, isAdmin]
  )

  useEffect(() => {
    if (internalMode === 'edit' && !canUpdate) {
      setIsReadOnly(true)
      toast('You have read‑only access to this content', { icon: '🔒' })
    } else if (internalMode === 'create' && !canCreate) {
      setIsReadOnly(true)
      toast('You do not have permission to create this type of content', { icon: '🔒' })
    } else {
      setIsReadOnly(false)
    }
  }, [internalMode, canUpdate, canCreate])

  // Configuration
  const EDITOR_THEMES = {
    light: 'bg-white text-gray-900 border-gray-300',
    dark: 'bg-gray-900 text-gray-100 border-gray-700',
    github: 'bg-gray-50 text-gray-800 border-gray-300',
    twilight: 'bg-gray-800 text-gray-200 border-gray-600',
    solarized: 'bg-[#fdf6e3] text-[#657b83] border-[#839496]',
  }

  const TECHNOLOGY_TEMPLATES = {
    default: {
      title: 'New Assignment',
      slug: 'new-assignment',
      module_topic: '',
      description: '',
      short_description: '',
      difficulty_level: 'beginner',
      assignment_type: 'coding_exercise',
      estimated_time: 60,
      points: 10,
      sequence_order: 1,
      is_mandatory: true,
      is_active: true,
      has_prerequisites: false,
      prerequisites: [],
      submission_format: 'code_file',
      allow_late_submission: false,
      late_submission_penalty: 0,
      instructions: {
        overview: '',
        tasks: [],
        deliverables: [],
        constraints: [],
        tips: [],
        common_mistakes: [],
      },
      evaluation_criteria: {
        rubric: [],
        auto_graded: false,
        passing_score: 70,
        max_attempts: 3,
        time_limit: null,
        code_quality_metrics: [],
      },
      technology_specific: {
        programming_language: '',
        framework: '',
        tools: [],
        database: null,
        environment_setup: {},
        commands: [],
        config_files: [],
      },
      resources: {
        reading_materials: [],
        video_links: [],
        documentation: [],
        tools_required: [],
        starter_code: null,
        sample_output: null,
        reference_implementation: null,
      },
      solution_metadata: {
        reference_solution: null,
        model_answers: [],
        explanation_video: null,
        common_solutions: [],
        hint_structure: [],
      },
      metadata: {
        tags: [],
        learning_objectives: [],
        complexity: {
          time_complexity: '',
          space_complexity: '',
          difficulty_score: 1,
        },
        version: '1.0',
        last_updated: null,
        created_by: null,
        review_status: 'draft',
        accessibility_features: [],
        internal_notes: '',
      },
      start_date: null,
      end_date: null,
    },
    sample: generateSampleJSON('default'),
    tutorial_note: generateSampleTutorialNote(),
  }

  const currentMode = useMemo(() => {
    if (selectedAssignment && internalMode === 'create') return 'edit'
    if (!selectedAssignment && internalMode === 'edit' && mode === 'create') return 'create'
    return internalMode
  }, [internalMode, selectedAssignment, mode])

  const isTutorialNoteMode = useMemo(() => contentType === 'tutorial_note', [contentType])

  useEffect(() => {
    setInternalMode(mode)
  }, [mode])

  useEffect(() => {
    if (jsonContent) {
      const detectedType = detectContentType(jsonContent)
      if (detectedType !== contentType) setContentType(detectedType)
    }
  }, [jsonContent])

  useEffect(() => {
    if (tutorialNote) setContentType('tutorial_note')
    else if (selectedAssignment) setContentType('assignment')
  }, [tutorialNote, selectedAssignment])

  // ===== Tabs configuration – using correct resource types from permission data =====
  const tabs = useMemo(() => {
    const availableTabs = []

    // Editor tab – resource_type: "editor"
    if (hasPermission('view', 'editor', 'A2')) {
      availableTabs.push({ id: 'editor', label: 'Editor', icon: <FaCode className="w-3 h-3" /> })
    }

    // Course tab – resource_type: "course"
    if (hasPermission('view', 'course', 'A2')) {
      availableTabs.push({
        id: 'course',
        label: 'Course',
        icon: <FaBookOpen className="w-3 h-3" />,
      })
    }

    // Assignments tab – resource_type: "assignment"
    if ((currentMode === 'edit' || selectedCourse) && hasPermission('view', 'assignment', 'A2')) {
      availableTabs.push({
        id: 'assignments',
        label: 'Assignments',
        icon: <FaFileAlt className="w-3 h-3" />,
      })
    }

    // Tutorial Notes tab – resource_type: "tutorial"
    if ((currentMode === 'edit' || selectedCourse) && hasPermission('view', 'tutorial', 'A2')) {
      availableTabs.push({
        id: 'tutorial-notes',
        label: 'Tutorial Notes',
        icon: <FaBook className="w-3 h-3" />,
      })
    }

    // Content‑related tabs – require a selected course AND their own permission
    if (selectedCourse) {
      if (hasPermission('view', 'preview', 'A2')) {
        availableTabs.push({
          id: 'preview',
          label: 'Preview',
          icon: <FaObjectGroup className="w-3 h-3" />,
        })
      }
      if (hasPermission('view', 'validation', 'A2')) {
        availableTabs.push({
          id: 'validation',
          label: 'Validation',
          icon: <FaCheckCircle className="w-3 h-3" />,
        })
      }
      if (hasPermission('view', 'linting', 'A2')) {
        availableTabs.push({
          id: 'linting',
          label: 'Linting',
          icon: <FaShieldAlt className="w-3 h-3" />,
        })
      }
      if (hasPermission('view', 'suggestions', 'A2')) {
        availableTabs.push({
          id: 'suggestions',
          label: 'Suggestions',
          icon: <FaRobot className="w-3 h-3" />,
        })
      }
    }

    // Settings tab – resource_type: "editor_settings"
    if (hasPermission('view', 'editor_settings', 'A2')) {
      availableTabs.push({
        id: 'settings',
        label: 'Settings',
        icon: <FaSlidersH className="w-3 h-3" />,
      })
    }

    return availableTabs
  }, [currentMode, selectedCourse, hasPermission])

  // Linting effect
  useEffect(() => {
    if (debouncedContent && lintingEnabled) {
      validateJson(debouncedContent)
    } else if (!lintingEnabled) {
      setLintResults({ errors: [], warnings: [], suggestions: [], score: 100 })
    }
  }, [debouncedContent, lintingEnabled])

  const shouldShowRightPanel = useMemo(() => {
    if (activeTab !== 'editor') return false
    return validation.errors.length > 0 || validation.warnings.length > 0
  }, [activeTab, validation])

  const getColumnSpans = useMemo(() => {
    let leftCols = showLeftPanel && showGuidelines ? 'lg:col-span-1' : ''
    let rightCols = showRightPanel && shouldShowRightPanel ? 'lg:col-span-3' : ''
    let mainCols = 'lg:col-span-8'

    if (showLeftPanel && showGuidelines) {
      mainCols = showRightPanel && shouldShowRightPanel ? 'lg:col-span-8' : 'lg:col-span-11'
    } else {
      mainCols = showRightPanel && shouldShowRightPanel ? 'lg:col-span-9' : 'lg:col-span-12'
    }
    return { leftCols, mainCols, rightCols }
  }, [showLeftPanel, showGuidelines, showRightPanel, shouldShowRightPanel])

  // Event Handlers
  const loadAssignment = async id => {
    if (!hasPermission('view', 'assignment', 'A2')) {
      toast.error('You do not have permission to view assignments')
      return
    }
    setIsLoading(true)
    try {
      const response = await assignmentAPI.getById(id)
      const formatted = JSON.stringify(response.data.data, null, 2)
      setJsonContent(formatted)
      history.push(formatted)
      setContentType('assignment')
      await validateJson(formatted)

      if (response.data.data.course_id) {
        setSelectedCourse({
          id: response.data.data.course_id,
          title: response.data.data.course_title || `Course #${response.data.data.course_id}`,
        })
      }

      setSelectedAssignment({
        id: response.data.data.assignment_id,
        title: response.data.data.title,
        course_id: response.data.data.course_id,
      })

      setTutorialNote(null)
      setInternalMode('edit')
      if (onModeChange) onModeChange('edit', response.data.data.assignment_id)
      toast.success('Assignment loaded successfully')
    } catch (error) {
      console.error('Error loading assignment:', error)
      toast.error('Failed to load assignment data')
      loadTemplate('default')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTutorialNote = async courseId => {
    if (!courseId) {
      toast.error('Please select a course first')
      setActiveTab('course')
      return
    }
    if (!hasPermission('view', 'tutorial', 'A2')) {
      toast.error('You do not have permission to view tutorial notes')
      return
    }
    setIsLoadingTutorialNote(true)
    try {
      const response = await tutorialNoteAPI.getByCourseId(courseId)
      const rawData = response.data.data
      setTutorialNote(rawData)
      setContentType('tutorial_note')
      const {
        note_id,
        course_id,
        view_count,
        rating,
        createdAt,
        updatedAt,
        download_count,
        created_by_user_id,
        updated_by_user_id,
        course,
        ...cleanTutorialNote
      } = rawData
      const formatted = JSON.stringify(cleanTutorialNote, null, 2)
      setJsonContent(formatted)
      history.push(formatted)
      await validateJson(formatted)
      toast.success('Tutorial notes loaded successfully')
    } catch (error) {
      console.error('Error loading tutorial notes:', error)
      const isNotFound =
        error.response?.status === 404 ||
        (error.response?.status === 500 && error.response?.data?.message?.includes('not found'))
      if (isNotFound) {
        toast('No tutorial notes found. Create new ones?', { icon: 'ℹ️', duration: 3000 })
        setTutorialNote(null)
        setJsonContent('')
      } else {
        toast.error('Failed to load tutorial notes')
      }
    } finally {
      setIsLoadingTutorialNote(false)
    }
  }

  const validateJson = useCallback(
    async content => {
      if (!content.trim()) {
        setValidation({ isValid: false, errors: ['JSON content is empty'], warnings: [], info: [] })
        return
      }
      setIsValidating(true)
      try {
        const parsed = JSON.parse(content)
        setParsedJson(parsed)

        let validationResult
        if (contentType === 'tutorial_note') {
          let dataToValidate = parsed
          if (
            selectedCourse &&
            (!dataToValidate.course_id || dataToValidate.course_id !== selectedCourse.id)
          ) {
            dataToValidate = { ...dataToValidate, course_id: selectedCourse.id }
          }
          validationResult = await validateTutorialNoteData(dataToValidate, validationLevel)
        } else {
          let dataToValidate
          if (selectedCourse) {
            const { course_id, course_title, ...rest } = parsed
            dataToValidate = { ...rest, course_id: selectedCourse.id }
          } else {
            dataToValidate = parsed
          }
          validationResult = await validateAssignmentData(dataToValidate, validationLevel)
        }
        setValidation(validationResult)
      } catch (error) {
        console.error('Validation error:', error)
        setValidation({
          isValid: false,
          errors: [`JSON Syntax Error: ${error.message}`],
          warnings: [],
          info: [],
        })
        setParsedJson(null)
      } finally {
        setIsValidating(false)
      }
    },
    [selectedCourse, validationLevel, contentType]
  )

  const handleJsonChange = useCallback(
    e => {
      if (isReadOnly) {
        toast.error('You are in read‑only mode', { icon: '🔒' })
        return
      }
      let newContent = e.target.value
      if (autoFormat && newContent.trim()) {
        try {
          const parsed = JSON.parse(newContent)
          newContent = JSON.stringify(parsed, null, 2)
        } catch (error) {
          /* ignore */
        }
      }
      setJsonContent(newContent)
      setIsDirty(true)
      if (newContent !== history.getCurrent()) history.push(newContent)
    },
    [history, autoFormat, isReadOnly]
  )

  const handleSave = async () => {
    if (currentMode === 'create' && !canCreate) {
      toast.error('You do not have permission to create this content')
      return
    }
    if (currentMode === 'edit' && !canUpdate) {
      toast.error('You do not have permission to update this content')
      return
    }
    if (!selectedCourse) {
      toast.error('Please select a course first')
      setActiveTab('course')
      return
    }
    await validateJson(jsonContent)
    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving')
      setActiveTab('validation')
      return
    }
    if (contentType === 'tutorial_note') {
      await saveTutorialNote()
    } else {
      await saveAssignment()
    }
  }

  const saveAssignment = async () => {
    if (currentMode === 'edit' && !selectedAssignment) {
      toast.error('Please select an assignment to update')
      setActiveTab('assignments')
      return
    }
    setIsSaving(true)
    try {
      const data = JSON.parse(jsonContent)
      let payload, response
      if (currentMode === 'create') {
        payload = { ...data, course_id: selectedCourse.id }
        response = await assignmentAPI.create(payload)
      } else {
        payload = { ...data }
        delete payload.course_id
        response = await assignmentAPI.update(data.assignment_id, payload)
      }
      toast.success(response.data.message)

      if (currentMode === 'create' && response.data?.data?.assignment_id) {
        const newAssignmentId = response.data.data.assignment_id
        setSelectedAssignment({
          id: newAssignmentId,
          title: response.data.data.title || data.title,
          course_id: selectedCourse.id,
        })
        setTutorialNote(null)
        setContentType('assignment')
        setInternalMode('edit')
        if (onModeChange) onModeChange('edit', newAssignmentId)
        setIsDirty(false)
        if (onSave) onSave(response.data)
        setActiveTab('preview')
      } else if (currentMode === 'edit') {
        setIsDirty(false)
        if (onSave) onSave(response.data)
      }
    } catch (error) {
      console.error('Save error:', error)
      let errorMessage = 'Failed to save assignment'
      let fieldErrors = []
      if (error.response?.status === 409) {
        errorMessage =
          error.response?.data?.message ||
          'Assignment with this slug already exists. Please use a different slug.'
        fieldErrors.push('slug: This slug is already taken. Please choose a different one.')
        toast.error('Duplicate entry. Please change the slug and try again.')
      }
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach(message => fieldErrors.push(`${field}: ${message}`))
          }
        })
      }
      if (error.response?.data?.message && error.response.status !== 409) {
        errorMessage = error.response.data.message
      }
      if (fieldErrors.length > 0) {
        setValidation(prev => ({
          ...prev,
          errors: [...prev.errors, ...fieldErrors],
          isValid: false,
        }))
        setActiveTab('validation')
      }
      toast.error(errorMessage || error.message || 'Failed to save assignment')
      if (error.response?.status === 409) {
        const currentSlug = JSON.parse(jsonContent)?.slug
        if (currentSlug) {
          const newSlug = `${currentSlug}-${Date.now().toString().slice(-4)}`
          toast(
            t => (
              <div className="flex items-center">
                <div className="mr-3">
                  Try using slug: <strong>{newSlug}</strong>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    const updated = { ...JSON.parse(jsonContent), slug: newSlug }
                    setJsonContent(JSON.stringify(updated, null, 2))
                    toast.dismiss(t.id)
                    toast.success(`Slug updated to: ${newSlug}`)
                  }}
                  className="ml-2"
                >
                  Apply
                </Button>
              </div>
            ),
            { duration: 6000 }
          )
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const saveTutorialNote = async () => {
    if (!selectedCourse?.id) {
      toast.error('Please select a course first')
      return
    }
    if (!jsonContent?.trim()) {
      toast.error('Tutorial note content is empty')
      return
    }
    setIsSavingTutorialNote(true)
    try {
      const data = JSON.parse(jsonContent)
      const dataToSave = { ...data, course_id: selectedCourse.id }
      let response
      if (tutorialNote) {
        response = await tutorialNoteAPI.update(tutorialNote.note_id, dataToSave)
      } else {
        response = await tutorialNoteAPI.create(dataToSave)
      }
      toast.success(response.data.message || 'Tutorial notes saved successfully')
      if (response.data.data) {
        setTutorialNote(response.data.data)
        setContentType('tutorial_note')
      }
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving tutorial notes:', error)
      toast.error(error.response?.data?.message || 'Failed to save tutorial notes')
    } finally {
      setIsSavingTutorialNote(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!hasPermission('delete', 'assignment')) {
      toast.error('You do not have permission to delete assignments')
      return
    }
    if (!selectedAssignment) {
      toast.error('No assignment selected to delete')
      return
    }
    if (currentMode !== 'edit') {
      toast.error('Can only delete assignments in edit mode')
      return
    }
    setIsDeleting(true)
    try {
      const response = await assignmentAPI.delete(selectedAssignment.id)
      toast.success(response.data.message || 'Assignment deleted successfully')
      handleClearAssignment()
      if (onModeChange) onModeChange('create', null)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete assignment')
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteTutorialNote = async () => {
    if (!hasPermission('delete', 'tutorial')) {
      toast.error('You do not have permission to delete tutorial notes')
      return
    }
    if (!tutorialNote) {
      toast.error('No tutorial notes to delete')
      return
    }
    setIsDeletingTutorialNote(true)
    try {
      const response = await tutorialNoteAPI.delete(tutorialNote.note_id)
      toast.success(
        response.data?.data?.message || response.message || 'Tutorial notes deleted successfully'
      )
      setTutorialNote(null)
      setContentType('assignment')
      setJsonContent('')
      setParsedJson(null)
      setValidation({ isValid: false, errors: [], warnings: [], info: [] })
      setIsDirty(false)
      history.clear()
      loadTemplate('default')
      setShowDeleteConfirm(false)
      setActiveTab('editor')
      toast.success('Tutorial notes deleted. Ready to create new content.', { duration: 3000 })
    } catch (error) {
      console.error('Error deleting tutorial notes:', error)
      let errorMessage = 'Failed to delete tutorial notes'
      if (error.response) {
        errorMessage =
          error.response.data?.data?.message ||
          error.response.data?.message ||
          error.response.statusText ||
          errorMessage
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your network connection.'
      } else {
        errorMessage = error.message || errorMessage
      }
      toast.error(errorMessage)
    } finally {
      setIsDeletingTutorialNote(false)
    }
  }

  const exportTutorialNote = () => {
    if (!tutorialNote) {
      toast.error('No tutorial notes to export')
      return
    }
    try {
      const blob = new Blob([JSON.stringify(tutorialNote, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tutorial-note-${tutorialNote.course_id || 'template'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Tutorial notes exported successfully')
    } catch (error) {
      console.error('Error exporting tutorial notes:', error)
      toast.error('Failed to export tutorial notes')
    }
  }

  const loadTemplate = templateName => {
    if (templateName === 'tutorial_note' && !canCreate) {
      toast.error('You do not have permission to create tutorial notes')
      return
    }
    if (templateName !== 'tutorial_note' && !canCreate) {
      toast.error('You do not have permission to create assignments')
      return
    }
    let template = TECHNOLOGY_TEMPLATES[templateName] || TECHNOLOGY_TEMPLATES.default
    const formatted = JSON.stringify(template, null, 2)
    setJsonContent(formatted)
    history.push(formatted)
    if (templateName === 'tutorial_note') {
      setContentType('tutorial_note')
      setTutorialNote(template)
    } else {
      setContentType('assignment')
      setTutorialNote(null)
    }
    validateJson(formatted)
    toast.success(`${templateName} template loaded`)
  }

  const formatJson = () => {
    if (isReadOnly) {
      toast.error('Cannot format in read‑only mode')
      return
    }
    try {
      const result = formatAndValidateJSON(jsonContent)
      if (result.success) {
        setJsonContent(result.data)
        history.push(result.data)
        validateJson(result.data)
        toast.success('JSON formatted successfully')
      } else {
        toast.error(`Format failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Cannot format invalid JSON')
    }
  }

  const minifyJson = () => {
    if (isReadOnly) {
      toast.error('Cannot minify in read‑only mode')
      return
    }
    try {
      const parsed = JSON.parse(jsonContent)
      const minified = JSON.stringify(parsed)
      setJsonContent(minified)
      history.push(minified)
      toast.success('JSON minified successfully')
    } catch (error) {
      toast.error('Cannot minify invalid JSON')
    }
  }

  const handleFileImport = event => {
    if (isReadOnly) {
      toast.error('Cannot import in read‑only mode')
      return
    }
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.')
      return
    }
    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const importedData = JSON.parse(e.target.result)
        const formatted = JSON.stringify(importedData, null, 2)
        setJsonContent(formatted)
        history.push(formatted)
        const detectedType = detectContentType(formatted)
        setContentType(detectedType)
        if (detectedType === 'tutorial_note') {
          setTutorialNote(importedData)
        } else {
          setTutorialNote(null)
        }
        validateJson(formatted)
        toast.success('JSON imported successfully')
      } catch (error) {
        toast.error('Invalid JSON file format')
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExport = () => {
    try {
      const data = JSON.parse(jsonContent)
      const dataToExport = selectedCourse ? { ...data, course_id: selectedCourse.id } : data
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename =
        contentType === 'tutorial_note'
          ? `tutorial-note-${dataToExport?.title?.toLowerCase().replace(/\s+/g, '-') || 'template'}.json`
          : `assignment-${dataToExport?.slug || dataToExport?.title?.toLowerCase().replace(/\s+/g, '-') || 'template'}.json`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON exported successfully')
    } catch (error) {
      toast.error('Failed to export JSON')
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(jsonContent)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'))
  }

  const handleUndo = () => {
    if (isReadOnly) {
      toast.error('Cannot undo in read‑only mode')
      return
    }
    const previousState = history.undo()
    if (previousState !== null) {
      setJsonContent(previousState)
      validateJson(previousState)
    }
  }

  const handleRedo = () => {
    if (isReadOnly) {
      toast.error('Cannot redo in read‑only mode')
      return
    }
    const nextState = history.redo()
    if (nextState !== null) {
      setJsonContent(nextState)
      validateJson(nextState)
    }
  }

  const handleLintResultsChange = results => setLintResults(results)
  const handleApplyLintFix = fixedJson => {
    if (isReadOnly) {
      toast.error('Cannot apply fixes in read‑only mode')
      return
    }
    setJsonContent(fixedJson)
    history.push(fixedJson)
    validateJson(fixedJson)
  }

  const handleCourseSelect = course => {
    setSelectedCourse(course)
    setIsDirty(true)
    toast.success(`Course "${course.title}" selected`)
    if (selectedAssignment && selectedAssignment.course_id !== course.id)
      setSelectedAssignment(null)
    if (jsonContent) validateJson(jsonContent)
  }

  const handleAssignmentSelect = assignment => {
    if (!assignment) return
    loadAssignment(assignment.assignment_id || assignment.id)
    setSelectedAssignment({
      id: assignment.assignment_id || assignment.id,
      title: assignment.title,
      course_id: assignment.course_id,
    })
    if (assignment.course_id && (!selectedCourse || selectedCourse.id !== assignment.course_id)) {
      setSelectedCourse({
        id: assignment.course_id,
        title: assignment.course?.title || `Course #${assignment.course_id}`,
      })
    }
    setTutorialNote(null)
    setContentType('assignment')
    setInternalMode('edit')
    if (onModeChange) onModeChange('edit', assignment.assignment_id || assignment.id)
    setShowAssignmentModal(false)
    toast.success(`Loaded assignment: ${assignment.title}`)
  }

  const handleLoadExistingAssignment = () => {
    if (!selectedCourse) {
      toast.error('Please select a course first')
      setActiveTab('course')
      return
    }
    setShowAssignmentModal(true)
  }

  const handleClearAssignment = () => {
    setSelectedAssignment(null)
    setTutorialNote(null)
    setContentType('assignment')
    setJsonContent('')
    setParsedJson(null)
    setValidation({ isValid: false, errors: [], warnings: [], info: [] })
    setIsDirty(false)
    if (internalMode === 'edit') {
      setInternalMode('create')
      if (onModeChange) onModeChange('create', null)
    }
    loadTemplate('default')
    toast('Editor cleared. Ready to create new assignment.', { icon: 'ℹ️' })
  }

  const handleCancel = () => {
    setJsonContent('')
    setParsedJson(null)
    setValidation({ isValid: false, errors: [], warnings: [], info: [] })
    setLintResults({ errors: [], warnings: [], suggestions: [], score: 100 })
    setIsDirty(false)
    setSelectedCourse(null)
    setSelectedAssignment(null)
    setTutorialNote(null)
    setContentType('assignment')
    setInternalMode('create')
    history.clear()
    if (onCancel) onCancel()
    toast('Editor cleared. Ready to start fresh.', { icon: 'ℹ️' })
  }

  const generateSuggestions = () => {
    if (!parsedJson) return []
    const suggestions = []
    if (contentType === 'tutorial_note') {
      if (!parsedJson.title || parsedJson.title === 'Tutorial Notes') {
        suggestions.push({
          field: 'title',
          suggestion: `Consider a more descriptive title like "${selectedCourse?.title || 'Course'} Tutorial Notes"`,
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              title: `${selectedCourse?.title || 'Course'} Tutorial Notes`,
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
      if (!parsedJson.content?.study_content?.introduction?.content) {
        suggestions.push({
          field: 'content.study_content.introduction',
          suggestion: 'Add an introduction to explain what students will learn',
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              content: {
                ...parsedJson.content,
                study_content: {
                  ...parsedJson.content?.study_content,
                  introduction: {
                    title: 'Introduction',
                    content:
                      'This tutorial will guide you through the key concepts and practical applications.',
                    objectives: [
                      'Understand the core concepts',
                      'Apply knowledge to real-world scenarios',
                    ],
                    prerequisites: [],
                  },
                },
              },
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
      if (
        !parsedJson.content?.tutorial_notes?.sections ||
        parsedJson.content.tutorial_notes.sections.length === 0
      ) {
        suggestions.push({
          field: 'content.tutorial_notes.sections',
          suggestion: 'Add learning sections to organize the content',
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              content: {
                ...parsedJson.content,
                tutorial_notes: {
                  ...parsedJson.content?.tutorial_notes,
                  sections: [
                    {
                      title: 'Introduction to Concepts',
                      type: 'theory',
                      order: 1,
                      content: {},
                      estimated_time: 15,
                    },
                  ],
                  total_sections: 1,
                },
              },
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
    } else {
      if (!parsedJson.title || parsedJson.title === 'New Assignment') {
        suggestions.push({
          field: 'title',
          suggestion: `Consider a more descriptive title like "${parsedJson.module_topic || 'Advanced'} Programming Assignment"`,
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              title: `${parsedJson.module_topic || 'Advanced'} Programming Assignment`,
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
      if (!parsedJson.description || parsedJson.description.length < 50) {
        suggestions.push({
          field: 'description',
          suggestion:
            'Add a more detailed description with learning objectives and expected outcomes',
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              description: `Complete this assignment to demonstrate your understanding of ${parsedJson.module_topic || 'the topic'}. Expected outcomes include practical implementation and problem-solving skills.`,
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
      if (!parsedJson.instructions?.tasks || parsedJson.instructions.tasks.length === 0) {
        suggestions.push({
          field: 'instructions.tasks',
          suggestion: 'Add 3-5 specific tasks to guide students through the assignment',
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              instructions: {
                ...parsedJson.instructions,
                tasks: [
                  'Implement the core functionality',
                  'Write unit tests for validation',
                  'Document your code and approach',
                  'Optimize for performance if applicable',
                ],
              },
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
      if (
        !parsedJson.evaluation_criteria?.rubric ||
        parsedJson.evaluation_criteria.rubric.length === 0
      ) {
        suggestions.push({
          field: 'evaluation_criteria.rubric',
          suggestion: 'Add a rubric with 4-5 criteria weighted appropriately',
          action: () => {
            if (isReadOnly) {
              toast.error('Cannot apply suggestion in read‑only mode')
              return
            }
            const updated = {
              ...parsedJson,
              evaluation_criteria: {
                ...parsedJson.evaluation_criteria,
                rubric: [
                  {
                    criteria: 'Functionality',
                    weight: 40,
                    description: 'Does the solution work correctly?',
                  },
                  {
                    criteria: 'Code Quality',
                    weight: 30,
                    description: 'Is the code clean, readable, and well-organized?',
                  },
                  {
                    criteria: 'Documentation',
                    weight: 20,
                    description: 'Is the code and approach well-documented?',
                  },
                  {
                    criteria: 'Creativity',
                    weight: 10,
                    description: 'Does the solution show creative problem-solving?',
                  },
                ],
              },
            }
            setJsonContent(JSON.stringify(updated, null, 2))
          },
        })
      }
    }
    return suggestions
  }

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <Modal
      isOpen={showDeleteConfirm}
      onClose={() => !isDeleting && !isDeletingTutorialNote && setShowDeleteConfirm(false)}
      size="sm"
    >
      <ModalHeader>
        Delete {contentType === 'tutorial_note' ? 'Tutorial Notes' : 'Assignment'}
      </ModalHeader>
      <ModalBody>
        <div className="text-center py-4">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Are you sure you want to delete{' '}
            {contentType === 'tutorial_note' ? 'these tutorial notes' : 'this assignment'}?
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            This action cannot be undone. All data will be permanently removed.
          </p>
          {contentType === 'tutorial_note'
            ? tutorialNote && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBook className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-800">{tutorialNote.title}</span>
                  </div>
                  <div className="text-xs text-red-700">Note ID: #{tutorialNote.note_id}</div>
                  {selectedCourse && (
                    <div className="text-xs text-red-600 mt-1">
                      Course: {selectedCourse.title} (#{selectedCourse.id})
                    </div>
                  )}
                </div>
              )
            : selectedAssignment && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaFileAlt className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-800">
                      {selectedAssignment.title}
                    </span>
                  </div>
                  <div className="text-xs text-red-700">
                    Assignment ID: #{selectedAssignment.id}
                  </div>
                  {selectedCourse && (
                    <div className="text-xs text-red-600 mt-1">
                      Course: {selectedCourse.title} (#{selectedCourse.id})
                    </div>
                  )}
                </div>
              )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={isDeleting || isDeletingTutorialNote}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={contentType === 'tutorial_note' ? deleteTutorialNote : handleDeleteAssignment}
          disabled={isDeleting || isDeletingTutorialNote}
          leftIcon={
            (contentType === 'tutorial_note' ? isDeletingTutorialNote : isDeleting) ? (
              <Spinner size="sm" />
            ) : (
              <FaRegTrashAlt className="w-3 h-3" />
            )
          }
          size="sm"
        >
          {contentType === 'tutorial_note'
            ? isDeletingTutorialNote
              ? 'Deleting...'
              : 'Delete Notes'
            : isDeleting
              ? 'Deleting...'
              : 'Delete Assignment'}
        </Button>
      </ModalFooter>
    </Modal>
  )

  // Save Cancel Buttons Component
  const SaveCancelButtons = ({
    onSave,
    onCancel,
    onDelete,
    isSaving,
    isValid,
    className = '',
    variant = 'primary',
    selectedCourse,
    selectedAssignment,
    currentMode,
    isTutorialNote = false,
    tutorialNote = null,
    onExport,
  }) => (
    <div className={`flex justify-between items-center ${className}`}>
      <div className="flex gap-2">
        {canDelete && (
          <>
            {currentMode === 'edit' && selectedAssignment && !isTutorialNote && (
              <Tooltip content="Delete this assignment" placement="top">
                <Button
                  variant="danger"
                  onClick={onDelete}
                  disabled={isSaving}
                  leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                  size="sm"
                />
              </Tooltip>
            )}
            {tutorialNote && isTutorialNote && (
              <Tooltip content="Delete these tutorial notes" placement="top">
                <Button
                  variant="danger"
                  onClick={onDelete}
                  disabled={isSaving}
                  leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                  size="sm"
                />
              </Tooltip>
            )}
          </>
        )}
        {tutorialNote && isTutorialNote && onExport && (
          <Tooltip content="Export tutorial notes" placement="top">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isSaving}
              leftIcon={<FaDownload className="w-3 h-3" />}
              size="sm"
            >
              Export
            </Button>
          </Tooltip>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          leftIcon={<FaTimes className="w-3 h-3" />}
          size="sm"
        >
          Cancel
        </Button>
        <Tooltip
          content={
            !selectedCourse
              ? 'Select a course first'
              : !isValid
                ? 'Fix validation errors to save'
                : isTutorialNote
                  ? 'Save tutorial notes'
                  : currentMode === 'edit' && !selectedAssignment
                    ? 'Select an assignment to update'
                    : currentMode === 'create' && !canCreate
                      ? 'You do not have permission to create'
                      : currentMode === 'edit' && !canUpdate
                        ? 'You do not have permission to update'
                        : ''
          }
          placement="top"
        >
          <Button
            variant={variant}
            onClick={onSave}
            disabled={
              isSaving ||
              !isValid ||
              !selectedCourse ||
              (!isTutorialNote && currentMode === 'edit' && !selectedAssignment) ||
              (currentMode === 'create' && !canCreate) ||
              (currentMode === 'edit' && !canUpdate)
            }
            leftIcon={isSaving ? <Spinner size="sm" /> : <FaSave className="w-3 h-3" />}
            size="sm"
          >
            {isTutorialNote
              ? tutorialNote
                ? 'Update Tutorial Notes'
                : 'Create Tutorial Notes'
              : currentMode === 'create'
                ? 'Create Assignment'
                : 'Update Assignment'}
          </Button>
        </Tooltip>
      </div>
    </div>
  )

  // Tab Components – they use the same SaveCancelButtons as before
  const tabComponents = useMemo(
    () => ({
      editor: () => (
        <div className="h-full flex flex-col space-y-2">
          {/* Assignment & Course Indicator */}
          {(selectedAssignment || selectedCourse || tutorialNote) && (
            <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedAssignment && (
                  <div className="h-full">
                    <div className="h-full flex items-center gap-2 p-2 bg-white rounded border border-blue-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaFileAlt className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-900 truncate">
                          {selectedAssignment.title}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-xs text-blue-700">
                            ID: #{selectedAssignment.id}
                          </span>
                          <Badge variant={currentMode === 'edit' ? 'warning' : 'primary'} size="xs">
                            {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCourse && (
                  <div className="h-full">
                    <div className="h-full flex items-center gap-2 p-2 bg-white rounded border border-indigo-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FaBookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-indigo-900 truncate">
                          {selectedCourse.title}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-xs text-indigo-700">ID: #{selectedCourse.id}</span>
                          <Badge variant="success" size="xs">
                            Selected
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {tutorialNote && (
                  <div className="h-full">
                    <div className="h-full flex items-center gap-2 p-2 bg-white rounded border border-purple-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <FaBook className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-purple-900 truncate">
                          {tutorialNote.title}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-xs text-purple-700">
                            ID: #{tutorialNote.note_id}
                          </span>
                          <Badge variant="purple" size="xs">
                            Tutorial Notes
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-2 md:mt-0">
                {selectedAssignment && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setActiveTab('assignments')}
                    leftIcon={<FaFileAlt className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                )}
                {selectedCourse && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setActiveTab('course')}
                    leftIcon={<FaBookOpen className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                )}
                {tutorialNote && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setActiveTab('tutorial-notes')}
                    leftIcon={<FaBook className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                )}
                {/* Delete button in header – only if canDelete */}
                {canDelete && (selectedAssignment || tutorialNote) && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setShowDeleteConfirm(true)}
                    leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                  >
                    {/* Delete */}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <Textarea
              ref={textareaRef}
              value={jsonContent}
              onChange={handleJsonChange}
              readOnly={isReadOnly}
              className={`w-full h-full font-mono text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none p-2 ${EDITOR_THEMES[editorTheme]}`}
              placeholder={
                isReadOnly ? 'You are in read‑only mode' : 'Paste or type your JSON here...'
              }
              spellCheck={false}
              rows={selectedAssignment || tutorialNote ? 13 : 15}
            />
          </div>
          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={isTutorialNoteMode}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      course: () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4 p-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaBookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Course Selection</h3>
                    <p className="text-xs text-blue-700">
                      Select the course for this assignment or tutorial notes. All content must be
                      linked to a course.
                    </p>
                  </div>
                </div>

                {/* Current Selection */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Current Selection</h4>
                  {selectedCourse ? (
                    <div className="p-3 bg-white border border-green-300 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FaBookOpen className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedCourse.title}
                            </div>
                            <div className="text-xs text-gray-600">ID: #{selectedCourse.id}</div>
                            {selectedCourse.duration && (
                              <div className="text-xs text-gray-500">
                                Duration: {selectedCourse.duration}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="sm">
                            Selected
                          </Badge>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setShowCourseModal(true)}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <FaBookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600 mb-1">No course selected</p>
                      <p className="text-xs text-gray-500">
                        You must select a course to create or update assignments or tutorial notes
                      </p>
                    </div>
                  )}
                </div>

                {/* Select Course Button */}
                <div className="flex justify-center mb-4">
                  <Button
                    variant={selectedCourse ? 'outline' : 'primary'}
                    onClick={() => setShowCourseModal(true)}
                    leftIcon={<FaBookOpen className="w-3 h-3" />}
                    size="md"
                    className="px-4"
                  >
                    {selectedCourse ? 'Change Course' : 'Select Course'}
                  </Button>
                </div>

                {/* Next Steps */}
                <div className="pt-3 border-t border-blue-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Next Steps:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-2 bg-white border border-blue-100 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                          1
                        </div>
                        <span className="text-xs font-medium">Select Course</span>
                      </div>
                      <p className="text-xs text-gray-600">Choose the course for your content</p>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                          2
                        </div>
                        <span className="text-xs font-medium">Choose Type</span>
                      </div>
                      <p className="text-xs text-gray-600">Select assignments or tutorial notes</p>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                          3
                        </div>
                        <span className="text-xs font-medium">Save</span>
                      </div>
                      <p className="text-xs text-gray-600">Save your content to the course</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              {selectedCourse && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Course Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">Course ID</div>
                        <div className="text-sm font-medium text-gray-900">
                          #{selectedCourse.id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Course Title</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedCourse.title}
                        </div>
                      </div>
                    </div>
                    {selectedCourse.description && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">Description</div>
                        <div className="text-sm text-gray-700 mt-1 p-2 bg-white rounded border">
                          {selectedCourse.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={isTutorialNoteMode}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      assignments: () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4 p-2">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FaLayerGroup className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-900">Assignment Management</h3>
                    <p className="text-xs text-indigo-700">
                      {currentMode === 'edit'
                        ? 'Select an assignment to edit or view its details'
                        : 'Load existing assignment as template or start fresh'}
                    </p>
                  </div>
                </div>

                {/* Mode Indicator */}
                <div className="mb-4">
                  <div
                    className={`p-3 rounded-lg ${currentMode === 'edit' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FaRegEdit
                        className={`w-4 h-4 ${currentMode === 'edit' ? 'text-yellow-600' : 'text-blue-600'}`}
                      />
                      <span className="text-xs font-semibold">
                        {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                      </span>
                    </div>
                    <p className="text-xs">
                      {currentMode === 'edit'
                        ? 'You are in edit mode. Select an existing assignment to modify its content.'
                        : 'You are in create mode. Load an existing assignment as a template or start with a blank one.'}
                    </p>
                  </div>
                </div>

                {/* Current Assignment Status */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Current Status</h4>
                  {selectedAssignment ? (
                    <div className="p-3 bg-white border border-purple-300 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FaFileAlt className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedAssignment.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              ID: #{selectedAssignment.id}
                            </div>
                            {selectedCourse && (
                              <div className="text-xs text-gray-500">
                                Course: {selectedCourse.title}
                              </div>
                            )}
                            <div className="text-xs text-purple-600 mt-1">
                              <Badge
                                variant={currentMode === 'edit' ? 'warning' : 'primary'}
                                size="xs"
                              >
                                {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="primary" size="sm">
                            Loaded
                          </Badge>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setShowAssignmentModal(true)}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <FaFileAlt className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {currentMode === 'edit' ? 'No assignment selected' : 'No template loaded'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentMode === 'edit'
                          ? 'Select an assignment from the course to edit'
                          : 'Load an existing assignment as template or start fresh'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Course Info */}
                {selectedCourse ? (
                  <div className="mb-4 p-3 bg-white border border-green-200 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <FaBookOpen className="w-4 h-4 text-green-600" />
                        <div>
                          <span className="text-xs font-medium text-gray-700">
                            Selected Course:
                          </span>
                          <div className="text-sm font-semibold text-gray-900">
                            {selectedCourse.title}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setActiveTab('course')}
                        leftIcon={<FaBookOpen className="w-3 h-3" />}
                      >
                        Change Course
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert variant="warning" className="mb-4">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Course Required</span>
                    </div>
                    <p className="text-xs mt-1">
                      You need to select a course first to view its assignments
                    </p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveTab('course')}
                      className="mt-2"
                    >
                      Select Course
                    </Button>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <Button
                    variant="primary"
                    onClick={() => setShowAssignmentModal(true)}
                    disabled={!selectedCourse}
                    leftIcon={<FaFileAlt className="w-3 h-3" />}
                    size="md"
                    className="h-full py-3"
                  >
                    {selectedAssignment
                      ? 'Browse & Select Assignment'
                      : 'Browse Course Assignments'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowTemplates(true)}
                    leftIcon={<FaFileCode className="w-3 h-3" />}
                    size="md"
                    className="h-full py-3"
                  >
                    Start Fresh Template
                  </Button>
                </div>

                {/* Quick Stats */}
                {selectedCourse && !selectedAssignment && (
                  <div className="p-3 bg-white border border-gray-200 rounded">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Load existing assignment:</span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setShowAssignmentModal(true)}
                          disabled={!selectedCourse}
                        >
                          Browse
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Use sample as template:</span>
                        <Button variant="ghost" size="xs" onClick={() => setShowTemplates(true)}>
                          Browse Templates
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Create from scratch:</span>
                        <Button variant="ghost" size="xs" onClick={() => setShowTemplates(true)}>
                          Browse Templates
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Information */}
              {selectedAssignment && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Assignment Preview</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedAssignment.title}
                        </div>
                        <div className="text-xs text-gray-600">Ready for editing</div>
                      </div>
                      <Badge variant={currentMode === 'edit' ? 'warning' : 'info'} size="sm">
                        {currentMode === 'edit' ? 'Edit Mode' : 'Template Mode'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Status</div>
                        <div className="font-medium">Loaded in Editor</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Course</div>
                        <div className="font-medium">{selectedCourse?.title || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveTab('editor')}
                        leftIcon={<FaEye className="w-3 h-3" />}
                      >
                        View in Editor
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveTab('preview')}
                        leftIcon={<FaObjectGroup className="w-3 h-3" />}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setShowAssignmentModal(true)}
                        leftIcon={<FaSync className="w-3 h-3" />}
                      >
                        Load Another
                      </Button>
                      {canDelete && (
                        <Tooltip content="Delete this assignment" placement="top">
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setShowDeleteConfirm(true)}
                            leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                          >
                            {/* Delete */}
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              currentMode === 'edit' && selectedAssignment
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            isSaving={isSaving}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
          />
        </div>
      ),

      'tutorial-notes': () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4 p-2">
              {/* Course Selection Status */}
              {!selectedCourse && (
                <Alert variant="error">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium">No course selected</span>
                      <p className="text-xs mt-1">
                        You need to select a course to manage tutorial notes
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveTab('course')}
                      leftIcon={<FaBookOpen className="w-3 h-3" />}
                    >
                      Select Course
                    </Button>
                  </div>
                </Alert>
              )}

              {selectedCourse && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaBook className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-purple-900">
                        Tutorial Notes Management
                      </h3>
                      <p className="text-xs text-purple-700">
                        Create and manage tutorial notes for {selectedCourse.title}
                      </p>
                    </div>
                  </div>

                  {/* Current Tutorial Notes Status */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Current Status</h4>
                    {tutorialNote ? (
                      <div className="p-3 bg-white border border-purple-300 rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FaBook className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {tutorialNote.title || 'Tutorial Notes'}
                              </div>
                              <div className="text-xs text-gray-600">
                                ID: #{tutorialNote.note_id}
                              </div>
                              <div className="text-xs text-purple-600">
                                <Badge variant="success" size="xs">
                                  Loaded
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="primary" size="sm">
                              Ready
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : jsonContent && contentType === 'tutorial_note' ? (
                      <div className="p-4 text-center border-2 border-dashed border-blue-300 rounded-lg">
                        <FaBook className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-blue-600 mb-1">
                          Creating New Tutorial Notes
                        </p>
                        <p className="text-xs text-blue-500">
                          {jsonContent.trim()
                            ? 'Content in editor - not saved yet'
                            : 'Start creating new tutorial notes'}
                        </p>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setActiveTab('editor')}
                          className="mt-2"
                        >
                          Go to Editor
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
                        <FaBook className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          No tutorial notes found
                        </p>
                        <p className="text-xs text-gray-500">
                          Load existing tutorial notes or create new ones for this course
                        </p>
                        <div className="flex gap-2 justify-center mt-3">
                          {/* Load Existing button – only show if user has view permission at level A2 */}
                          {hasPermission('view', 'tutorial', 'A2') && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => loadTutorialNote(selectedCourse.id)}
                              leftIcon={<FaCloudDownloadAlt className="w-3 h-3" />}
                            >
                              Load Existing
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              if (!canCreate) {
                                toast.error('You do not have permission to create tutorial notes')
                                return
                              }
                              loadTemplate('tutorial_note')
                              setActiveTab('editor')
                              toast.success('Tutorial notes template loaded')
                            }}
                            leftIcon={<FaFileCode className="w-3 h-3" />}
                          >
                            Create New
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tutorial Notes Preview */}
                  {tutorialNote && (
                    <TutorialNotesPreview
                      tutorialNote={tutorialNote}
                      onView={() => {
                        if (jsonContent) {
                          setActiveTab('preview')
                        } else {
                          loadTutorialNote(selectedCourse.id)
                        }
                      }}
                      onDownload={exportTutorialNote}
                      onEdit={() => setActiveTab('editor')}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <Button
                      variant="primary"
                      onClick={() => loadTutorialNote(selectedCourse.id)}
                      disabled={isLoadingTutorialNote}
                      leftIcon={
                        isLoadingTutorialNote ? (
                          <Spinner size="sm" />
                        ) : (
                          <FaCloudDownloadAlt className="w-3 h-3" />
                        )
                      }
                      size="md"
                      className="h-full py-3"
                    >
                      {tutorialNote ? 'Refresh Notes' : 'Load Tutorial Notes'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!canCreate) {
                          toast.error('You do not have permission to create tutorial notes')
                          return
                        }
                        loadTemplate('tutorial_note')
                        setTutorialNote(null)
                        toast.success('Tutorial notes template loaded')
                      }}
                      leftIcon={<FaFileCode className="w-3 h-3" />}
                      size="md"
                      className="h-full py-3"
                    >
                      New Template
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  {tutorialNote && (
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Stats</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Sections</div>
                          <div className="font-medium">
                            {tutorialNote.content?.tutorial_notes?.total_sections || 0}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Study Time</div>
                          <div className="font-medium">
                            {tutorialNote.content?.tutorial_notes?.estimated_study_time || 0} min
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Status</div>
                          <div className="font-medium">
                            <Badge
                              variant={tutorialNote.is_active ? 'success' : 'default'}
                              size="xs"
                            >
                              {tutorialNote.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Version</div>
                          <div className="font-medium">
                            {tutorialNote.content?.tutorial_notes?.version || '1.0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tutorial Notes Information */}
              {tutorialNote && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Tutorial Notes Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {tutorialNote.title || 'Tutorial Notes'}
                        </div>
                        <div className="text-xs text-gray-600">Ready for editing</div>
                      </div>
                      <Badge variant="info" size="sm">
                        Loaded
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Course</div>
                        <div className="font-medium">{selectedCourse?.title}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Last Updated</div>
                        <div className="font-medium">
                          {tutorialNote.content?.tutorial_notes?.last_updated
                            ? new Date(
                                tutorialNote.content.tutorial_notes.last_updated
                              ).toLocaleDateString()
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveTab('editor')}
                        leftIcon={<FaEye className="w-3 h-3" />}
                      >
                        View in Editor
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveTab('preview')}
                        leftIcon={<FaObjectGroup className="w-3 h-3" />}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={exportTutorialNote}
                        leftIcon={<FaDownload className="w-3 h-3" />}
                      >
                        Export
                      </Button>
                      {canDelete && (
                        <Tooltip content="Delete these tutorial notes" placement="top">
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setShowDeleteConfirm(true)}
                            leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                          >
                            {/* Delete */}
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={tutorialNote ? () => setShowDeleteConfirm(true) : undefined}
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={true}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      preview: () => (
        <div className="h-full flex flex-col space-y-2">
          {/* Content Type Indicator */}
          {(selectedAssignment || selectedCourse || parsedJson) && (
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contentType === 'tutorial_note' && parsedJson ? (
                  <>
                    <div>
                      <h4 className="text-xs font-medium text-purple-900 mb-2 flex items-center gap-1">
                        <FaBook className="w-3 h-3" />
                        {tutorialNote ? 'Loaded Tutorial Notes' : 'Tutorial Notes Preview'}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {parsedJson.title || 'Tutorial Notes'}
                          </div>
                          {tutorialNote ? (
                            <div className="text-xs text-gray-600">ID: #{tutorialNote.note_id}</div>
                          ) : (
                            <div className="text-xs text-gray-600">Not saved yet</div>
                          )}
                          <div className="text-xs text-purple-600">
                            <Badge variant="purple" size="xs">
                              Tutorial Notes
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={tutorialNote ? 'primary' : 'outline'} size="xs">
                          {tutorialNote ? 'Loaded' : 'Preview'}
                        </Badge>
                      </div>
                    </div>
                    {selectedCourse && (
                      <div>
                        <h4 className="text-xs font-medium text-indigo-900 mb-2 flex items-center gap-1">
                          <FaBookOpen className="w-3 h-3" />
                          Linked Course
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedCourse.title}
                            </div>
                            <div className="text-xs text-gray-600">ID: #{selectedCourse.id}</div>
                          </div>
                          <Badge variant="success" size="xs">
                            Selected
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {selectedAssignment ? (
                      <div>
                        <h4 className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                          <FaFileAlt className="w-3 h-3" />
                          Loaded Assignment
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedAssignment.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              ID: #{selectedAssignment.id}
                            </div>
                            <div className="text-xs text-blue-600">
                              <Badge
                                variant={currentMode === 'edit' ? 'warning' : 'primary'}
                                size="xs"
                              >
                                {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="primary" size="xs">
                            Loaded
                          </Badge>
                        </div>
                      </div>
                    ) : parsedJson && contentType === 'assignment' ? (
                      <div>
                        <h4 className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                          <FaFileAlt className="w-3 h-3" />
                          Assignment Preview
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {parsedJson.title || 'New Assignment'}
                            </div>
                            <div className="text-xs text-gray-600">Not saved yet</div>
                            <div className="text-xs text-blue-600">
                              <Badge
                                variant={currentMode === 'edit' ? 'warning' : 'primary'}
                                size="xs"
                              >
                                {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" size="xs">
                            Preview
                          </Badge>
                        </div>
                      </div>
                    ) : null}
                    {selectedCourse && (
                      <div>
                        <h4 className="text-xs font-medium text-indigo-900 mb-2 flex items-center gap-1">
                          <FaBookOpen className="w-3 h-3" />
                          Linked Course
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedCourse.title}
                            </div>
                            <div className="text-xs text-gray-600">ID: #{selectedCourse.id}</div>
                          </div>
                          <Badge variant="success" size="xs">
                            Selected
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg">
            {parsedJson ? (
              <div className="space-y-4 p-4">
                {contentType === 'tutorial_note' ? (
                  // Tutorial Notes Preview
                  <>
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {parsedJson.title || 'Tutorial Notes'}
                      </h3>
                      {parsedJson.content?.study_content?.introduction?.content && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                          <h4 className="text-xs font-medium text-blue-900 mb-1">Introduction</h4>
                          <p className="text-gray-700 text-sm">
                            {parsedJson.content.study_content.introduction.content}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">
                          Basic Information
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Total Sections</dt>
                            <dd className="font-medium">
                              {parsedJson.content?.tutorial_notes?.total_sections || 0}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Study Time</dt>
                            <dd>
                              {parsedJson.content?.tutorial_notes?.estimated_study_time || 0}{' '}
                              minutes
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Version</dt>
                            <dd>
                              <Badge variant="outline" size="sm">
                                {parsedJson.content?.tutorial_notes?.version || '1.0'}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Content Stats</h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Code Examples</dt>
                            <dd className="font-medium">
                              {parsedJson.content?.examples_repository?.code_examples?.length || 0}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Exercises</dt>
                            <dd>
                              {parsedJson.content?.practice_exercises?.warmup_exercises?.length ||
                                0}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Status</dt>
                            <dd>
                              <Badge
                                variant={parsedJson.is_active ? 'success' : 'default'}
                                size="sm"
                              >
                                {parsedJson.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Sections Preview */}
                    {parsedJson.content?.tutorial_notes?.sections &&
                      parsedJson.content.tutorial_notes.sections.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Sections</h4>
                          <div className="space-y-2">
                            {parsedJson.content.tutorial_notes.sections.map((section, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded border">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{section.title}</span>
                                  <Badge variant="outline" size="xs">
                                    {section.type}
                                  </Badge>
                                </div>
                                {section.content?.headings?.[0] && (
                                  <p className="text-xs text-gray-600">
                                    {section.content.headings[0]}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  Estimated time: {section.estimated_time || 10} min
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  // Assignment Preview
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Basic Information
                        </h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-gray-500">Title</dt>
                            <dd className="text-sm font-medium">
                              {parsedJson.title || 'Not specified'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Module/Topic</dt>
                            <dd>{parsedJson.module_topic || 'Not specified'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Difficulty</dt>
                            <dd>
                              <Badge
                                variant={
                                  parsedJson.difficulty_level === 'beginner'
                                    ? 'success'
                                    : parsedJson.difficulty_level === 'intermediate'
                                      ? 'warning'
                                      : 'error'
                                }
                                size="sm"
                              >
                                {parsedJson.difficulty_level || 'Not specified'}
                              </Badge>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Type</dt>
                            <dd>
                              <Badge variant="outline" size="sm">
                                {parsedJson.assignment_type || 'Not specified'}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-gray-500">Points</dt>
                            <dd className="text-sm font-medium">
                              {parsedJson.points || 'Not specified'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Estimated Time</dt>
                            <dd>
                              {parsedJson.estimated_time
                                ? `${parsedJson.estimated_time} minutes`
                                : 'Not specified'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Technology</dt>
                            <dd>
                              {parsedJson.technology_specific?.programming_language ? (
                                <Badge variant="primary" size="sm">
                                  {parsedJson.technology_specific.programming_language}
                                </Badge>
                              ) : (
                                'Not specified'
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Status</dt>
                            <dd>
                              <Badge
                                variant={parsedJson.is_active ? 'success' : 'default'}
                                size="sm"
                              >
                                {parsedJson.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {parsedJson.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 p-3 rounded border">
                          {parsedJson.description}
                        </p>
                      </div>
                    )}

                    {parsedJson.instructions?.tasks && parsedJson.instructions.tasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Tasks</h4>
                        <ul className="space-y-1 text-sm">
                          {parsedJson.instructions.tasks.map((task, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-xs text-gray-500 mt-0.5">{index + 1}.</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaExclamationTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No valid JSON to preview</p>
                <p className="text-xs mt-1">Enter valid JSON in the editor to see a preview</p>
              </div>
            )}
          </div>
          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={isTutorialNoteMode}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      validation: () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Validation Level Indicator */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Validation Results</h3>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  Level: {validationLevel}
                </Badge>
                {contentType === 'tutorial_note' && (
                  <Badge variant="purple" size="sm">
                    Tutorial Notes
                  </Badge>
                )}
              </div>
            </div>

            {/* Content Status */}
            {contentType === 'tutorial_note' && tutorialNote && (
              <Alert variant="success" className="mb-3" icon={<FaBook className="w-4 h-4" />}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium">Tutorial Notes Loaded</span>
                    <div className="text-xs text-green-700">
                      {tutorialNote.title} (ID: #{tutorialNote.note_id})
                    </div>
                    <div className="text-xs text-green-600">
                      Type:{' '}
                      <Badge variant="purple" size="xs">
                        Tutorial Notes
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActiveTab('tutorial-notes')}
                    leftIcon={<FaBook className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                </div>
              </Alert>
            )}

            {selectedAssignment && contentType === 'assignment' && (
              <Alert variant="success" className="mb-3" icon={<FaFileAlt className="w-4 h-4" />}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium">Assignment Loaded</span>
                    <div className="text-xs text-green-700">
                      {selectedAssignment.title} (ID: #{selectedAssignment.id})
                    </div>
                    <div className="text-xs text-green-600">
                      Mode:{' '}
                      <Badge variant={currentMode === 'edit' ? 'warning' : 'primary'} size="xs">
                        {currentMode === 'edit' ? 'Edit' : 'Create'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActiveTab('assignments')}
                    leftIcon={<FaFileAlt className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                </div>
              </Alert>
            )}

            {/* Course Validation Status */}
            {!selectedCourse && (
              <Alert variant="error" className="mb-3">
                <div>
                  <span className="text-xs font-medium">Course is required</span>
                  <p className="text-xs mt-1">Please select a course in the "Course" tab</p>
                </div>
              </Alert>
            )}

            {selectedCourse && (
              <Alert variant="success" className="mb-3" icon={<FaBookOpen className="w-4 h-4" />}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium">Course Selected</span>
                    <div className="text-xs text-green-700">
                      {selectedCourse.title} (#{selectedCourse.id})
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActiveTab('course')}
                    leftIcon={<FaBookOpen className="w-3 h-3" />}
                  >
                    Change
                  </Button>
                </div>
              </Alert>
            )}

            <div className="space-y-3">
              {validation.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3" />
                    Errors ({validation.errors.length})
                  </h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {validation.errors.map((error, index) => (
                      <Alert key={index} variant="error" className="p-2">
                        <span className="text-xs">{error}</span>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-yellow-700 mb-2">
                    Warnings ({validation.warnings.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {validation.warnings.map((warning, index) => (
                      <Alert key={index} variant="warning" className="p-2">
                        <span className="text-xs">{warning}</span>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {validation.info.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-700 mb-2">
                    Information ({validation.info.length})
                  </h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {validation.info.map((info, index) => (
                      <Alert key={index} variant="info" className="p-2">
                        <span className="text-xs">{info}</span>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <Alert variant="success" className="p-3">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500 w-5 h-5" />
                    <div>
                      <span className="text-sm font-medium">JSON schema is valid!</span>
                      <p className="text-xs text-green-700 mt-1">
                        Your {contentType === 'tutorial_note' ? 'tutorial notes' : 'assignment'}{' '}
                        data passes all validation checks.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </div>
          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={contentType === 'tutorial_note'}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      linting: () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0">
            {/* Linting Status */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Linting Results</h3>
              <div className="flex items-center gap-2">
                <Badge variant={lintingEnabled ? 'success' : 'default'} size="sm">
                  {lintingEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {contentType === 'tutorial_note' && (
                  <Badge variant="purple" size="sm">
                    Tutorial Notes
                  </Badge>
                )}
              </div>
            </div>

            {!lintingEnabled ? (
              <Alert variant="info" className="p-3">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-blue-500 w-5 h-5" />
                  <div>
                    <span className="text-sm font-medium">Linting is disabled</span>
                    <p className="text-xs text-blue-700 mt-1">
                      Enable linting in Settings to see suggestions and errors
                    </p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveTab('settings')}
                      className="mt-2"
                    >
                      Open Settings
                    </Button>
                  </div>
                </div>
              </Alert>
            ) : (
              <JSONLinter
                jsonContent={jsonContent}
                onValidationChange={handleLintResultsChange}
                onApplyFix={handleApplyLintFix}
                AlertComponent={({ children, variant, className, icon }) => (
                  <Alert variant={variant} className={className} icon={icon}>
                    {children}
                  </Alert>
                )}
              />
            )}
          </div>
          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={contentType === 'tutorial_note'}
            tutorialNote={tutorialNote}
          />
        </div>
      ),

      suggestions: () => {
        const suggestions = generateSuggestions()
        return (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {suggestions.length > 0 ? (
                <div className="space-y-3 p-2">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <FaBrain className="text-purple-500 w-6 h-6" />
                    <div>
                      <h4 className="text-sm font-semibold text-purple-900">
                        AI-powered Suggestions
                      </h4>
                      <p className="text-xs text-purple-700">
                        Based on best practices and common patterns
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" size="sm">
                                {suggestion.field}
                              </Badge>
                              <FaBrain className="text-purple-400 w-3 h-3" />
                            </div>
                            <p className="text-gray-700 text-xs mb-2">{suggestion.suggestion}</p>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={suggestion.action}
                            size="xs"
                            className="ml-2"
                          >
                            Apply
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaRobot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No suggestions available</p>
                  <p className="text-xs mt-1">Your JSON looks good! No suggestions at this time.</p>
                </div>
              )}
            </div>
            <SaveCancelButtons
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={
                (currentMode === 'edit' && selectedAssignment) || tutorialNote
                  ? () => setShowDeleteConfirm(true)
                  : undefined
              }
              onExport={tutorialNote ? exportTutorialNote : undefined}
              isSaving={isSaving || isSavingTutorialNote}
              isValid={validation.isValid}
              selectedCourse={selectedCourse}
              selectedAssignment={selectedAssignment}
              currentMode={currentMode}
              isTutorialNote={contentType === 'tutorial_note'}
              tutorialNote={tutorialNote}
            />
          </div>
        )
      },

      settings: () => (
        <div className="h-full flex flex-col space-y-2">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4 p-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaSlidersH className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Editor Settings</h3>
                    <p className="text-xs text-blue-700">
                      Configure your editor preferences and behavior
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Theme Selection */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Theme</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-700">Editor Theme</label>
                        <select
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={editorTheme}
                          onChange={e => setEditorTheme(e.target.value)}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="github">GitHub</option>
                          <option value="twilight">Twilight</option>
                          <option value="solarized">Solarized</option>
                        </select>
                      </div>
                      <div className="text-xs text-gray-500">
                        Current theme preview:
                        <div className={`mt-1 p-2 rounded border ${EDITOR_THEMES[editorTheme]}`}>
                          <span className="font-mono">{'{\n  "key": "value"\n}'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-format Toggle */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Auto-format JSON</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Automatically format JSON as you type
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={autoFormat}
                          onChange={e => setAutoFormat(e.target.checked)}
                          disabled={isReadOnly}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Validation Level */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Validation Level</h4>
                    <div className="space-y-2">
                      <select
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={validationLevel}
                        onChange={e => setValidationLevel(e.target.value)}
                      >
                        <option value="strict">Strict - All fields must be valid</option>
                        <option value="moderate">Moderate - Only critical fields required</option>
                        <option value="lenient">Lenient - Minimal validation</option>
                      </select>
                      <div className="text-xs text-gray-500">
                        {validationLevel === 'strict'
                          ? '✓ All fields validated ✓ Schema compliance ✓ Type checking'
                          : validationLevel === 'moderate'
                            ? '✓ Required fields only ✓ Basic schema checks'
                            : '✓ Syntax checking only'}
                      </div>
                    </div>
                  </div>

                  {/* Linting Toggle */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Enable Linting</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Show linting suggestions and errors
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={lintingEnabled}
                          onChange={e => setLintingEnabled(e.target.checked)}
                          disabled={isReadOnly}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Advanced Tools Toggle */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Advanced Tools</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Show advanced editor tools in sidebar
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={showAdvanced}
                          onChange={e => setShowAdvanced(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {showAdvanced && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Advanced tools enabled in left sidebar
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditorTheme('light')
                        setAutoFormat(true)
                        setValidationLevel('strict')
                        setLintingEnabled(true)
                        setShowAdvanced(false)
                        toast.success('Settings reset to defaults')
                      }}
                      leftIcon={<FaUndo className="w-3 h-3" />}
                      size="sm"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Settings Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-700 mb-3">Current Settings</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-500">Theme</div>
                    <div className="font-medium">
                      <Badge variant="outline" size="xs">
                        {editorTheme}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-500">Auto-format</div>
                    <div className="font-medium">
                      <Badge variant={autoFormat ? 'success' : 'default'} size="xs">
                        {autoFormat ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-500">Validation</div>
                    <div className="font-medium">
                      <Badge variant="info" size="xs">
                        {validationLevel}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-gray-500">Linting</div>
                    <div className="font-medium">
                      <Badge variant={lintingEnabled ? 'success' : 'default'} size="xs">
                        {lintingEnabled ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SaveCancelButtons
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={
              (currentMode === 'edit' && selectedAssignment) || tutorialNote
                ? () => setShowDeleteConfirm(true)
                : undefined
            }
            onExport={tutorialNote ? exportTutorialNote : undefined}
            isSaving={isSaving || isSavingTutorialNote}
            isValid={validation.isValid}
            selectedCourse={selectedCourse}
            selectedAssignment={selectedAssignment}
            currentMode={currentMode}
            isTutorialNote={contentType === 'tutorial_note'}
            tutorialNote={tutorialNote}
          />
        </div>
      ),
    }),
    [
      jsonContent,
      selectedCourse,
      selectedAssignment,
      tutorialNote,
      editorTheme,
      parsedJson,
      validation,
      isSaving,
      isSavingTutorialNote,
      isLoadingTutorialNote,
      activeTab,
      currentMode,
      validationLevel,
      lintingEnabled,
      autoFormat,
      showAdvanced,
      contentType,
      canDelete,
    ]
  )

  // Render Helpers
  const renderTabContent = () => {
    const TabComponent = tabComponents[activeTab]
    return TabComponent ? <TabComponent /> : null
  }

  const renderRightPanel = () => {
    if (activeTab !== 'editor') return null
    if (!shouldShowRightPanel) return null

    return (
      <div className={`${getColumnSpans.rightCols} flex flex-col space-y-3`}>
        <Card className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4 text-red-500" />
              Validation Panel
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant={validation.isValid ? 'success' : 'error'} size="sm">
                {validation.isValid ? 'Valid' : 'Invalid'}
              </Badge>
              {contentType === 'tutorial_note' && (
                <Badge variant="purple" size="sm">
                  Notes
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Course Status */}
            {!selectedCourse && (
              <Alert variant="error" className="p-2">
                <div>
                  <span className="text-xs font-medium">No course selected</span>
                  <p className="text-xs mt-1">Select a course to enable validation</p>
                </div>
              </Alert>
            )}

            {selectedCourse && (
              <Alert variant="success" className="p-2">
                <div className="flex items-center gap-2">
                  <FaBookOpen className="w-3 h-3 text-green-500" />
                  <div>
                    <span className="text-xs font-medium">Course Selected</span>
                    <div className="text-xs text-green-700">#{selectedCourse.id}</div>
                  </div>
                </div>
              </Alert>
            )}

            {/* Content Status */}
            {contentType === 'tutorial_note' && tutorialNote ? (
              <Alert variant="success" className="p-2">
                <div className="flex items-center gap-2">
                  <FaBook className="w-3 h-3 text-purple-500" />
                  <div>
                    <span className="text-xs font-medium">Tutorial Notes Loaded</span>
                    <div className="text-xs text-purple-700">#{tutorialNote.note_id}</div>
                    <div className="text-xs text-purple-600">
                      Type:{' '}
                      <Badge variant="purple" size="xs">
                        Tutorial Notes
                      </Badge>
                    </div>
                  </div>
                </div>
              </Alert>
            ) : contentType === 'assignment' && selectedAssignment ? (
              <Alert variant="info" className="p-2">
                <div className="flex items-center gap-2">
                  <FaFileAlt className="w-3 h-3 text-blue-500" />
                  <div>
                    <span className="text-xs font-medium">Assignment Loaded</span>
                    <div className="text-xs text-blue-700">#{selectedAssignment.id}</div>
                    <div className="text-xs text-blue-600">
                      Mode:{' '}
                      <Badge variant={currentMode === 'edit' ? 'warning' : 'primary'} size="xs">
                        {currentMode === 'edit' ? 'Edit' : 'Create'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Alert>
            ) : null}

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-700 mb-2">
                  Errors ({validation.errors.length})
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validation.errors.map((error, index) => (
                    <Alert key={index} variant="error" className="p-1.5">
                      <span className="text-xs">{error}</span>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-yellow-700 mb-2">
                  Warnings ({validation.warnings.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {validation.warnings.map((warning, index) => (
                    <Alert key={index} variant="warning" className="p-1.5">
                      <span className="text-xs">{warning}</span>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div className="space-y-1">
                {validation.errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="w-full justify-start"
                    leftIcon={<FaMagic className="w-3 h-3" />}
                    onClick={formatJson}
                    disabled={isReadOnly}
                  >
                    Format & Validate JSON
                  </Button>
                )}
                {contentType === 'assignment' &&
                  validation.errors.some(e => e.includes('Slug')) && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full justify-start"
                      leftIcon={<FaCode className="w-3 h-3" />}
                      onClick={() => {
                        if (parsedJson) {
                          const slug = parsedJson.title
                            ?.toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                          const updated = { ...parsedJson, slug }
                          setJsonContent(JSON.stringify(updated, null, 2))
                          toast.success(`Slug updated to: ${slug}`)
                        }
                      }}
                      disabled={isReadOnly}
                    >
                      Generate Slug from Title
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        {parsedJson && (
          <Card className="p-3">
            <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FaDatabase className="w-3 h-3 text-blue-500" />
              Statistics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600">Size:</div>
              <div className="font-medium text-right">
                {(new Blob([jsonContent]).size / 1024).toFixed(2)} KB
              </div>

              <div className="text-gray-600">Lines:</div>
              <div className="font-medium text-right">{jsonContent.split('\n').length}</div>

              <div className="text-gray-600">Properties:</div>
              <div className="font-medium text-right">{Object.keys(parsedJson).length}</div>

              {contentType === 'tutorial_note' ? (
                <>
                  <div className="text-gray-600">Sections:</div>
                  <div className="font-medium text-right">
                    {parsedJson.content?.tutorial_notes?.total_sections || 0}
                  </div>

                  <div className="text-gray-600">Study Time:</div>
                  <div className="font-medium text-right">
                    {parsedJson.content?.tutorial_notes?.estimated_study_time || 0} min
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-600">Tasks:</div>
                  <div className="font-medium text-right">
                    {parsedJson.instructions?.tasks?.length || 0}
                  </div>

                  <div className="text-gray-600">Points:</div>
                  <div className="font-medium text-right">{parsedJson.points || 'Not set'}</div>
                </>
              )}

              <div className="text-gray-600">Course:</div>
              <div className="font-medium text-right">
                {selectedCourse ? selectedCourse.title : 'None'}
              </div>

              <div className="text-gray-600">Theme:</div>
              <div className="font-medium text-right">
                <Badge variant="outline" size="xs">
                  {editorTheme}
                </Badge>
              </div>

              <div className="text-gray-600">Mode:</div>
              <div className="font-medium text-right">
                {contentType === 'tutorial_note' ? (
                  <Badge variant="purple" size="xs">
                    Tutorial Notes
                  </Badge>
                ) : (
                  <Badge variant={currentMode === 'edit' ? 'warning' : 'primary'} size="xs">
                    {currentMode === 'edit' ? 'Edit' : 'Create'}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // Course Modal Component
  const CourseSelectionModalWrapper = () => (
    <CourseSelectionModal
      show={showCourseModal}
      onClose={() => setShowCourseModal(false)}
      onSelect={handleCourseSelect}
      selectedCourseId={selectedCourse?.id}
    />
  )

  // Assignment Modal Component
  const AssignmentSelectionModalWrapper = () => (
    <AssignmentSelectionModal
      show={showAssignmentModal}
      onClose={() => setShowAssignmentModal(false)}
      onSelect={handleAssignmentSelect}
      courseId={selectedCourse?.id}
      selectedAssignmentId={selectedAssignment?.id}
      showFilters={true}
    />
  )

  if (isLoading && currentMode === 'edit' && !jsonContent) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Spinner size="md" />
        <span className="ml-2 text-gray-600 text-sm mt-3">Loading assignment data...</span>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '12px',
            maxWidth: '400px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white p-2' : 'h-full'}>
        <Card className="h-full flex flex-col p-3">
          {/* Header */}
          <div className="flex-none mb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">JSON Editor</h3>
                  {selectedCourse && (
                    <Badge variant="primary" size="sm" className="flex items-center gap-1">
                      <FaBookOpen className="w-2.5 h-2.5" />
                      {selectedCourse.title}
                    </Badge>
                  )}
                  {selectedAssignment && (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1">
                      <FaFileAlt className="w-2.5 h-2.5" />
                      {currentMode === 'edit' ? 'Editing' : 'Creating'}: #{selectedAssignment.id}
                    </Badge>
                  )}
                  {tutorialNote && (
                    <Badge variant="purple" size="sm" className="flex items-center gap-1">
                      <FaBook className="w-2.5 h-2.5" />
                      Tutorial Notes: #{tutorialNote.note_id}
                    </Badge>
                  )}
                  <Badge variant={currentMode === 'edit' ? 'warning' : 'success'} size="sm">
                    {currentMode === 'edit' ? 'Edit Mode' : 'Create Mode'}
                  </Badge>
                  <Badge variant={contentType === 'tutorial_note' ? 'purple' : 'primary'} size="sm">
                    {contentType === 'tutorial_note' ? 'Tutorial Notes' : 'Assignment'}
                  </Badge>
                  {isReadOnly && (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1">
                      <FaEye className="w-2.5 h-2.5" />
                      Read‑Only
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-xs flex items-center gap-1">
                  <FaCode className="text-blue-600 w-3 h-3" />
                  {contentType === 'tutorial_note'
                    ? 'Edit tutorial notes'
                    : currentMode === 'edit'
                      ? 'Edit existing assignment'
                      : 'Create new assignment'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {/* Theme Toggle Button */}
                <Tooltip
                  content={`Switch to ${editorTheme === 'light' ? 'dark' : 'light'} theme`}
                  placement="bottom"
                >
                  <Button
                    variant="outline"
                    onClick={() => setEditorTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                    leftIcon={
                      editorTheme === 'light' ? (
                        <FaMoon className="w-3 h-3" />
                      ) : (
                        <FaSun className="w-3 h-3" />
                      )
                    }
                    size="xs"
                  />
                </Tooltip>

                {/* Delete Button – only if canDelete */}
                {canDelete && (selectedAssignment || tutorialNote) && (
                  <Tooltip
                    content={
                      contentType === 'tutorial_note'
                        ? 'Delete tutorial notes'
                        : 'Delete assignment'
                    }
                    placement="bottom"
                  >
                    <Button
                      variant="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                      leftIcon={<FaRegTrashAlt className="w-3 h-3" />}
                      size="xs"
                    />
                  </Tooltip>
                )}

                {/* Tutorial Notes Button */}
                {selectedCourse && (
                  <Tooltip content="Manage tutorial notes" placement="bottom">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveTab('tutorial-notes')
                        if (!tutorialNote) {
                          loadTutorialNote(selectedCourse.id)
                        }
                      }}
                      leftIcon={<FaBook className="w-3 h-3" />}
                      size="xs"
                    />
                  </Tooltip>
                )}

                {/* Import button */}
                <Tooltip content="Import from JSON file" placement="bottom">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportModal(true)}
                    leftIcon={<FaFileImport className="w-3 h-3" />}
                    size="xs"
                  />
                </Tooltip>

                {currentMode === 'edit' && selectedCourse && contentType === 'assignment' && (
                  <Tooltip content="Load another assignment" placement="bottom">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignmentModal(true)}
                      leftIcon={<FaSync className="w-3 h-3" />}
                      size="xs"
                    />
                  </Tooltip>
                )}

                <Tooltip content="View schema documentation" placement="bottom">
                  <Button
                    variant="outline"
                    onClick={() => setShowSchemaDoc(true)}
                    leftIcon={<FaBook className="w-3 h-3" />}
                    size="xs"
                  />
                </Tooltip>

                <Tooltip content="Load from templates" placement="bottom">
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplates(true)}
                    leftIcon={<FaFileCode className="w-3 h-3" />}
                    size="xs"
                  />
                </Tooltip>

                <Tooltip
                  content={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  placement="bottom"
                >
                  <Button
                    variant="outline"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    leftIcon={
                      isFullscreen ? (
                        <FaCompress className="w-3 h-3" />
                      ) : (
                        <FaExpand className="w-3 h-3" />
                      )
                    }
                    size="xs"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left Sidebar */}
            {showGuidelines && showLeftPanel && (
              <div className={`${getColumnSpans.leftCols} flex flex-col`}>
                <Card className="p-1.5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-900">Tools</h3>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowLeftPanel(false)}
                      className="p-0.5"
                    >
                      <FaChevronLeft className="w-2 h-2" />
                    </Button>
                  </div>
                  <div className="space-y-0.5">
                    <Tooltip content="Format JSON" placement="right">
                      <Button
                        variant="ghost"
                        onClick={formatJson}
                        className="w-full justify-center p-1 min-h-[32px]"
                        size="xs"
                        disabled={isReadOnly}
                      >
                        <FaMagic className="w-3 h-3" />
                      </Button>
                    </Tooltip>

                    <Tooltip content="Minify JSON" placement="right">
                      <Button
                        variant="ghost"
                        onClick={minifyJson}
                        className="w-full justify-center p-1 min-h-[32px]"
                        size="xs"
                        disabled={isReadOnly}
                      >
                        <FaCode className="w-3 h-3" />
                      </Button>
                    </Tooltip>

                    <Tooltip content="Copy to clipboard" placement="right">
                      <Button
                        variant="ghost"
                        onClick={handleCopyToClipboard}
                        className="w-full justify-center p-1 min-h-[32px]"
                        size="xs"
                      >
                        <FaCopy className="w-3 h-3" />
                      </Button>
                    </Tooltip>

                    <label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                      <Tooltip content="Import from file" placement="right">
                        <Button
                          variant="ghost"
                          as="span"
                          className="w-full justify-center p-1 min-h-[32px]"
                          size="xs"
                          disabled={isReadOnly}
                        >
                          <FaUpload className="w-3 h-3" />
                        </Button>
                      </Tooltip>
                    </label>

                    <Tooltip content="Export to file" placement="right">
                      <Button
                        variant="ghost"
                        onClick={
                          contentType === 'tutorial_note' ? exportTutorialNote : handleExport
                        }
                        className="w-full justify-center p-1 min-h-[32px]"
                        size="xs"
                      >
                        <FaDownload className="w-3 h-3" />
                      </Button>
                    </Tooltip>

                    <div className="pt-1 border-t border-gray-200">
                      <Tooltip content="History: Undo" placement="right">
                        <Button
                          variant="ghost"
                          onClick={handleUndo}
                          disabled={!history.canUndo() || isReadOnly}
                          className="w-full justify-center p-1 min-h-[28px]"
                          size="xs"
                        >
                          <FaUndo className="w-2.5 h-2.5" />
                        </Button>
                      </Tooltip>

                      <Tooltip content="History: Redo" placement="right">
                        <Button
                          variant="ghost"
                          onClick={handleRedo}
                          disabled={!history.canRedo() || isReadOnly}
                          className="w-full justify-center p-1 min-h-[28px]"
                          size="xs"
                        >
                          <FaRedo className="w-2.5 h-2.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </Card>

                {/* Advanced Tools Panel */}
                {showAdvanced && (
                  <Card className="p-1.5 mt-1.5">
                    <h4 className="text-xs font-medium text-gray-900 mb-1.5">Advanced Tools</h4>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          toast('Code folding enabled', { icon: '🔧' })
                        }}
                        className="w-full justify-start text-xs"
                        size="xs"
                        leftIcon={<FaChevronRight className="w-2.5 h-2.5" />}
                      >
                        Fold All
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          toast('All sections expanded', { icon: '🔧' })
                        }}
                        className="w-full justify-start text-xs"
                        size="xs"
                        leftIcon={<FaChevronDown className="w-2.5 h-2.5" />}
                      >
                        Expand All
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const stats = {
                            lines: jsonContent.split('\n').length,
                            chars: jsonContent.length,
                            words: jsonContent.split(/\s+/).length,
                          }
                          toast(
                            `Lines: ${stats.lines}, Chars: ${stats.chars}, Words: ${stats.words}`,
                            { icon: '📊' }
                          )
                        }}
                        className="w-full justify-start text-xs"
                        size="xs"
                        leftIcon={<FaChartBar className="w-2.5 h-2.5" />}
                      >
                        Show Stats
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Mode Info */}
                {(selectedCourse || selectedAssignment || tutorialNote) && (
                  <Card className="p-1.5 mt-1.5">
                    <div className="space-y-1">
                      {selectedCourse && (
                        <div className="flex items-center gap-1">
                          <FaBookOpen className="w-2.5 h-2.5 text-blue-600" />
                          <span className="text-xs truncate text-gray-600">
                            #{selectedCourse.id}
                          </span>
                        </div>
                      )}
                      {selectedAssignment && (
                        <div className="flex items-center gap-1">
                          <FaFileAlt className="w-2.5 h-2.5 text-blue-600" />
                          <span className="text-xs truncate text-gray-600">
                            #{selectedAssignment.id}
                          </span>
                        </div>
                      )}
                      {tutorialNote && (
                        <div className="flex items-center gap-1">
                          <FaBook className="w-2.5 h-2.5 text-purple-600" />
                          <span className="text-xs truncate text-gray-600">
                            #{tutorialNote.note_id}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-blue-600">
                        {contentType === 'tutorial_note' ? (
                          <Badge variant="purple" size="xs">
                            Tutorial Notes
                          </Badge>
                        ) : (
                          <Badge variant={currentMode === 'edit' ? 'warning' : 'primary'} size="xs">
                            {currentMode === 'edit' ? 'Edit' : 'Create'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {!showLeftPanel && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowLeftPanel(true)}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-0.5"
                  >
                    <FaChevronRight className="w-2 h-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Main Editor Area */}
            <div className={`${getColumnSpans.mainCols} flex flex-col min-h-0`}>
              {/* Tab Navigation */}
              <div className="flex-none mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex -mb-px space-x-4 overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-track-rounded scrollbar-thumb-rounded pb-1">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          className={`
                            py-2 px-1 border-b-2 font-medium text-xs whitespace-nowrap flex items-center gap-1
                            flex-shrink-0 min-w-max
                            ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                          `}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {!showLeftPanel && showGuidelines && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowLeftPanel(true)}
                        className="p-0.5"
                      >
                        <FaChevronRight className="w-2.5 h-2.5" />
                      </Button>
                    )}
                    {showRightPanel && shouldShowRightPanel && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowRightPanel(false)}
                        className="p-0.5"
                      >
                        <FaChevronLeft className="w-2.5 h-2.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0">{renderTabContent()}</div>
            </div>

            {/* Right Sidebar - Validation Errors */}
            {renderRightPanel()}
          </div>

          {/* Bottom Status Bar */}
          <div className="flex-none flex flex-col sm:flex-row justify-between items-center gap-2 mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              {isReadOnly && (
                <span className="text-yellow-600 flex items-center gap-1">
                  <FaEye className="w-3 h-3" />
                  Read‑only mode
                </span>
              )}
              {isDirty && !isReadOnly && (
                <span className="text-yellow-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                  Unsaved changes
                </span>
              )}
              {!isDirty && !isReadOnly && (currentMode === 'edit' || tutorialNote) && (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  All changes saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-xs flex items-center gap-1">
                <FaPalette className="w-3 h-3" /> {editorTheme}
              </span>
              {selectedCourse && validation.isValid ? (
                <span className="text-green-600 text-xs flex items-center gap-1">
                  <FaCheckCircle className="w-3 h-3" /> Valid
                </span>
              ) : !selectedCourse ? (
                <span className="text-red-600 text-xs flex items-center gap-1">
                  <FaBookOpen className="w-3 h-3" /> No course
                </span>
              ) : (
                <span className="text-red-600 text-xs flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" /> {validation.errors.length} errors
                </span>
              )}
              {contentType === 'tutorial_note' && tutorialNote ? (
                <span className="text-purple-600 text-xs flex items-center gap-1">
                  <FaBook className="w-3 h-3" /> #{tutorialNote.note_id} (Tutorial Notes)
                </span>
              ) : contentType === 'assignment' && selectedAssignment ? (
                <span className="text-blue-600 text-xs flex items-center gap-1">
                  <FaFileAlt className="w-3 h-3" /> #{selectedAssignment.id} (
                  {currentMode === 'edit' ? 'Edit' : 'Create'})
                </span>
              ) : null}
              {isValidating && (
                <span className="text-gray-600 text-xs flex items-center gap-1">
                  <Spinner size="xs" />
                  <span>Validating...</span>
                </span>
              )}
              <span className="text-gray-600 text-xs flex items-center gap-1">
                <FaShieldAlt className="w-3 h-3" /> {lintingEnabled ? 'Lint On' : 'Lint Off'}
              </span>
              {autoFormat && (
                <span className="text-green-600 text-xs flex items-center gap-1">
                  <FaCheck className="w-3 h-3" /> Auto-format
                </span>
              )}
              <span className="text-gray-600 text-xs flex items-center gap-1">
                <FaCode className="w-3 h-3" />{' '}
                {contentType === 'tutorial_note' ? 'Notes' : 'Assignment'}
              </span>
              {isReadOnly && (
                <span className="text-yellow-600 text-xs flex items-center gap-1">
                  <FaEye className="w-3 h-3" />
                  Read‑only
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal />

      <Modal isOpen={showTemplates} onClose={() => setShowTemplates(false)} size="lg">
        <ModalHeader>Templates</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card
              className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-blue-200 hover:border-blue-400"
              onClick={() => {
                if (!canCreate) {
                  toast.error('You do not have permission to create assignments')
                  return
                }
                loadTemplate('default')
                setTutorialNote(null)
                setSelectedAssignment(null)
                setShowTemplates(false)
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Blank Assignment</h4>
                  <p className="text-xs text-gray-600">Start with empty assignment structure</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Includes all required fields with empty values for manual configuration
              </p>
            </Card>

            <Card
              className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-purple-300 hover:border-purple-400"
              onClick={() => {
                if (!canCreate) {
                  toast.error('You do not have permission to create assignments')
                  return
                }
                loadTemplate('sample')
                setTutorialNote(null)
                setSelectedAssignment(null)
                setShowTemplates(false)
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaBrain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Sample Assignment</h4>
                  <p className="text-xs text-gray-600">Complete example with data</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Fully populated assignment example with best practices
              </p>
            </Card>

            <Card
              className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-purple-200 hover:border-purple-400"
              onClick={() => {
                if (!canCreate) {
                  toast.error('You do not have permission to create tutorial notes')
                  return
                }
                loadTemplate('tutorial_note')
                setSelectedAssignment(null)
                setShowTemplates(false)
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaBook className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Tutorial Notes Template</h4>
                  <p className="text-xs text-gray-600">Complete tutorial notes structure</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Comprehensive tutorial notes template with all sections and examples
              </p>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowTemplates(false)} size="sm">
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showSchemaDoc} onClose={() => setShowSchemaDoc(false)} size="lg">
        <ModalHeader>JSON Schema Documentation</ModalHeader>
        <ModalBody className="max-h-[60vh] overflow-y-auto">
          <JSONSchemaDoc />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowSchemaDoc(false)} size="sm">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSchemaDoc(false)
              setActiveTab('editor')
            }}
            size="sm"
          >
            Back to Editor
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} size="md">
        <ModalHeader>Import Content</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <Alert variant="info">
              <span className="text-xs">
                Select content type and import existing structure and data
              </span>
            </Alert>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={contentType === 'assignment' ? 'primary' : 'outline'}
                  onClick={() => {
                    setTutorialNote(null)
                    setSelectedAssignment(null)
                    setContentType('assignment')
                  }}
                  size="sm"
                >
                  Assignment
                </Button>
                <Button
                  variant={contentType === 'tutorial_note' ? 'primary' : 'outline'}
                  onClick={() => {
                    setSelectedAssignment(null)
                    setContentType('tutorial_note')
                  }}
                  size="sm"
                >
                  Tutorial Notes
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Search Content</label>
              <div className="relative">
                <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder={`Search by ${contentType === 'tutorial_note' ? 'tutorial notes title' : 'assignment title, technology, or course'}...`}
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded h-32 overflow-y-auto p-2">
              <div className="text-center text-gray-500 text-xs">
                <FaCloudDownloadAlt className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                <p>
                  {contentType === 'tutorial_note' ? 'Tutorial notes' : 'Assignment'} listing would
                  appear here
                </p>
                <p className="text-xs mt-0.5">Connect to API to load existing content</p>
              </div>
            </div>

            <div className="p-2 bg-gray-50 rounded">
              <h4 className="text-xs font-medium text-gray-900 mb-1">Alternative Import Methods</h4>
              <div className="space-y-1">
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    as="span"
                    className="w-full justify-start"
                    leftIcon={<FaUpload className="w-3 h-3" />}
                    size="xs"
                  >
                    Import from JSON File
                  </Button>
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.readText().then(text => {
                      try {
                        JSON.parse(text)
                        setJsonContent(text)

                        // Detect content type from clipboard
                        const detectedType = detectContentType(text)
                        setContentType(detectedType)

                        if (detectedType === 'tutorial_note') {
                          setTutorialNote(JSON.parse(text))
                        } else {
                          setTutorialNote(null)
                        }

                        validateJson(text)
                        setShowImportModal(false)
                        toast.success('Pasted from clipboard')
                      } catch {
                        toast.error('Invalid JSON in clipboard')
                      }
                    })
                  }}
                  leftIcon={<FaCopy className="w-3 h-3" />}
                  size="xs"
                >
                  Paste from Clipboard
                </Button>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowImportModal(false)} size="sm">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!canCreate) {
                toast.error('You do not have permission to create this content')
                return
              }
              loadTemplate(contentType === 'tutorial_note' ? 'tutorial_note' : 'sample')
              setShowImportModal(false)
            }}
            size="sm"
          >
            Import {contentType === 'tutorial_note' ? 'Tutorial Notes' : 'Assignment'} Sample
          </Button>
        </ModalFooter>
      </Modal>

      {/* Course Selection Modal */}
      <CourseSelectionModalWrapper />

      {/* Assignment Selection Modal */}
      <AssignmentSelectionModalWrapper />
    </>
  )
}

export default JSONEditor
