// src/validations/tutorialNote.validation.js
const yup = require('yup')

// Helper function for UUID validation
const uuidSchema = yup.string().uuid('Invalid UUID format').required('UUID is required')

// Helper for version pattern
const versionPattern = /^\d+\.\d+$/
// Helper for hex color pattern
const hexColorPattern = /^#[0-9A-F]{6}$/i

// Content block schema
const contentBlockSchema = yup.object({
  id: yup.string().optional(),
  type: yup
    .string()
    .oneOf([
      'heading',
      'subheading',
      'paragraph',
      'bullet_list',
      'numbered_list',
      'code_example',
      'table',
      'callout',
      'image',
      'exercise',
      'quote',
      'warning',
      'tip',
      'note',
    ])
    .required(),
  level: yup
    .number()
    .integer()
    .min(1)
    .max(6)
    .when('type', {
      is: val => ['heading', 'subheading'].includes(val),
      then: schema => schema.required(),
      otherwise: schema => schema.optional(),
    }),
  content: yup
    .mixed()
    .when('type', {
      is: 'heading',
      then: yup.string().min(1).max(200).required(),
    })
    .when('type', {
      is: 'subheading',
      then: yup.string().min(1).max(200).required(),
    })
    .when('type', {
      is: 'paragraph',
      then: yup.string().min(1).max(5000).required(),
    })
    .when('type', {
      is: 'bullet_list',
      then: yup.array().of(yup.string().min(1).max(500)).min(1).required(),
    })
    .when('type', {
      is: 'numbered_list',
      then: yup.array().of(yup.string().min(1).max(500)).min(1).required(),
    })
    .when('type', {
      is: 'code_example',
      then: yup
        .object({
          code: yup.string().required(),
          language: yup.string().default('javascript'),
          filename: yup.string().optional(),
          explanation: yup.string().optional(),
        })
        .required(),
    })
    .when('type', {
      is: 'table',
      then: yup
        .object({
          headers: yup.array().of(yup.string()).required(),
          rows: yup.array().of(yup.array().of(yup.string())).required(),
          caption: yup.string().optional(),
        })
        .required(),
    })
    .when('type', {
      is: 'callout',
      then: yup
        .object({
          type: yup.string().oneOf(['info', 'warning', 'tip', 'danger', 'success']).required(),
          title: yup.string().optional(),
          content: yup.string().required(),
        })
        .required(),
    })
    .when('type', {
      is: 'image',
      then: yup
        .object({
          url: yup.string().url('Invalid URL format').required(),
          alt: yup.string().optional(),
          caption: yup.string().optional(),
          width: yup.number().integer().optional(),
          height: yup.number().integer().optional(),
        })
        .required(),
    })
    .when('type', {
      is: 'exercise',
      then: yup
        .object({
          question: yup.string().required(),
          hint: yup.string().optional(),
          solution: yup.string().optional(),
          difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).default('medium'),
        })
        .required(),
    })
    .when('type', {
      is: 'quote',
      then: yup.string().required(),
    })
    .when('type', {
      is: 'warning',
      then: yup.string().required(),
    })
    .when('type', {
      is: 'tip',
      then: yup.string().required(),
    })
    .when('type', {
      is: 'note',
      then: yup.string().required(),
    })
    .default(undefined),
  metadata: yup.object().optional(),
  children: yup
    .array()
    .of(yup.lazy(() => contentBlockSchema))
    .optional(),
})

// Section content schema
const sectionContentSchema = yup.object({
  headings: yup.array().of(yup.string().max(200)).default([]),
  paragraphs: yup.array().of(yup.string().max(5000)).default([]),
  bullet_points: yup.array().of(yup.string().max(500)).default([]),
  numbered_lists: yup.array().of(yup.string().max(500)).default([]),
  examples: yup.array().of(yup.string().max(2000)).default([]),
  code_blocks: yup
    .array()
    .of(
      yup.object({
        code: yup.string().required(),
        language: yup.string().default('javascript'),
        explanation: yup.string().optional(),
      })
    )
    .default([]),
  images: yup
    .array()
    .of(
      yup.object({
        url: yup.string().url('Invalid URL format').required(),
        alt: yup.string().optional(),
        caption: yup.string().optional(),
      })
    )
    .default([]),
  tables: yup
    .array()
    .of(
      yup.object({
        headers: yup.array().of(yup.string()).required(),
        rows: yup.array().of(yup.array().of(yup.string())).required(),
        caption: yup.string().optional(),
      })
    )
    .default([]),
  callouts: yup
    .array()
    .of(
      yup.object({
        type: yup.string().oneOf(['info', 'warning', 'tip', 'danger', 'success']).required(),
        title: yup.string().optional(),
        content: yup.string().required(),
      })
    )
    .default([]),
})

