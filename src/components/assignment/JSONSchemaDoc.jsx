import React from 'react'

const JSONSchemaDoc = () => {
  const schema = {
    type: 'object',
    required: ['title', 'description', 'module_topic'], // Removed 'course_id' from required
    properties: {
      // Basic Information
      title: {
        type: 'string',
        minLength: 5,
        maxLength: 255,
        description: 'Title of the assignment',
      },
      slug: {
        type: 'string',
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        description: 'URL-friendly slug for the assignment',
      },
      // Removed course_id field
      module_topic: {
        type: 'string',
        maxLength: 255,
        description: 'Topic or module name',
      },
      description: {
        type: 'string',
        minLength: 10,
        description: 'Detailed description of the assignment',
      },
      short_description: {
        type: 'string',
        maxLength: 500,
        description: 'Brief summary of the assignment',
      },

      // Configuration
      difficulty_level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        description: 'Difficulty level of the assignment',
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
        description: 'Type of assignment',
      },
      estimated_time: {
        type: 'integer',
        minimum: 5,
        description: 'Estimated completion time in minutes',
      },
      points: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
        description: 'Points awarded for completion',
      },
      sequence_order: {
        type: 'integer',
        minimum: 1,
        description: 'Order in the course sequence',
      },
      is_mandatory: {
        type: 'boolean',
        description: 'Whether assignment is mandatory',
      },
      is_active: {
        type: 'boolean',
        description: 'Whether assignment is active',
      },

      // Dates
      start_date: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Assignment start date',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Assignment end date',
      },
      allow_late_submission: {
        type: 'boolean',
        description: 'Whether late submissions are allowed',
      },
      late_submission_penalty: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Penalty percentage for late submission',
      },

      // Prerequisites
      prerequisites: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of prerequisite assignment IDs or topics',
      },
      has_prerequisites: {
        type: 'boolean',
        description: 'Whether assignment has prerequisites',
      },

      // Instructions (nested object)
      instructions: {
        type: 'object',
        properties: {
          overview: { type: 'string' },
          tasks: {
            type: 'array',
            items: { type: 'string' },
          },
          deliverables: {
            type: 'array',
            items: { type: 'string' },
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
          },
          tips: {
            type: 'array',
            items: { type: 'string' },
          },
          common_mistakes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      // Evaluation Criteria (nested object)
      evaluation_criteria: {
        type: 'object',
        properties: {
          rubric: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                criteria: { type: 'string' },
                weight: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                },
                description: { type: 'string' },
                levels: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      level: { type: 'string' },
                      score: { type: 'number' },
                      description: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          auto_graded: { type: 'boolean' },
          passing_score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
          },
          max_attempts: {
            type: 'integer',
            minimum: 1,
          },
          time_limit: {
            type: 'integer',
            minimum: 1,
            nullable: true,
          },
          code_quality_metrics: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      // Technology Specific (nested object)
      technology_specific: {
        type: 'object',
        properties: {
          programming_language: { type: 'string' },
          framework: { type: 'string' },
          tools: {
            type: 'array',
            items: { type: 'string' },
          },
          database: { type: 'string' },
          environment_setup: { type: 'object' },
          commands: {
            type: 'array',
            items: { type: 'string' },
          },
          config_files: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      // Resources (nested object)
      resources: {
        type: 'object',
        properties: {
          reading_materials: {
            type: 'array',
            items: { type: 'string' },
          },
          video_links: {
            type: 'array',
            items: { type: 'string' },
          },
          documentation: {
            type: 'array',
            items: { type: 'string' },
          },
          tools_required: {
            type: 'array',
            items: { type: 'string' },
          },
          starter_code: {
            type: 'string',
            nullable: true,
          },
          sample_output: {
            type: 'string',
            nullable: true,
          },
          reference_implementation: {
            type: 'string',
            nullable: true,
          },
        },
      },

      // Solution Metadata (nested object)
      solution_metadata: {
        type: 'object',
        properties: {
          reference_solution: {
            type: 'string',
            nullable: true,
          },
          model_answers: {
            type: 'array',
            items: { type: 'string' },
          },
          explanation_video: {
            type: 'string',
            nullable: true,
          },
          common_solutions: {
            type: 'array',
            items: { type: 'string' },
          },
          hint_structure: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },

      // Metadata (nested object)
      metadata: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          learning_objectives: {
            type: 'array',
            items: { type: 'string' },
          },
          complexity: {
            type: 'object',
            properties: {
              time_complexity: { type: 'string' },
              space_complexity: { type: 'string' },
              difficulty_score: {
                type: 'number',
                minimum: 1,
                maximum: 10,
              },
            },
          },
          version: { type: 'string' },
          last_updated: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          created_by: {
            type: 'string',
            nullable: true,
          },
          review_status: {
            type: 'string',
            enum: ['draft', 'review', 'approved', 'rejected'],
          },
          accessibility_features: {
            type: 'array',
            items: { type: 'string' },
          },
          internal_notes: { type: 'string' },
        },
      },
    },
  }

  // Helper to render property details
  const renderProperty = (key, prop, required = false, depth = 0) => {
    const indent = depth * 24

    return (
      <div key={key} className="mb-3" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-start gap-2 mb-1">
          <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">{key}</code>
          {required && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">required</span>
          )}
          <span className="text-xs text-gray-600">
            ({prop.type}
            {prop.format ? `, ${prop.format}` : ''})
          </span>
        </div>

        {prop.description && <p className="text-xs text-gray-600 mb-1">{prop.description}</p>}

        {prop.minLength !== undefined && (
          <div className="text-xs text-gray-500">Min length: {prop.minLength}</div>
        )}
        {prop.maxLength !== undefined && (
          <div className="text-xs text-gray-500">Max length: {prop.maxLength}</div>
        )}
        {prop.minimum !== undefined && (
          <div className="text-xs text-gray-500">Minimum: {prop.minimum}</div>
        )}
        {prop.maximum !== undefined && (
          <div className="text-xs text-gray-500">Maximum: {prop.maximum}</div>
        )}
        {prop.pattern && (
          <div className="text-xs text-gray-500">
            Pattern: <code className="text-xs">{prop.pattern}</code>
          </div>
        )}
        {prop.enum && (
          <div className="text-xs text-gray-500">Allowed values: {prop.enum.join(', ')}</div>
        )}
        {prop.nullable && <div className="text-xs text-gray-500">Can be null</div>}

        {/* Render nested objects */}
        {prop.type === 'object' && prop.properties && (
          <div className="mt-2 pl-2 border-l-2 border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">Properties:</div>
            {Object.entries(prop.properties).map(([nestedKey, nestedProp]) =>
              renderProperty(nestedKey, nestedProp, false, depth + 1)
            )}
          </div>
        )}

        {/* Render array items */}
        {prop.type === 'array' && prop.items && (
          <div className="mt-2 pl-2 border-l-2 border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">Array items:</div>
            {prop.items.type === 'object' && prop.items.properties ? (
              Object.entries(prop.items.properties).map(([itemKey, itemProp]) =>
                renderProperty(itemKey, itemProp, false, depth + 1)
              )
            ) : (
              <div className="text-xs text-gray-600">Type: {prop.items.type}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Assignment JSON Schema Documentation
      </h2>

      <div className="space-y-6">
        {/* Note about course_id */}
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <h3 className="text-sm font-medium text-blue-700 mb-2">Important Note:</h3>
          <p className="text-xs text-blue-700">
            The <code className="bg-blue-100 px-1 py-0.5 rounded">course_id</code> field is required
            for creating/updating assignments but is handled separately through the course selection
            interface in the editor. It is not included in this schema documentation as it's managed
            through the UI's course selection modal.
          </p>
        </div>

        {/* Required Fields Section */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="inline-block w-2 h-4 bg-red-500 mr-2"></span>
            Required Fields
          </h3>
          <div className="bg-red-50 p-3 rounded border border-red-100">
            {schema.required.map(field => (
              <div key={field} className="mb-2">
                {renderProperty(field, schema.properties[field], true)}
              </div>
            ))}
          </div>
        </section>

        {/* Basic Information */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            {['title', 'slug', 'module_topic', 'description', 'short_description'].map(key =>
              renderProperty(key, schema.properties[key])
            )}
          </div>
        </section>

        {/* Configuration */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            {[
              'difficulty_level',
              'assignment_type',
              'estimated_time',
              'points',
              'sequence_order',
              'is_mandatory',
              'is_active',
            ].map(key => renderProperty(key, schema.properties[key]))}
          </div>
        </section>

        {/* Dates */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dates</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            {['start_date', 'end_date', 'allow_late_submission', 'late_submission_penalty'].map(
              key => renderProperty(key, schema.properties[key])
            )}
          </div>
        </section>

        {/* Prerequisites */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Prerequisites</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            {['prerequisites', 'has_prerequisites'].map(key =>
              renderProperty(key, schema.properties[key])
            )}
          </div>
        </section>

        {/* Nested Objects */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Nested Objects</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">instructions</h4>
              {renderProperty('instructions', schema.properties.instructions)}
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">evaluation_criteria</h4>
              {renderProperty('evaluation_criteria', schema.properties.evaluation_criteria)}
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">technology_specific</h4>
              {renderProperty('technology_specific', schema.properties.technology_specific)}
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">resources</h4>
              {renderProperty('resources', schema.properties.resources)}
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">solution_metadata</h4>
              {renderProperty('solution_metadata', schema.properties.solution_metadata)}
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">metadata</h4>
              {renderProperty('metadata', schema.properties.metadata)}
            </div>
          </div>
        </section>

        {/* Example JSON */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Example JSON Structure</h3>
          <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
            {`{
  "title": "Advanced Data Structures Implementation",
  "slug": "advanced-data-structures-implementation",
  "module_topic": "Data Structures",
  "description": "Implement advanced data structures with performance analysis...",
  "difficulty_level": "intermediate",
  "assignment_type": "coding_exercise",
  "points": 100,
  "estimated_time": 120,
  "instructions": {
    "tasks": ["Task 1", "Task 2"],
    "deliverables": ["Source code", "Documentation"]
  },
  "evaluation_criteria": {
    "rubric": [
      {
        "criteria": "Correctness",
        "weight": 40,
        "description": "Code produces correct results"
      }
    ]
  }
}`}
          </pre>
        </section>

        {/* Validation Notes */}
        <section className="bg-yellow-50 p-3 rounded border border-yellow-100">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Validation Notes</h3>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
            <li>Total weight in rubric must sum to 100%</li>
            <li>End date must be after start date if both are provided</li>
            <li>Slug must be URL-friendly (lowercase, hyphens, numbers only)</li>
            <li>Points must be between 1 and 1000</li>
            <li>Late submission penalty is a percentage (0-100)</li>
            <li>
              Note: <code>course_id</code> is required but handled through course selection in the
              UI
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default JSONSchemaDoc
