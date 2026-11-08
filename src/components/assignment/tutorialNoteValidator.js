// tutorialNoteValidator.js
import * as yup from 'yup'

// Tutorial note content schema
const contentSchema = yup.object({
  tutorial_notes: yup.object({
    sections: yup.array().of(
      yup.object({
        title: yup.string().required(),
        type: yup
          .string()
          .oneOf(['theory', 'practical', 'example', 'exercise', 'summary', 'review']),
        order: yup.number().min(1),
        content: yup.object(),
        estimated_time: yup.number().min(1),
      })
    ),
    total_sections: yup.number().min(0),
    estimated_study_time: yup.number().min(0),
    last_updated: yup.date().nullable(),
    version: yup.string(),
  }),
  study_content: yup.object({
    introduction: yup.object({
      title: yup.string(),
      content: yup.string(),
      objectives: yup.array().of(yup.string()),
      prerequisites: yup.array().of(yup.string()),
    }),
    theory_concepts: yup.array().of(yup.string()),
    practical_examples: yup.array().of(yup.string()),
    step_by_step_guides: yup.array().of(
      yup.object({
        title: yup.string(),
        steps: yup.array().of(yup.string()),
        expected_result: yup.string(),
      })
    ),
    common_mistakes: yup.array().of(
      yup.object({
        mistake: yup.string(),
        solution: yup.string(),
        explanation: yup.string(),
      })
    ),
    best_practices: yup.array().of(yup.string()),
    summary: yup.string(),
    further_reading: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        author: yup.string(),
        description: yup.string(),
      })
    ),
  }),
  content_blocks: yup.array().of(
    yup.object({
      type: yup.string(),
      content: yup.string(),
      metadata: yup.object(),
    })
  ),
  examples_repository: yup.object({
    code_examples: yup.array().of(
      yup.object({
        title: yup.string(),
        code: yup.string(),
        language: yup.string(),
        explanation: yup.string(),
      })
    ),
    case_studies: yup.array().of(
      yup.object({
        title: yup.string(),
        description: yup.string(),
        scenario: yup.string(),
        solution: yup.string(),
      })
    ),
    real_world_scenarios: yup.array().of(
      yup.object({
        title: yup.string(),
        problem: yup.string(),
        solution_approach: yup.string(),
      })
    ),
    sample_projects: yup.array().of(
      yup.object({
        title: yup.string(),
        description: yup.string(),
        github_url: yup.string().url(),
        technologies: yup.array().of(yup.string()),
      })
    ),
    templates: yup.array().of(
      yup.object({
        name: yup.string(),
        content: yup.string(),
        language: yup.string(),
        description: yup.string(),
      })
    ),
  }),
  visual_aids: yup.object({
    diagrams: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        description: yup.string(),
      })
    ),
    flowcharts: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        description: yup.string(),
      })
    ),
    infographics: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        description: yup.string(),
      })
    ),
    screenshots: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        description: yup.string(),
      })
    ),
    video_tutorials: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        duration: yup.number(),
        platform: yup.string(),
      })
    ),
    interactive_demos: yup.array().of(
      yup.object({
        title: yup.string(),
        url: yup.string().url(),
        description: yup.string(),
        technology: yup.string(),
      })
    ),
  }),
  quick_references: yup.object({
    cheat_sheets: yup.array().of(
      yup.object({
        title: yup.string(),
        content: yup.string(),
        format: yup.string(),
      })
    ),
    key_points: yup.array().of(yup.string()),
    formulas: yup.array().of(
      yup.object({
        name: yup.string(),
        formula: yup.string(),
        description: yup.string(),
        example: yup.string(),
      })
    ),
    commands: yup.array().of(
      yup.object({
        command: yup.string(),
        description: yup.string(),
        platform: yup.string(),
        category: yup.string(),
      })
    ),
    shortcuts: yup.array().of(
      yup.object({
        shortcut: yup.string(),
        action: yup.string(),
        platform: yup.string(),
      })
    ),
    glossary: yup.array().of(
      yup.object({
        term: yup.string(),
        definition: yup.string(),
        example: yup.string(),
      })
    ),
  }),
  practice_exercises: yup.object({
    warmup_exercises: yup.array().of(
      yup.object({
        question: yup.string(),
        solution: yup.string(),
        hint: yup.string(),
        points: yup.number(),
      })
    ),
    challenge_problems: yup.array().of(
      yup.object({
        title: yup.string(),
        description: yup.string(),
        requirements: yup.array().of(yup.string()),
        solution_guidance: yup.string(),
        difficulty: yup.string(),
      })
    ),
    self_assessment_quizzes: yup.array().of(
      yup.object({
        question: yup.string(),
        options: yup.array().of(yup.string()),
        correct_answer: yup.number(),
        explanation: yup.string(),
      })
    ),
    thought_experiments: yup.array().of(yup.string()),
    discussion_questions: yup.array().of(yup.string()),
  }),
  notes_formatting: yup.object({
    structure: yup.object({
      headings_levels: yup.number(),
      use_bullets: yup.boolean(),
      use_numbering: yup.boolean(),
      use_callouts: yup.boolean(),
      use_code_blocks: yup.boolean(),
      use_tables: yup.boolean(),
      use_images: yup.boolean(),
    }),
    styling: yup.object({
      theme: yup.string(),
      font_size: yup.string(),
      code_theme: yup.string(),
      highlight_colors: yup.object(),
    }),
  }),
})