// Section schema
const sectionSchema = yup.object({
  id: yup.string().optional(),
  title: yup
    .string()
    .min(3, 'Section title must be at least 3 characters')
    .max(200, 'Section title must be less than 200 characters')
    .required('Section title is required'),
  type: yup
    .string()
    .oneOf(['theory', 'practical', 'example', 'exercise', 'summary', 'review'])
    .default('theory'),
  order: yup.number().integer().min(1).default(1),
  content: sectionContentSchema.default({}),
  estimated_time: yup.number().integer().min(1).max(480).default(10),
  prerequisites: yup.array().of(yup.string()).default([]),
  learning_objectives: yup.array().of(yup.string()).default([]),
  metadata: yup.object().optional(),
})

// Tutorial notes schema
const tutorialNotesSchema = yup.object({
  sections: yup.array().of(sectionSchema).default([]),
  total_sections: yup.number().integer().min(0).default(0),
  estimated_study_time: yup.number().integer().min(0).default(0),
  last_updated: yup.date().optional(),
  version: yup.string().matches(versionPattern, 'Invalid version format').default('1.0'),
})

// Study content schema
const studyContentSchema = yup.object({
  introduction: yup
    .object({
      title: yup.string().max(200).optional(),
      content: yup.string().optional(),
      objectives: yup.array().of(yup.string()).default([]),
      prerequisites: yup.array().of(yup.string()).default([]),
    })
    .default({}),
  theory_concepts: yup.array().of(yup.string()).default([]),
  practical_examples: yup.array().of(yup.string()).default([]),
  step_by_step_guides: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        steps: yup.array().of(yup.string()).required(),
        expected_result: yup.string().optional(),
      })
    )
    .default([]),
  common_mistakes: yup
    .array()
    .of(
      yup.object({
        mistake: yup.string().required(),
        solution: yup.string().required(),
        explanation: yup.string().optional(),
      })
    )
    .default([]),
  best_practices: yup.array().of(yup.string()).default([]),
  summary: yup.string().optional(),
  further_reading: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').optional(),
        author: yup.string().optional(),
        description: yup.string().optional(),
      })
    )
    .default([]),
})

// Examples repository schema
const examplesRepositorySchema = yup.object({
  code_examples: yup
    .array()
    .of(
      yup.object({
        id: yup.string().optional(),
        title: yup.string().required(),
        description: yup.string().optional(),
        code: yup.string().required(),
        language: yup.string().default('javascript'),
        explanation: yup.string().optional(),
        expected_output: yup.string().optional(),
        tags: yup.array().of(yup.string()).default([]),
        difficulty: yup
          .string()
          .oneOf(['beginner', 'intermediate', 'advanced'])
          .default('beginner'),
        related_concepts: yup.array().of(yup.string()).default([]),
      })
    )
    .default([]),
  case_studies: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        description: yup.string().required(),
        scenario: yup.string().required(),
        solution: yup.string().optional(),
        learnings: yup.array().of(yup.string()).default([]),
      })
    )
    .default([]),
  real_world_scenarios: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        problem: yup.string().required(),
        solution_approach: yup.string().optional(),
        implementation: yup.string().optional(),
      })
    )
    .default([]),
  sample_projects: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        description: yup.string().optional(),
        github_url: yup.string().url('Invalid URL format').optional(),
        technologies: yup.array().of(yup.string()).default([]),
        difficulty: yup
          .string()
          .oneOf(['beginner', 'intermediate', 'advanced'])
          .default('beginner'),
      })
    )
    .default([]),
  templates: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        content: yup.string().required(),
        language: yup.string().required(),
        description: yup.string().optional(),
      })
    )
    .default([]),
})

