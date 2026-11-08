import * as yup from 'yup'

// Yup schema matching Joi validation
const assignmentSchema = yup.object({
  // Basic fields
  title: yup.string().min(5).max(255).required('Title is required'),
  slug: yup.string().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  // course_id: yup.number().positive().required('Course ID is required'),
  module_topic: yup.string().required('Module topic is required'),
  description: yup.string().min(10).required('Description is required'),
  short_description: yup.string().max(500),

  // Configuration
  difficulty_level: yup.string().oneOf(['beginner', 'intermediate', 'advanced', 'expert']),
  assignment_type: yup
    .string()
    .oneOf([
      'coding_exercise',
      'multiple_choice',
      'project_based',
      'theoretical',
      'practical_lab',
      'case_study',
      'quiz',
      'peer_review',
    ]),
  estimated_time: yup.number().min(5),
  points: yup.number().min(1).max(1000),
  sequence_order: yup.number().min(1),
  is_mandatory: yup.boolean(),
  is_active: yup.boolean(),

  // Dates
  start_date: yup.date().nullable(),
  end_date: yup.date().min(yup.ref('start_date'), 'End date must be after start date').nullable(),
  allow_late_submission: yup.boolean(),
  late_submission_penalty: yup.number().min(0).max(100),

  // Prerequisites
  prerequisites: yup.array().of(yup.string()),
  has_prerequisites: yup.boolean(),

  // Instructions schema
  instructions: yup
    .object({
      overview: yup.string(),
      tasks: yup.array().of(yup.string()),
      deliverables: yup.array().of(yup.string()),
      constraints: yup.array().of(yup.string()),
      tips: yup.array().of(yup.string()),
      common_mistakes: yup.array().of(yup.string()),
    })
    .default({}),

  // Evaluation criteria schema
  evaluation_criteria: yup
    .object({
      rubric: yup.array().of(
        yup.object({
          criteria: yup.string(),
          weight: yup.number().min(0).max(100),
          description: yup.string(),
          levels: yup.array().of(
            yup.object({
              level: yup.string(),
              score: yup.number(),
              description: yup.string(),
            })
          ),
        })
      ),
      auto_graded: yup.boolean(),
      passing_score: yup.number().min(0).max(100),
      max_attempts: yup.number().min(1),
      time_limit: yup.number().min(1).nullable(),
      code_quality_metrics: yup.array().of(yup.string()),
    })
    .default({}),

  // Technology specific schema
  technology_specific: yup
    .object({
      programming_language: yup.string(),
      framework: yup.string(),
      tools: yup.array().of(yup.string()),
      database: yup.string().nullable(),
      environment_setup: yup.object(),
      commands: yup.array().of(yup.string()),
      config_files: yup.array().of(yup.string()),
    })
    .default({}),

  // Resources schema
  resources: yup
    .object({
      reading_materials: yup.array().of(yup.string()),
      video_links: yup.array().of(yup.string()),
      documentation: yup.array().of(yup.string()),
      tools_required: yup.array().of(yup.string()),
      starter_code: yup.string().nullable(),
      sample_output: yup.string().nullable(),
      reference_implementation: yup.string().nullable(),
    })
    .default({}),

  // Solution metadata
  solution_metadata: yup
    .object({
      reference_solution: yup.string().nullable(),
      model_answers: yup.array().of(yup.string()),
      explanation_video: yup.string().nullable(),
      common_solutions: yup.array().of(yup.string()),
      hint_structure: yup.array().of(yup.string()),
    })
    .default({}),

  // Metadata schema
  metadata: yup
    .object({
      tags: yup.array().of(yup.string()),
      learning_objectives: yup.array().of(yup.string()),
      complexity: yup.object({
        time_complexity: yup.string(),
        space_complexity: yup.string(),
        difficulty_score: yup.number().min(1).max(10),
      }),
      version: yup.string(),
      last_updated: yup.date().nullable(),
      created_by: yup.string().nullable(),
      review_status: yup.string().oneOf(['draft', 'review', 'approved', 'rejected']),
      accessibility_features: yup.array().of(yup.string()),
      internal_notes: yup.string(),
    })
    .default({}),
})

// Custom validation rules
const customValidations = {
  checkRubricWeights: data => {
    const errors = []
    if (data.evaluation_criteria?.rubric) {
      const totalWeight = data.evaluation_criteria.rubric.reduce(
        (sum, item) => sum + (item.weight || 0),
        0
      )
      if (totalWeight !== 100) {
        errors.push(`Total rubric weight is ${totalWeight}% (should total 100%)`)
      }
    }
    return errors
  },

  checkTaskCount: data => {
    const warnings = []
    const tasks = data.instructions?.tasks || []
    if (tasks.length === 0) {
      warnings.push('No tasks defined. Consider adding specific tasks for students.')
    } else if (tasks.length > 10) {
      warnings.push('Large number of tasks. Consider breaking into sub-assignments.')
    }
    return warnings
  },

  checkTechnologyCompleteness: data => {
    const info = []
    const tech = data.technology_specific
    if (tech) {
      if (!tech.programming_language) {
        info.push('Programming language not specified in technology_specific')
      }
      if (!tech.tools || tech.tools.length === 0) {
        info.push('No development tools specified')
      }
    }
    return info
  },

  checkResourceCompleteness: data => {
    const info = []
    const resources = data.resources
    if (resources) {
      const hasResources =
        resources.reading_materials?.length > 0 ||
        resources.video_links?.length > 0 ||
        resources.documentation?.length > 0
      if (!hasResources) {
        info.push('Consider adding learning resources (reading materials, videos, documentation)')
      }
    }
    return info
  },
}