// Main tutorial note schema
const tutorialNoteSchema = yup.object({
  course_id: yup.number().positive().required('Course ID is required'),
  title: yup.string().min(3).max(255).required('Title is required'),
  content: contentSchema.default({}),
  metadata: yup.object({
    tags: yup.array().of(yup.string()),
    learning_objectives: yup.array().of(yup.string()),
    complexity: yup.object(),
    version: yup.string(),
    last_updated: yup.date().nullable(),
    created_by: yup.string().nullable(),
    review_status: yup.string(),
    accessibility_features: yup.array().of(yup.string()),
    internal_notes: yup.string(),
  }),
  is_active: yup.boolean(),
  // created_by_user_id: yup.number().positive(),
  // updated_by_user_id: yup.number().positive(),
})

// Validation function
export const validateTutorialNoteData = async (data, level = 'strict') => {
  const errors = []
  const warnings = []
  const info = []

  try {
    await tutorialNoteSchema.validate(data, { abortEarly: false })
  } catch (yupError) {
    yupError.inner.forEach(error => {
      errors.push(`${error.path}: ${error.message}`)
    })
  }

  // Custom validations
  if (level === 'strict' || level === 'moderate') {
    const sections = data.content?.tutorial_notes?.sections || []
    if (sections.length === 0) {
      warnings.push('No sections defined. Consider adding learning sections.')
    }

    const studyTime = data.content?.tutorial_notes?.estimated_study_time || 0
    if (studyTime < 15) {
      warnings.push('Estimated study time seems low. Consider increasing it.')
    }

    const intro = data.content?.study_content?.introduction?.content
    if (!intro || intro.length < 50) {
      warnings.push('Introduction content is brief. Consider adding more details.')
    }
  }

  if (level === 'strict') {
    const objectives = data.content?.study_content?.introduction?.objectives || []
    if (objectives.length === 0) {
      info.push('No learning objectives specified.')
    }

    const examples = data.content?.examples_repository?.code_examples || []
    if (examples.length === 0) {
      info.push('No code examples provided.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

// Generate sample tutorial note
export const generateSampleTutorialNote = () => ({
  title: 'JavaScript Advanced Concepts',
  content: {
    tutorial_notes: {
      sections: [
        {
          title: 'Advanced Functions',
          type: 'theory',
          order: 1,
          content: {
            headings: ['Higher-Order Functions', 'Closures', 'Currying'],
            paragraphs: [
              'Advanced functions in JavaScript allow for powerful programming patterns...',
            ],
          },
          estimated_time: 30,
        },
      ],
      total_sections: 1,
      estimated_study_time: 30,
      last_updated: new Date().toISOString(),
      version: '1.0.0',
    },
    study_content: {
      introduction: {
        title: 'Welcome to Advanced JavaScript',
        content:
          'This tutorial covers advanced JavaScript concepts that are essential for modern web development.',
        objectives: [
          'Understand higher-order functions',
          'Master closures and their applications',
          'Learn functional programming patterns',
        ],
        prerequisites: ['Basic JavaScript knowledge', 'ES6+ features'],
      },
      theory_concepts: ['Functional Programming', 'Immutable Patterns'],
      practical_examples: ['Memoization example', 'Debouncing implementation'],
      step_by_step_guides: [
        {
          title: 'Creating a Custom Higher-Order Function',
          steps: [
            'Define the function signature',
            'Implement the callback mechanism',
            'Add error handling',
            'Test with different callbacks',
          ],
          expected_result: 'A reusable higher-order function',
        },
      ],
      common_mistakes: [
        {
          mistake: 'Creating memory leaks with closures',
          solution: 'Use weak references or clear references',
          explanation: 'Closures can keep references alive longer than needed',
        },
      ],
      best_practices: [
        'Use pure functions when possible',
        'Avoid side effects in higher-order functions',
        'Document function signatures clearly',
      ],
      summary: 'Advanced functions provide powerful abstractions for complex logic.',
      further_reading: [
        {
          title: 'Functional Programming in JavaScript',
          url: 'https://example.com/functional-js',
          author: 'John Doe',
          description: 'Comprehensive guide to functional programming',
        },
      ],
    },
    examples_repository: {
      code_examples: [
        {
          title: 'Higher-Order Function Example',
          code: 'const multiplyBy = (n) => (x) => x * n;\nconst double = multiplyBy(2);\nconsole.log(double(5)); // 10',
          language: 'javascript',
          explanation: 'This shows how to create a function that returns another function',
        },
      ],
      case_studies: [],
      real_world_scenarios: [],
      sample_projects: [],
      templates: [],
    },
    visual_aids: {
      diagrams: [],
      flowcharts: [],
      infographics: [],
      screenshots: [],
      video_tutorials: [],
      interactive_demos: [],
    },
    quick_references: {
      cheat_sheets: [],
      key_points: [],
      formulas: [],
      commands: [],
      shortcuts: [],
      glossary: [],
    },
    practice_exercises: {
      warmup_exercises: [],
      challenge_problems: [],
      self_assessment_quizzes: [],
      thought_experiments: [],
      discussion_questions: [],
    },
    notes_formatting: {
      structure: {
        headings_levels: 3,
        use_bullets: true,
        use_numbering: true,
        use_callouts: true,
        use_code_blocks: true,
        use_tables: true,
        use_images: true,
      },
      styling: {
        theme: 'light',
        font_size: 'medium',
        code_theme: 'github',
        highlight_colors: {
          important: '#ffeb3b',
          warning: '#ff9800',
          tip: '#4caf50',
          note: '#2196f3',
          danger: '#f44336',
        },
      },
    },
  },
  metadata: {
    tags: ['javascript', 'advanced', 'functions', 'functional-programming'],
    learning_objectives: [
      'Master advanced JavaScript concepts',
      'Apply functional programming patterns',
      'Build efficient applications',
    ],
    complexity: {
      time_complexity: 'O(n)',
      space_complexity: 'O(1)',
      difficulty_score: 7,
    },
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    created_by: 'System',
    review_status: 'draft',
    accessibility_features: ['screen_reader', 'high_contrast'],
    internal_notes: 'Initial draft for advanced JavaScript concepts',
  },
  is_active: true,
  // created_by_user_id: 1,
  // updated_by_user_id: 1,
})

export default {
  validateTutorialNoteData,
  generateSampleTutorialNote,
  tutorialNoteSchema,
}