// Visual aids schema
const visualAidsSchema = yup.object({
  diagrams: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        description: yup.string().optional(),
        type: yup.string().oneOf(['flowchart', 'architecture', 'sequence', 'class']).optional(),
      })
    )
    .default([]),
  flowcharts: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        description: yup.string().optional(),
      })
    )
    .default([]),
  infographics: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        description: yup.string().optional(),
      })
    )
    .default([]),
  screenshots: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        description: yup.string().optional(),
        step: yup.number().integer().optional(),
      })
    )
    .default([]),
  video_tutorials: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        duration: yup.number().integer().optional(),
        platform: yup.string().oneOf(['youtube', 'vimeo', 'other']).default('youtube'),
      })
    )
    .default([]),
  interactive_demos: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        url: yup.string().url('Invalid URL format').required(),
        description: yup.string().optional(),
        technology: yup.string().optional(),
      })
    )
    .default([]),
})

// Quick references schema
const quickReferencesSchema = yup.object({
  cheat_sheets: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        content: yup.string().required(),
        format: yup.string().oneOf(['markdown', 'html', 'pdf']).default('markdown'),
      })
    )
    .default([]),
  key_points: yup.array().of(yup.string()).default([]),
  formulas: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        formula: yup.string().required(),
        description: yup.string().optional(),
        example: yup.string().optional(),
      })
    )
    .default([]),
  commands: yup
    .array()
    .of(
      yup.object({
        command: yup.string().required(),
        description: yup.string().required(),
        platform: yup.string().oneOf(['linux', 'windows', 'mac', 'all']).default('all'),
        category: yup.string().optional(),
      })
    )
    .default([]),
  shortcuts: yup
    .array()
    .of(
      yup.object({
        shortcut: yup.string().required(),
        action: yup.string().required(),
        platform: yup.string().oneOf(['windows', 'mac', 'linux', 'ide']).optional(),
      })
    )
    .default([]),
  glossary: yup
    .array()
    .of(
      yup.object({
        term: yup.string().required(),
        definition: yup.string().required(),
        example: yup.string().optional(),
      })
    )
    .default([]),
})

// Practice exercises schema
const practiceExercisesSchema = yup.object({
  warmup_exercises: yup
    .array()
    .of(
      yup.object({
        question: yup.string().required(),
        solution: yup.string().optional(),
        hint: yup.string().optional(),
        points: yup.number().integer().min(1).max(10).default(5),
      })
    )
    .default([]),
  challenge_problems: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required(),
        description: yup.string().required(),
        requirements: yup.array().of(yup.string()).default([]),
        solution_guidance: yup.string().optional(),
        difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).default('medium'),
      })
    )
    .default([]),
  self_assessment_quizzes: yup
    .array()
    .of(
      yup.object({
        question: yup.string().required(),
        options: yup.array().of(yup.string()).min(2).required(),
        correct_answer: yup.number().integer().min(0).required(),
        explanation: yup.string().optional(),
      })
    )
    .default([]),
  thought_experiments: yup.array().of(yup.string()).default([]),
})

// Notes formatting schema
const notesFormattingSchema = yup.object({
  structure: yup
    .object({
      headings_levels: yup.number().integer().min(1).max(6).default(3),
      use_bullets: yup.boolean().default(true),
      use_numbering: yup.boolean().default(true),
      use_callouts: yup.boolean().default(true),
      use_code_blocks: yup.boolean().default(true),
      use_tables: yup.boolean().default(true),
      use_images: yup.boolean().default(true),
    })
    .default({}),
  styling: yup
    .object({
      theme: yup.string().oneOf(['light', 'dark', 'auto']).default('light'),
      font_size: yup.string().oneOf(['small', 'medium', 'large']).default('medium'),
      code_theme: yup
        .string()
        .oneOf(['github', 'monokai', 'dracula', 'solarized'])
        .default('github'),
      highlight_colors: yup
        .object({
          important: yup.string().matches(hexColorPattern, 'Invalid hex color').default('#ffeb3b'),
          warning: yup.string().matches(hexColorPattern, 'Invalid hex color').default('#ff9800'),
          tip: yup.string().matches(hexColorPattern, 'Invalid hex color').default('#4caf50'),
          note: yup.string().matches(hexColorPattern, 'Invalid hex color').default('#2196f3'),
          danger: yup.string().matches(hexColorPattern, 'Invalid hex color').default('#f44336'),
        })
        .default({}),
    })
    .default({}),
})

// Main content schema
const contentSchema = yup.object({
  tutorial_notes: tutorialNotesSchema.default({}),
  study_content: studyContentSchema.default({}),
  content_blocks: yup.array().of(contentBlockSchema).default([]),
  examples_repository: examplesRepositorySchema.default({}),
  visual_aids: visualAidsSchema.default({}),
  quick_references: quickReferencesSchema.default({}),
  practice_exercises: practiceExercisesSchema.default({}),
  notes_formatting: notesFormattingSchema.default({}),
})

