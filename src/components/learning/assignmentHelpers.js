export const assignmentHelpers = {
  // Get difficulty color
  getDifficultyColor: level => {
    if (!level) return 'bg-gray-100 text-gray-800 border border-gray-200'
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  },

  // Format time
  formatTime: minutes => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} mins`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  },

  // Get assignment type
  getAssignmentType: type => {
    if (!type) return 'Assignment'
    switch (type) {
      case 'coding_exercise':
      case 'coding':
        return 'Coding Exercise'
      case 'quiz':
        return 'Quiz'
      case 'project':
        return 'Project'
      case 'written':
        return 'Written Assignment'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  },

  // Get status
  getStatus: progress => {
    if (!progress) return 'Not Started'
    if (progress.completed) return 'Completed'
    if (progress.attempts > 0) return 'In Progress'
    return 'Not Started'
  },

  // Get status color
  getStatusColor: progress => {
    if (!progress) return 'bg-gray-100 text-gray-800'
    if (progress.completed) return 'bg-green-100 text-green-800'
    if (progress.attempts > 0) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  },

  // Get technology display
  getTechnologyDisplay: assignment => {
    if (assignment.technology_display) return assignment.technology_display
    if (assignment.technology_specific?.programming_language) {
      const language = assignment.technology_specific.programming_language
      const framework = assignment.technology_specific.framework
      return framework ? `${language} (${framework})` : language
    }
    return 'Programming'
  },

  // Get learning objectives
  getLearningObjectives: assignment => {
    return assignment.metadata?.learning_objectives || []
  },

  // Get tags
  getTags: assignment => {
    return assignment.metadata?.tags || []
  },

  // Get evaluation criteria
  getEvaluationCriteria: assignment => {
    return assignment.evaluation_criteria?.rubric || []
  },

  // Get instructions tasks
  getInstructionsTasks: assignment => {
    return assignment.instructions?.tasks || []
  },

  // Get resources
  getResources: assignment => {
    const resources = {
      video_links: [],
      reading_materials: [],
      documentation: [],
      external_links: [],
    }

    if (assignment.resources) {
      if (assignment.resources.video_links?.length > 0) {
        resources.video_links = assignment.resources.video_links
      }
      if (assignment.resources.reading_materials?.length > 0) {
        resources.reading_materials = assignment.resources.reading_materials
      }
      if (assignment.resources.documentation?.length > 0) {
        resources.documentation = assignment.resources.documentation
      }
      if (assignment.resources.external_links?.length > 0) {
        resources.external_links = assignment.resources.external_links
      }
    }

    return resources
  },

  // Get resource count
  getResourceCount: resources => {
    return Object.values(resources).reduce((sum, items) => sum + items.length, 0)
  },

  // Format resource type
  formatResourceType: type => {
    switch (type) {
      case 'video_links':
        return 'Video Resources'
      case 'reading_materials':
        return 'Reading Materials'
      case 'documentation':
        return 'Documentation'
      case 'external_links':
        return 'External Links'
      default:
        return type
    }
  },
}