// Main validation function
export const validateAssignmentData = async (data, level = 'strict') => {
  const errors = []
  const warnings = []
  const info = []

  try {
    // Basic Yup validation
    await assignmentSchema.validate(data, { abortEarly: false })
  } catch (yupError) {
    yupError.inner.forEach(error => {
      // Clean up error messages by removing quotes
      const cleanMessage = error.message.replace(/['"]/g, '')
      errors.push(`${error.path}: ${cleanMessage}`)
    })
  }

  // Custom validations based on level
  if (level === 'strict' || level === 'lenient') {
    errors.push(...customValidations.checkRubricWeights(data))
  }

  if (level === 'strict') {
    warnings.push(...customValidations.checkTaskCount(data))
  }

  if (level === 'strict') {
    info.push(...customValidations.checkTechnologyCompleteness(data))
    info.push(...customValidations.checkResourceCompleteness(data))
  }

  // Additional warnings for lenient mode
  if (level === 'lenient') {
    if (!data.points || data.points < 10) {
      warnings.push('Points value seems low. Consider increasing for better grading granularity.')
    }

    if (data.estimated_time && data.estimated_time < 15) {
      warnings.push(
        'Estimated time seems very short. Consider if assignment can be completed in this time.'
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

// Quick validation for specific fields
export const validateField = (field, value) => {
  const fieldSchemas = {
    title: yup.string().min(5).max(255),
    slug: yup.string().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    points: yup.number().min(1).max(1000),
    estimated_time: yup.number().min(5),
  }

  const schema = fieldSchemas[field]
  if (!schema) return { isValid: true }

  try {
    schema.validateSync(value)
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: error.message }
  }
}

// Generate JSON schema for documentation
export const generateJSONSchema = () => {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Course Assignment',
    type: 'object',
    required: ['title', 'description', 'course_id', 'module_topic'],
    properties: {
      title: { type: 'string', minLength: 5, maxLength: 255 },
      slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      course_id: { type: 'integer', minimum: 1 },
      module_topic: { type: 'string' },
      description: { type: 'string', minLength: 10 },
      difficulty_level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      },
      assignment_type: {
        type: 'string',
        enum: [
          'coding_exercise',
          'multiple_choice',
          'project_based',
          'theoretical',
          'practical_lab',
          'case_study',
          'quiz',
          'peer_review',
        ],
      },
      points: { type: 'integer', minimum: 1, maximum: 1000 },
      estimated_time: { type: 'integer', minimum: 5 },
      is_active: { type: 'boolean' },
      is_mandatory: { type: 'boolean' },
    },
  }
}

// Format JSON with validation
export const formatAndValidateJSON = jsonString => {
  try {
    const parsed = JSON.parse(jsonString)
    const formatted = JSON.stringify(parsed, null, 2)
    return { success: true, data: formatted, parsed }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Generate sample JSON
export const generateSampleJSON = (technology = 'default') => {
  const samples = {
    default: {
      title: 'Advanced Programming Assignment',
      slug: 'advanced-programming-assignment',
      module_topic: 'Advanced Data Structures',
      description: 'Implement advanced data structures with performance optimizations...',
      short_description: 'Data structures implementation with time complexity analysis',
      difficulty_level: 'advanced',
      assignment_type: 'coding_exercise',
      estimated_time: 180,
      points: 100,
      sequence_order: 1,
      is_mandatory: true,
      is_active: true,
      instructions: {
        tasks: [
          'Implement a self-balancing binary search tree',
          'Add unit tests for all operations',
          'Document time and space complexity',
          'Create performance benchmarks',
        ],
        deliverables: ['Source code', 'Test cases', 'Documentation', 'Benchmark results'],
        constraints: ['Must support O(log n) operations', 'Thread-safe implementation'],
        tips: ['Start with AVL tree implementation', 'Use property-based testing'],
        common_mistakes: ['Forgetting edge cases', 'Not handling concurrency'],
      },
      evaluation_criteria: {
        rubric: [
          {
            criteria: 'Correctness',
            weight: 40,
            description: 'Does the code produce correct results?',
          },
          {
            criteria: 'Performance',
            weight: 30,
            description: 'Time and space complexity optimizations',
          },
          {
            criteria: 'Code Quality',
            weight: 20,
            description: 'Readability, documentation, and structure',
          },
          { criteria: 'Testing', weight: 10, description: 'Comprehensive test coverage' },
        ],
        auto_graded: false,
        passing_score: 70,
        max_attempts: 3,
      },
      technology_specific: {
        programming_language: 'Java',
        framework: 'Spring Boot',
        tools: ['IntelliJ IDEA', 'Maven', 'JUnit 5'],
        environment_setup: {
          java_version: '17',
          dependencies: ['spring-boot-starter-web', 'spring-boot-starter-test'],
        },
      },
      resources: {
        reading_materials: [
          'Introduction to Algorithms by Cormen et al.',
          'Java Concurrency in Practice',
        ],
        video_links: [
          'https://example.com/data-structures-tutorial',
          'https://example.com/performance-optimization',
        ],
        documentation: ['Java Collections Framework documentation', 'Spring Boot reference guide'],
      },
      metadata: {
        tags: ['data-structures', 'algorithms', 'performance'],
        learning_objectives: [
          'Understand self-balancing trees',
          'Implement concurrent data structures',
          'Analyze algorithm complexity',
        ],
        complexity: {
          time_complexity: 'O(log n)',
          space_complexity: 'O(n)',
          difficulty_score: 8,
        },
        version: '1.0.0',
        review_status: 'draft',
      },
    },
  }

  return samples[technology] || samples.default
}

export default {
  validateAssignmentData,
  validateField,
  generateJSONSchema,
  formatAndValidateJSON,
  generateSampleJSON,
  assignmentSchema,
}
