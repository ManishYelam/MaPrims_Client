// src/components/course/InstructorProfile.jsx
import React from 'react'
import {
  User,
  Star,
  BookOpen,
  Users,
  Briefcase,
  Award,
  MessageCircle,
  Globe,
  Mail,
  Linkedin,
} from 'lucide-react'

const InstructorProfile = React.memo(({ course, instructor }) => {
  // Use provided instructor data, or placeholder if not available
  const instructorData = instructor || {
    full_name: 'Expert Instructor',
    title: `${course?.title?.split(' ')[0] || 'Subject'} Expert & Corporate Trainer`,
    rating: 4.9,
    reviews: 1000,
    experience: 10,
    students_trained: 1000,
    corporate_clients: 50,
    bio: 'Industry expert with extensive experience in delivering high-quality training programs. Passionate about helping students build successful careers through practical, hands-on learning.',
    email: 'instructor@example.com',
    linkedin: 'https://linkedin.com/in/instructor',
    website: 'https://instructor-website.com',
    certifications: [
      'Certified Professional Trainer',
      'Industry Certification',
      'Advanced Specialization',
    ],
  }

  // Format the display name
  const displayName = instructorData.full_name || course?.instructor_name || 'Course Instructor'
  const displayInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Instructor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            {displayInitial}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-600">{instructorData.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium text-gray-700 text-sm">{instructorData.rating}/5</span>
              <span className="text-xs text-gray-500">
                ({instructorData.reviews.toLocaleString()}+ reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="sm:ml-auto flex gap-2">
          {instructorData.email && (
            <a
              href={`mailto:${instructorData.email}`}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              title="Email"
            >
              <Mail className="w-4 h-4 text-gray-600" />
            </a>
          )}
          {instructorData.linkedin && (
            <a
              href={instructorData.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-blue-600" />
            </a>
          )}
          {instructorData.website && (
            <a
              href={instructorData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors"
              title="Website"
            >
              <Globe className="w-4 h-4 text-purple-600" />
            </a>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{instructorData.experience}+</div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Briefcase className="w-3 h-3" />
            Years Experience
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-lg">
          <div className="text-lg font-bold text-emerald-600">
            {instructorData.students_trained.toLocaleString()}+
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            Students Trained
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-lg">
          <div className="text-lg font-bold text-orange-600">
            {instructorData.corporate_clients}+
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            Corporate Clients
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {instructorData.certifications?.length || 5}+
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Award className="w-3 h-3" />
            Certifications
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-3">About the Instructor</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{instructorData.bio}</p>
      </div>

      {/* Certifications */}
      {instructorData.certifications && instructorData.certifications.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Certifications & Credentials
          </h4>
          <div className="flex flex-wrap gap-2">
            {instructorData.certifications.map((cert, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-full text-xs text-gray-700"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Philosophy */}
      <div className="bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-xl p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">Teaching Philosophy</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          "I believe in hands-on, project-based learning. My teaching approach focuses on real-world
          applications, ensuring that students not only understand theoretical concepts but also
          gain practical skills that they can immediately apply in their careers. I'm passionate
          about mentoring and guiding students to achieve their professional goals."
        </p>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-accent-50 to-white border border-accent-100 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <MessageCircle className="w-5 h-5 text-accent-600" />
          <h4 className="text-base font-semibold text-gray-900">
            Have questions for the instructor?
          </h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Join the course to access direct Q&A sessions, get personalized feedback, and interact
          with the instructor.
        </p>
        <button
          onClick={() => {
            // This could open a modal or navigate to contact page
            if (instructorData.email) {
              window.location.href = `mailto:${instructorData.email}`
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Mail className="w-4 h-4" />
          Send Message
        </button>
      </div>
    </div>
  )
})

// Add display name for debugging
InstructorProfile.displayName = 'InstructorProfile'

export default InstructorProfile
