// src/components/course/CourseOverview.jsx
import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Target,
  CheckCircle,
  Users,
  Clock,
  Medal,
  TrendingUp,
  Zap,
  FileText,
  ChevronRight,
  Star,
  Award,
  Layers,
  Calendar,
  Globe,
  Video,
  SlidersHorizontal,
} from 'lucide-react'

const CourseOverview = React.memo(({ course, levelInfo, stats }) => {
  const [expandedSections, setExpandedSections] = useState({
    prerequisites: true,
    learningObjectives: true,
    courseStructure: false,
  })

  // Handle API data variations
  const prerequisites = useMemo(() => {
    if (course.prerequisites && Array.isArray(course.prerequisites)) {
      return course.prerequisites
    }
    if (course.metadata?.prerequisites && Array.isArray(course.metadata.prerequisites)) {
      return course.metadata.prerequisites
    }
    return []
  }, [course])

  const learningObjectives = useMemo(() => {
    if (course.learning_objectives && Array.isArray(course.learning_objectives)) {
      return course.learning_objectives
    }
    if (
      course.metadata?.learning_objectives &&
      Array.isArray(course.metadata.learning_objectives)
    ) {
      return course.metadata.learning_objectives
    }
    return []
  }, [course])

  const modules = useMemo(() => {
    if (course.modules && Array.isArray(course.modules)) {
      return course.modules
    }
    if (course.metadata?.modules && Array.isArray(course.metadata.modules)) {
      return course.metadata.modules
    }
    if (course.curriculum && Array.isArray(course.curriculum)) {
      return course.curriculum
    }
    return []
  }, [course])

  const getModeIcon = mode => {
    const icons = {
      online_live: Globe,
      online_self_paced: Video,
      hybrid: SlidersHorizontal,
    }
    return icons[mode] || Globe
  }

  const ModeIcon = getModeIcon(course.mode)

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper for animated content
  const AnimatedContent = ({ isExpanded, children }) => (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
      }`}
    >
      {children}
    </div>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Course Description */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Course Overview</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Everything you need to know about this course
            </p>
          </div>
        </div>

        <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
          {course.description?.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          )) ||
            course.short_description ||
            'No description available.'}
        </div>
      </div>

      {/* Quick Stats Grid - responsive: 2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            icon: Layers,
            label: 'Modules',
            value: modules.length || 0,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50',
          },
          {
            icon: Clock,
            label: 'Duration',
            value: course.duration || 'Flexible',
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-50',
          },
          {
            icon: Users,
            label: 'Enrolled',
            value: `${stats.enrolled}+`,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50',
          },
          {
            icon: Star,
            label: 'Rating',
            value: `${stats.rating}/5`,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-gray-900">{stat.value}</div>
                <div className="text-[11px] sm:text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prerequisites Section - Enhanced responsive */}
      {prerequisites.length > 0 && (
        <div className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('prerequisites')}
            className="w-full flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-expanded={expandedSections.prerequisites}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Prerequisites</h3>
                <p className="text-xs sm:text-sm text-gray-600">What you need before starting</p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-gray-600 ${
                expandedSections.prerequisites ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatedContent isExpanded={expandedSections.prerequisites}>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {prerequisites.map((prereq, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                  <span className="relative px-3 py-1.5 sm:px-4 sm:py-2.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition-all inline-block">
                    {prereq}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>
      )}

      {/* Learning Objectives Section - Enhanced */}
      {learningObjectives.length > 0 && (
        <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('learningObjectives')}
            className="w-full flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
            aria-expanded={expandedSections.learningObjectives}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  What You'll Learn
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {learningObjectives.length} key objectives
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-gray-600 ${
                expandedSections.learningObjectives ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatedContent isExpanded={expandedSections.learningObjectives}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {learningObjectives.map((objective, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity blur-sm"></div>
                  <div className="relative p-3 sm:p-4 bg-white border border-emerald-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        {objective}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>
      )}

      {/* Course Structure Section - Enhanced */}
      {modules.length > 0 && (
        <div className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('courseStructure')}
            className="w-full flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
            aria-expanded={expandedSections.courseStructure}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Course Structure
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {modules.length} comprehensive modules
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-gray-600 ${
                expandedSections.courseStructure ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatedContent isExpanded={expandedSections.courseStructure}>
            <div className="relative">
              {/* Timeline line - hidden on mobile, visible on tablet+ */}
              <div className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-purple-100"></div>

              <div className="space-y-4 ml-0 md:ml-9">
                {modules.map((module, index) => (
                  <div key={index} className="group relative">
                    {/* Connector dot - hidden on mobile */}
                    <div className="hidden md:block absolute -left-12 top-4 w-6 h-6 bg-white border-2 border-purple-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>

                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                      <div className="relative p-3 sm:p-4 bg-white border border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-700 font-bold text-xs sm:text-sm">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                                {typeof module === 'string'
                                  ? module
                                  : module.module || module.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {typeof module === 'object' && module.description
                                  ? module.description
                                  : 'Comprehensive module covering essential concepts'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded self-start sm:self-center">
                            {typeof module === 'object' && module.duration
                              ? module.duration
                              : '2-3 hours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedContent>
        </div>
      )}

      {/* Course Details Card - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-gradient-to-br from-white to-primary-50/30 border border-primary-100 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Skill Level</h4>
              <p className="text-xs sm:text-sm text-gray-600">Who this course is for</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-600">Level:</span>
              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[11px] sm:text-xs font-bold rounded-full">
                {levelInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-600">Learning Mode:</span>
              <div className="flex items-center gap-1">
                <ModeIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {course.mode === 'online_live'
                    ? 'Live Online'
                    : course.mode === 'online_self_paced'
                      ? 'Self Paced'
                      : course.mode === 'hybrid'
                        ? 'Hybrid'
                        : 'Online'}
                </span>
              </div>
            </div>
            {course.start_date && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm font-medium text-gray-900">{course.start_date}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Course Features</h4>
              <p className="text-xs sm:text-sm text-gray-600">What's included</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Certificate of Completion', included: true },
              { label: 'Lifetime Access', included: course.is_active || true },
              { label: 'Project Files', included: true },
              { label: 'Q&A Support', included: true },
              { label: 'Mobile Access', included: true },
            ].map((feature, index) => (
              <div key={index} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-gray-700">{feature.label}</span>
                {feature.included ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <span className="text-xs text-gray-400">Not available</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

CourseOverview.displayName = 'CourseOverview'

export default CourseOverview