// Metadata schema
const metadataSchema = yup.object({
  tags: yup.array().of(yup.string()).default([]),
  learning_objectives: yup.array().of(yup.string()).default([]),
  complexity: yup.object().default({}),
  version: yup.string().matches(versionPattern, 'Invalid version format').default('1.0'),
  last_updated: yup.date().optional(),
  created_by: yup.string().optional(),
  review_status: yup.string().oneOf(['draft', 'review', 'approved', 'published']).default('draft'),
  accessibility_features: yup.array().of(yup.string()).default([]),
  internal_notes: yup.string().default(''),
})

// Main validation schemas
const createTutorialNoteSchema = yup.object({
  assignment_id: uuidSchema,
  title: yup
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  content: contentSchema.default({}),
  metadata: metadataSchema.default({}),
  is_active: yup.boolean().default(true),
  // created_by_user_id: yup.number().integer().min(1).optional(),
  // updated_by_user_id: yup.number().integer().min(1).optional(),
})

const updateTutorialNoteSchema = yup
  .object({
    title: yup
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must be less than 255 characters')
      .optional(),
    content: contentSchema.optional(),
    metadata: metadataSchema.optional(),
    is_active: yup.boolean().optional(),
    // updated_by_user_id: yup.number().integer().min(1).optional(),
  })
  .test('at-least-one', 'At least one field must be provided', value => {
    return Object.keys(value || {}).length > 0
  })

const addSectionSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  type: yup
    .string()
    .oneOf(['theory', 'practical', 'example', 'exercise', 'summary', 'review'])
    .required('Type is required'),
  order: yup.number().integer().min(1).optional(),
  content: sectionContentSchema.optional(),
  estimated_time: yup.number().integer().min(1).max(480).optional(),
  prerequisites: yup.array().of(yup.string()).optional(),
  learning_objectives: yup.array().of(yup.string()).optional(),
  metadata: yup.object().optional(),
})

const updateSectionSchema = yup
  .object({
    section_id: yup.string().required('Section ID is required'),
    title: yup
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be less than 200 characters')
      .optional(),
    type: yup
      .string()
      .oneOf(['theory', 'practical', 'example', 'exercise', 'summary', 'review'])
      .optional(),
    order: yup.number().integer().min(1).optional(),
    content: sectionContentSchema.optional(),
    estimated_time: yup.number().integer().min(1).max(480).optional(),
    prerequisites: yup.array().of(yup.string()).optional(),
    learning_objectives: yup.array().of(yup.string()).optional(),
    metadata: yup.object().optional(),
  })
  .test('at-least-two', 'At least one field besides section_id must be provided', value => {
    if (!value) return false
    const keys = Object.keys(value)
    return keys.length > 1
  })

const ratingSchema = yup.object({
  rating: yup
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .required('Rating is required'),
})

const searchQuerySchema = yup.object({
  q: yup.string().min(1).max(100).required('Search query is required'),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  sort_by: yup.string().oneOf(['rating', 'views', 'date', 'relevance']).default('relevance'),
  difficulty: yup.string().oneOf(['beginner', 'intermediate', 'advanced', 'all']).default('all'),
})

const paginationQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  sort_by: yup.string().oneOf(['rating', 'views', 'downloads', 'date']).default('date'),
  order: yup.string().oneOf(['asc', 'desc']).default('desc'),
})

const exportQuerySchema = yup.object({
  format: yup.string().oneOf(['json', 'markdown', 'html', 'pdf']).default('json'),
  include_metadata: yup.boolean().default(true),
  include_examples: yup.boolean().default(true),
  include_exercises: yup.boolean().default(false),
})

const tutorialNoteIdSchema = yup.object({
  noteId: uuidSchema,
})

const assignmentIdSchema = yup.object({
  assignmentId: uuidSchema,
})

module.exports = {
  // Schemas
  createTutorialNoteSchema,
  updateTutorialNoteSchema,
  addSectionSchema,
  updateSectionSchema,
  ratingSchema,
  searchQuerySchema,
  paginationQuerySchema,
  exportQuerySchema,
  tutorialNoteIdSchema,
  assignmentIdSchema,

  // Individual schemas for reuse
  contentSchema,
  metadataSchema,
  sectionSchema,
  contentBlockSchema,
}
