// src/components/course/CourseOutcomes.jsx
import React from 'react'
import { Target, CheckCircle, Briefcase, Award, Users, Globe, Zap, TrendingUp } from 'lucide-react'

const CourseOutcomes = React.memo(({ course }) => {
  // Extract learning objectives from course metadata
  const learningObjectives = course?.metadata?.learning_objectives || []

  // Extract prerequisites from course metadata
  const prerequisites = course?.metadata?.prerequisites || []

  // If no learning objectives available, show placeholder content
  if (!learningObjectives || learningObjectives.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Learning Outcomes</h3>
          <p className="text-sm text-gray-600">
            By completing this course, you'll gain practical skills and knowledge to excel in your
            career.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Career Growth</h4>
            </div>
            <ul className="space-y-2">
              {[
                'Industry-relevant skills',
                'Portfolio projects',
                'Career guidance',
                'Interview preparation',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900">Certification</h4>
            </div>
            <ul className="space-y-2">
              {[
                'Industry-recognized certificate',
                'Digital badge',
                'LinkedIn verification',
                'Completion certificate',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Learning Objectives Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">What You'll Learn</h3>
            <p className="text-sm text-gray-600">
              Master key skills and concepts through hands-on learning
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {learningObjectives.map((objective, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:border-primary-200 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
              </div>
              <span className="text-gray-700">{objective}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prerequisites Section */}
      {prerequisites.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Prerequisites</h3>
              <p className="text-sm text-gray-600">
                What you need to know before starting this course
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {prerequisites.map((prerequisite, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-accent-50 to-white border border-accent-100 rounded-xl"
              >
                <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                <span className="text-gray-700">{prerequisite}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Career Benefits</h4>
          </div>
          <p className="text-sm text-gray-600">
            Gain in-demand skills that employers are looking for and boost your career prospects.
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-medium text-gray-900">Community Access</h4>
          </div>
          <p className="text-sm text-gray-600">
            Join a community of learners, network with peers, and get support from mentors.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Certification</h4>
          </div>
          <p className="text-sm text-gray-600">
            Earn a certificate of completion to showcase your new skills to employers.
          </p>
        </div>
      </div>

      {/* Course Level & Mode Info */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Course Details</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Course Level</p>
              <p className="font-medium text-gray-900 capitalize">{course?.level || 'Beginner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Learning Mode</p>
              <p className="font-medium text-gray-900 capitalize">
                {course?.mode?.replace('_', ' ') || 'Online Live'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Add display name for debugging
CourseOutcomes.displayName = 'CourseOutcomes'

export default CourseOutcomes
