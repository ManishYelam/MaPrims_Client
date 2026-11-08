// src/pages/dashboard/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { coursesAPI } from '../../services/api'

// Icons
const BookOpen = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
)

const Clock = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Award = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const TrendingUp = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
)

const Play = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Calendar = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const FileText = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const Users = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
)

const Star = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const Download = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

const Share2 = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
)

const Bell = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-3.81-2.68 6 6 0 00-1.9 5.22 2.5 2.5 0 01-2.35 2.68A2.5 2.5 0 014.5 16H8a3 3 0 006 0h4.5a2.5 2.5 0 00.33-4.98 2.5 2.5 0 01-2.35-2.68 6 6 0 00-1.9-5.22 5.97 5.97 0 01-3.81 2.68z"
    />
  </svg>
)

const Target = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Zap = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
)

const Brain = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
)

const CreditCard = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
)

const User = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
)

const SettingsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

const HelpCircle = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Certificate = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

// Quick Stats Component with React.memo
const QuickStats = React.memo(({ stats = [] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
    {stats.map((stat, index) => (
      <div
        key={stat.name}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 min-w-0"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
              {stat.name}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">
              {stat.value}
            </p>
            <div className="flex items-center space-x-2 min-w-0">
              <p className="text-xs text-gray-500 truncate">{stat.description}</p>
              {stat.trend && (
                <span
                  className={`text-xs font-medium flex-shrink-0 ${
                    stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
          <div
            className={`p-2 sm:p-3 rounded-xl ${stat.bgColor} transition-transform duration-300 hover:scale-110 ml-3 flex-shrink-0`}
          >
            <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
          </div>
        </div>
      </div>
    ))}
  </div>
))

// Course Progress Component with React.memo
const CourseProgress = React.memo(({ enrollments = [], onCourseClick, loading }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Your Courses</h2>
      <Link
        to="/dashboard/courses"
        className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200 flex-shrink-0"
      >
        <span>View all</span>
        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
      </Link>
    </div>

    {loading ? (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl animate-pulse"
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-16 sm:w-20 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-3 sm:space-y-4">
        {enrollments?.slice(0, 4).map(enrollment => {
          const course = enrollment.Course || enrollment
          const progress = enrollment.enrollments?.[0]?.progress || enrollment.progress || 0

          return (
            <div
              key={enrollment.id || enrollment.course_id}
              className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 group cursor-pointer min-w-0"
              onClick={() => onCourseClick && onCourseClick(course.course_id || course.id)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={course.thumbnail_image || '/images/course-placeholder.jpg'}
                  alt={course.title}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover shadow-sm"
                  onError={e => {
                    e.target.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAyMEMzMS4zMTM3IDIwIDM0IDE3LjMxMzcgMzQgMTVDMzQgMTIuNjg2MyAzMS4zMTM3IDEwIDI4IDEwQzI0LjY4NjMgMTAgMjIgMTIuNjg2MyAyMiAxNUMyMiAxNy4zMTM3IDI0LjY4NjMgMjAgMjggMjBaIiBmaWxsPSIjOEU5MEEyIi8+CjxwYXRoIGQ9Ik0zNiAzNkgyMEMxNy43OTA5IDM2IDE2IDM0LjIwOTEgMTYgMzJWMjRIMzZWMzZaIiBmaWxsPSIjOEU5MEEyIi8+Cjwvc3ZnPgo='
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 sm:p-1 shadow-sm">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-primary-600 transition-colors">
                  {course.title}
                </h3>
                <div className="flex items-center space-x-2 mt-0.5 sm:mt-1">
                  <span className="text-xs text-gray-500">{course.level}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-500">{course.rating || 4.5}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-gray-900">{progress}%</div>
                <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 80
                        ? 'bg-green-500'
                        : progress >= 50
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {(!enrollments || enrollments.length === 0) && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No courses enrolled yet</p>
            <p className="text-sm mb-3 sm:mb-4">Start your SAP ABAP journey today!</p>
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Browse Courses</span>
            </Link>
          </div>
        )}
      </div>
    )}
  </div>
))

// Learning Goals & Recommendations Component
const LearningGoals = React.memo(({ enrolledCourses = [], stats = {} }) => {
  // Calculate recommendations based on progress
  const getRecommendations = useMemo(() => {
    const recommendations = []

    if (enrolledCourses.length > 0) {
      // Find course with lowest progress
      const lowestProgressCourse = enrolledCourses.reduce((min, course) => {
        const progress = course.enrollments?.[0]?.progress || course.progress || 0
        const minProgress = min.enrollments?.[0]?.progress || min.progress || 0
        return progress < minProgress ? course : min
      }, enrolledCourses[0])

      const lowProgress =
        lowestProgressCourse.enrollments?.[0]?.progress || lowestProgressCourse.progress || 0

      if (lowProgress < 30) {
        recommendations.push({
          title: 'Catch up on slow progress',
          description: `Continue with "${lowestProgressCourse.Course?.title || lowestProgressCourse.title}"`,
          priority: 'High',
          icon: Zap,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
        })
      }
    }

    // Add based on completion rate
    const completionRate = stats.completed_courses || 0
    if (completionRate === 0 && enrolledCourses.length > 0) {
      recommendations.push({
        title: 'Complete your first course',
        description: 'Focus on finishing one course to build momentum',
        priority: 'Medium',
        icon: Target,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
      })
    }

    // Default recommendations
    if (recommendations.length < 3) {
      recommendations.push(
        {
          title: 'Daily practice session',
          description: 'Spend 30 minutes practicing ABAP coding exercises',
          priority: 'Medium',
          icon: Clock,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Review weak topics',
          description: 'Revisit modules where you scored below 70%',
          priority: 'Low',
          icon: Brain,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
        }
      )
    }

    return recommendations.slice(0, 3)
  }, [enrolledCourses, stats])

  return (
    <div className="space-y-4">
      {/* Current Goals Section */}
      {/* <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
        <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 flex items-center space-x-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span>Current Learning Goals</span>
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span className="text-gray-700">Course Completion</span>
              <span className="font-semibold">{stats.average_progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.average_progress || 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span className="text-gray-700">Skills Mastered</span>
              <span className="font-semibold">{stats.skills_mastered || 0}/50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((stats.skills_mastered || 0) / 50) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div> */}

      {/* Recommendations Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center space-x-2">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <span>Recommended Actions</span>
        </h4>

        {getRecommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 border rounded-lg ${rec.bgColor} border-opacity-50 hover:shadow-sm transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-lg ${rec.bgColor.replace('50', '100')} group-hover:scale-110 transition-transform`}
              >
                <rec.icon className={`w-4 h-4 ${rec.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium text-gray-900 text-sm truncate">{rec.title}</h5>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      rec.priority === 'High'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// Progress Chart Component with React.memo
const ProgressChart = React.memo(() => (
  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
      Weekly Progress
    </h3>
    <div className="flex items-end justify-between h-24 sm:h-32">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className="w-4 sm:w-8 bg-gradient-to-t from-primary-500 to-primary-600 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-primary-700"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
          <span className="text-xs text-gray-600 mt-2">{day}</span>
        </div>
      ))}
    </div>
  </div>
))

// Helper functions for greetings
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening'
  } else {
    return 'Good night'
  }
}

const getMotivationalMessage = () => {
  const messages = [
    "Consistency is the key to mastery. You've got this!",
    'Every concept you learn today builds a stronger tomorrow.',
    'Your progress is inspiring. Keep challenging yourself!',
    'Great things never come from comfort zones. Push forward!',
    'Knowledge is power. Every lesson brings new opportunities.',
    'Stay curious, stay hungry. The learning journey is rewarding!',
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}

// Main StudentDashboard Component
const StudentDashboard = () => {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Access user data
  const userData = user?.user || user

  // Helper function to get user ID
  const getUserId = useCallback(() => {
    if (!user) return null

    if (user.user_id) {
      return user.user_id
    } else if (user.user && user.user.user_id) {
      return user.user.user_id
    }

    return null
  }, [user])

  // Fetch enrolled courses
  const fetchEnrolledCourses = useCallback(async () => {
    const userId = getUserId()

    if (!userId) {
      setError('User not found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        user_id: userId,
        page: 1,
        limit: 3,
        filters: {},
      }

      const response = await coursesAPI.getEnrolled(payload)
      const responseData = response.data

      if (responseData && responseData.success) {
        const coursesData = responseData.courses || []
        setEnrolledCourses(coursesData)
      } else {
        throw new Error('Failed to fetch enrolled courses')
      }
    } catch (err) {
      setError('Failed to load your courses. Please try again.')
      console.error('❌ Error fetching enrolled courses:', err)
    } finally {
      setLoading(false)
    }
  }, [getUserId])

  // Calculate statistics from enrolled courses
  const calculateStats = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) {
      return {
        total_courses: 0,
        active_courses: 0,
        completed_courses: 0,
        average_progress: 0,
        course_trend: '+0',
        active_trend: '+0',
        completion_trend: '+0',
        progress_trend: '+0',
        skills_mastered: 0,
      }
    }

    const total = enrolledCourses.length
    let active = 0
    let completed = 0
    let totalProgress = 0

    enrolledCourses.forEach(course => {
      const progress = course.enrollments?.[0]?.progress || 0
      totalProgress += progress

      if (progress >= 90) {
        completed++
      } else if (progress > 0) {
        active++
      }
    })

    const averageProgress = Math.round(totalProgress / total)

    return {
      total_courses: total,
      active_courses: active,
      completed_courses: completed,
      average_progress: averageProgress,
      course_trend: '+0',
      active_trend: '+0',
      completion_trend: '+0',
      progress_trend: '+0',
      skills_mastered: Math.min(completed * 5, 50),
    }
  }, [enrolledCourses])

  // Mock data for other sections
  const learning_stats = {
    last_active: new Date().toISOString(),
    streak_days: 12,
    total_study_hours: 45,
    assignments_completed: 8,
    skills_mastered: 15,
    total_achievements: 7,
    recent_achievements: ['Fast Learner', 'Consistent Student', 'ABAP Beginner'],
  }

  // Use useMemo for derived data
  const stats = useMemo(
    () => [
      {
        name: 'Total Courses',
        value: calculateStats.total_courses || 0,
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Enrolled courses',
        trend: calculateStats.course_trend || '+0',
      },
      {
        name: 'Active Courses',
        value: calculateStats.active_courses || 0,
        icon: Play,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Currently learning',
        trend: calculateStats.active_trend || '+0',
      },
      {
        name: 'Completed',
        value: calculateStats.completed_courses || 0,
        icon: Award,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Courses finished',
        trend: calculateStats.completion_trend || '+0',
      },
      {
        name: 'Avg Progress',
        value: `${calculateStats.average_progress || 0}%`,
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Overall progress',
        trend: `${calculateStats.progress_trend || '+0'}%`,
      },
    ],
    [calculateStats]
  )

  const learningAchievements = useMemo(
    () => [
      {
        icon: Clock,
        label: 'Study Streak',
        value: `${learning_stats?.streak_days || 0} days`,
        color: 'text-green-600',
        max: 30,
      },
      {
        icon: FileText,
        label: 'Assignments',
        value: `${learning_stats?.assignments_completed || 0} completed`,
        color: 'text-blue-600',
        max: learning_stats?.total_assignments || 10,
      },
      {
        icon: Users,
        label: 'Study Hours',
        value: `${learning_stats?.total_study_hours || 0} hours`,
        color: 'text-purple-600',
        max: 100,
      },
      {
        icon: Brain,
        label: 'Skills Mastered',
        value: `${learning_stats?.skills_mastered || 0} skills`,
        color: 'text-red-600',
        max: 50,
      },
    ],
    [learning_stats]
  )

  // Updated quickActions
  const quickActions = useMemo(
    () => [
      {
        title: 'My Courses',
        description: 'View and manage your courses',
        icon: BookOpen,
        color: 'bg-blue-500',
        href: '/dashboard/courses',
      },
      {
        title: 'Progress',
        description: 'Track your learning progress',
        icon: TrendingUp,
        color: 'bg-green-500',
        href: '/dashboard/progress',
      },
      {
        title: 'Certificates',
        description: 'View your certificates',
        icon: Certificate,
        color: 'bg-purple-500',
        href: '/dashboard/certificates',
      },
      {
        title: 'Practice',
        description: 'Practice exercises & labs',
        icon: Brain,
        color: 'bg-orange-500',
        href: '/practice',
      },
    ],
    []
  )

  // Secondary actions for profile and settings
  const secondaryActions = useMemo(
    () => [
      {
        title: 'Profile',
        description: 'Manage your profile',
        icon: User,
        color: 'bg-indigo-500',
        href: '/dashboard/profile',
      },
      {
        title: 'Settings',
        description: 'Account settings',
        icon: SettingsIcon,
        color: 'bg-gray-600',
        href: '/dashboard/settings',
      },
      {
        title: 'Support',
        description: 'Get help & support',
        icon: HelpCircle,
        color: 'bg-teal-500',
        href: '/dashboard/support',
      },
      {
        title: 'Resources',
        description: 'Study materials',
        icon: FileText,
        color: 'bg-red-500',
        href: '/resources',
      },
    ],
    []
  )

  // Fetch enrolled courses on component mount
  useEffect(() => {
    fetchEnrolledCourses()
  }, [fetchEnrolledCourses])

  // Handle course click for analytics
  const handleCourseClick = useCallback(
    courseId => {
      if (window.gtag) {
        window.gtag('event', 'course_click', {
          course_id: courseId,
          user_id: userData?.user_id || userData?.id,
        })
      }
    },
    [userData]
  )

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse hidden sm:block"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-bounce hidden sm:block"></div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 space-y-2 sm:space-y-0">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mr-3 truncate">
                {getTimeBasedGreeting()}, {userData?.full_name || userData?.name || 'Student'}! 👋
              </h1>
              <div className="flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Keep learning! 📚
                </span>
              </div>
            </div>

            <p className="text-primary-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl">
              {getMotivationalMessage()}
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-4">
              {learningAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-white/20 transition-all duration-300 cursor-pointer group min-w-0"
                >
                  <achievement.icon
                    className={`w-3 h-3 sm:w-4 sm:h-5 ${achievement.color} group-hover:scale-110 transition-transform flex-shrink-0`}
                  />
                  <span className="font-semibold text-xs sm:text-sm truncate">
                    {achievement.value}
                  </span>
                  <span className="text-primary-200 text-xs truncate hidden sm:inline">
                    {achievement.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <QuickStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Courses */}
        <div className="lg:col-span-2">
          <CourseProgress
            enrollments={enrolledCourses}
            onCourseClick={handleCourseClick}
            loading={loading}
          />
        </div>

        {/* Right Sidebar - Learning Goals & Recommendations */}
        <div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            {/* <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center truncate">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600 flex-shrink-0" />
                <span className="truncate">Learning Goals</span>
              </h2>
              <Link
                to="/dashboard/progress"
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200 flex-shrink-0"
              >
                <span className="hidden sm:inline">Details</span>
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div> */}

            <LearningGoals
              enrolledCourses={enrolledCourses}
              stats={{ ...calculateStats, skills_mastered: learning_stats.skills_mastered }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - Primary */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Quick Actions</h2>
          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
            <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="p-3 sm:p-4 md:p-6 rounded-xl border-2 border-dashed border-gray-200 text-center hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 hover:scale-105 group relative min-w-0"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-700 text-xs sm:text-sm md:text-base group-hover:text-primary-600 mb-0.5 sm:mb-1 truncate">
                {action.title}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">{action.description}</p>
              <p className="text-xs text-gray-500 sm:hidden truncate">{action.description}</p>
            </Link>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-base font-medium text-gray-700 mb-3">More Options</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {secondaryActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="p-3 rounded-lg border border-gray-200 text-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className={`w-6 h-6 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <action.icon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-primary-600 truncate">
                    {action.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <ProgressChart />
      </div>
    </div>
  )
}

export default React.memo(StudentDashboard)
