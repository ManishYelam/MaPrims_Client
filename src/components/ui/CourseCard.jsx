import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  Users,
  Star,
  BookOpen,
  Zap,
  TrendingUp,
  Award,
  CheckCircle,
  PlayCircle,
  BarChart3,
  Heart,
  Share2,
  Eye,
  Download,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Lazy loaded components
const AuthModal = React.lazy(() => import('./AuthModal'))
const EnrollmentFlow = React.lazy(() => import('../enrollment/EnrollmentFlow'))

// High-quality professional images for different course categories
const sampleImages = {
  beginner: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
  intermediate: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=200&fit=crop',
  advanced: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
  abap: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop',
  hana: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
  workflow: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  fiori: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
  default: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=200&fit=crop',
}

// Level configurations with colors and icons
const levelConfig = {
  beginner: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: BookOpen,
    label: 'Beginner',
  },
  intermediate: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TrendingUp,
    label: 'Intermediate',
  },
  advanced: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Zap,
    label: 'Advanced',
  },
}

// Mode configurations
const modeConfig = {
  online_live: {
    label: 'Live Online',
    color: 'text-orange-600',
  },
  online_self_paced: {
    label: 'Self Paced',
    color: 'text-green-600',
  },
  hybrid: {
    label: 'Hybrid',
    color: 'text-blue-600',
  },
}

const getCourseImage = course => {
  if (course.thumbnail_image && course.thumbnail_image.startsWith('http')) {
    return course.thumbnail_image
  }

  if (course.thumbnail_image && course.thumbnail_image.startsWith('/')) {
    return course.thumbnail_image
  }

  const title = course.title?.toLowerCase() || ''
  const level = course.level || 'default'

  if (title.includes('hana')) {
    return sampleImages.hana
  } else if (title.includes('workflow') || title.includes('brf')) {
    return sampleImages.workflow
  } else if (title.includes('fiori') || title.includes('web dynpro')) {
    return sampleImages.fiori
  } else if (title.includes('abap')) {
    return sampleImages.abap
  } else {
    return sampleImages[level] || sampleImages.default
  }
}

const CourseCard = ({
  course,
  viewMode = 'grid',
  showActions = true,
  className = '',
  isEnrolled = false,
  enrollmentStatus = null,
  enrollmentProgress = 0,
  showMyCourses = false,
}) => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showEnrollment, setShowEnrollment] = useState(false)

  const discountPercentage = useMemo(() => {
    if (course.original_fee && course.original_fee > course.fee) {
      return Math.round(((course.original_fee - course.fee) / course.original_fee) * 100)
    }
    return 0
  }, [course.original_fee, course.fee])

  const courseImage = useMemo(() => getCourseImage(course), [course])
  const levelInfo = levelConfig[course.level] || levelConfig.beginner
  const modeInfo = modeConfig[course.mode] || modeConfig.online_live
  const LevelIcon = levelInfo.icon

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = e => {
    const level = course.level || 'default'
    e.target.src = sampleImages[level] || sampleImages.default
    setImageLoaded(true)
  }

  const toggleWishlist = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
  }

  const handleShare = e => {
    e.preventDefault()
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: course.title,
        text: course.short_description,
        url: `/courses/${course.course_id}`,
      })
    }
  }

  const handleDownloadSyllabus = e => {
    e.preventDefault()
    e.stopPropagation()

    // Check if syllabus URL exists
    const syllabusUrl = course.syllabus_url || course.metadata?.syllabus_pdf

    if (syllabusUrl) {
      // Create an invisible anchor element to trigger download
      const link = document.createElement('a')
      link.href = syllabusUrl

      // Extract filename from URL or use default
      const filename = syllabusUrl.split('/').pop() || 'syllabus.pdf'
      link.download = filename

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Fallback: Show a modal or message that syllabus is not available
      alert('Syllabus is not available for this course yet.')
    }
  }

  const handleEnrollClick = e => {
    e.preventDefault()
    e.stopPropagation()

    // If already enrolled, navigate to learning page
    if (isEnrolled) {
      navigate(`/dashboard/learning/course/${course.course_id || course.id}`)
      return
    }

    if (!isAuthenticated) {
      localStorage.setItem('pendingEnrollment', course.course_id || course.id)
      setShowAuthModal(true)
      return
    }

    setShowEnrollment(true)
  }

  const handleViewDetails = e => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to course detail page using course_id
    navigate(`/courses/${course.course_id}`, { state: { course } })
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setShowEnrollment(true)
  }

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getEnrollmentStatus = () => {
    if (course.seats_available === 0) return 'sold-out'
    if (course.seats_available && course.seats_available < 10) return 'limited'
    return 'available'
  }

  const enrollmentAvailabilityStatus = getEnrollmentStatus()

  // Grid View - Compact Design
  if (viewMode === 'grid') {
    return (
      <>
        <div
          className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-0.5 ${className}`}
        >
          {/* Image Section - More Compact */}
          <div className="relative overflow-hidden">
            <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-300 w-full h-full" />
                </div>
              )}
              <img
                src={courseImage}
                alt={course.title}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/10" />

              {/* Top Badges - Smaller */}
              <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                {course.featured && (
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Featured
                  </div>
                )}
                {enrollmentAvailabilityStatus === 'limited' && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm">
                    Limited
                  </div>
                )}
                {enrollmentAvailabilityStatus === 'sold-out' && (
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm">
                    Sold Out
                  </div>
                )}
              </div>

              {/* Right Side Badges - Smaller */}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                {discountPercentage > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>

              {/* Action Buttons Overlay - Smaller */}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={toggleWishlist}
                  className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    isWishlisted
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm hover:bg-white hover:text-blue-600 transition-all duration-200"
                >
                  <Share2 className="w-3 h-3" />
                </button>
                {
                  <a
                    href={course.syllabus_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm hover:bg-white hover:text-green-600 transition-all duration-200"
                    title="Download Syllabus"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                }
              </div>

              {/* Bottom Info Overlay - Smaller */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-white text-xs">
                  <Eye className="w-3 h-3" />
                  <span>{course.view_count || 0}</span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm border ${levelInfo.color}`}
                >
                  <LevelIcon className="w-2.5 h-2.5 inline mr-0.5" />
                  {levelInfo.label}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - More Compact */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Course Mode - Smaller */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${modeInfo.color} flex items-center gap-1`}>
                <PlayCircle className="w-3 h-3" />
                {modeInfo.label}
              </span>
              {course.metadata?.modules && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {course.metadata.modules.length}
                </span>
              )}
            </div>

            {/* Course Title - Smaller but still prominent */}
            <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200 leading-tight">
              {course.title}
            </h3>

            {/* Course Description - Smaller */}
            <p className="text-gray-600 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">
              {course.short_description || course.description}
            </p>

            {/* Meta Information - Smaller */}
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{course.duration}</span>
                </div>
                {course.seats_available !== undefined && course.seats_available > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{course.seats_available}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Section - More Compact */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {course.original_fee && course.original_fee > course.fee && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(course.original_fee)}
                  </span>
                )}
                <span className="text-base font-bold text-gray-900">{formatPrice(course.fee)}</span>
              </div>
              {discountPercentage > 0 && (
                <span className="text-xs font-semibold text-green-600">
                  Save {formatPrice(course.original_fee - course.fee)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-1.5 mt-auto">
                <button
                  onClick={handleViewDetails}
                  className="btn-primary flex-1 text-center group/btn flex items-center justify-center gap-1.5 text-xs py-1.5 hover:bg-primary-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Details
                </button>
                <button
                  onClick={handleEnrollClick}
                  className={`btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 ${
                    enrollmentAvailabilityStatus === 'sold-out'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={enrollmentAvailabilityStatus === 'sold-out'}
                >
                  {enrollmentAvailabilityStatus === 'sold-out' ? (
                    <>
                      <Award className="w-3 h-3" />
                      Sold Out
                    </>
                  ) : isEnrolled ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Continue
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Enroll
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Auth Modal */}
        {showAuthModal && (
          <React.Suspense fallback={<div>Loading...</div>}>
            <AuthModal
              course={course}
              onClose={() => setShowAuthModal(false)}
              onSuccess={handleAuthSuccess}
            />
          </React.Suspense>
        )}

        {/* Enrollment Flow */}
        {showEnrollment && isAuthenticated && (
          <React.Suspense fallback={<div>Loading...</div>}>
            <EnrollmentFlow course={course} onClose={() => setShowEnrollment(false)} />
          </React.Suspense>
        )}
      </>
    )
  }

  // List View - Compact Design
  return (
    <>
      <div className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Thumbnail - More Compact */}
          <div className="md:w-48 flex-shrink-0 relative">
            <div className="relative w-full h-32 md:h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-300 w-full h-full" />
                </div>
              )}
              <img
                src={courseImage}
                alt={course.title}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Badges - Smaller */}
              <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                {course.featured && (
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    Featured
                  </div>
                )}
                {discountPercentage > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content - More Compact */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${levelInfo.color}`}
                  >
                    <LevelIcon className="w-2.5 h-2.5 inline mr-0.5" />
                    {levelInfo.label}
                  </div>
                  <span className={`text-xs font-medium ${modeInfo.color}`}>{modeInfo.label}</span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors duration-200 leading-tight">
                  {course.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
                  {course.short_description || course.description}
                </p>
              </div>

              <div className="mt-1 lg:mt-0 lg:text-right lg:pl-4 lg:min-w-[140px]">
                <div className="flex items-center gap-1.5 mb-1 justify-end">
                  {course.original_fee && course.original_fee > course.fee && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(course.original_fee)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-gray-900">{formatPrice(course.fee)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="text-xs font-semibold text-green-600 mb-1.5">
                    Save {formatPrice(course.original_fee - course.fee)}
                  </div>
                )}
                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>

            {/* Meta Information - Smaller */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
              {course.metadata?.modules && (
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  <span>{course.metadata.modules.length} Modules</span>
                </div>
              )}
              {course.seats_available && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span
                    className={
                      enrollmentAvailabilityStatus === 'limited'
                        ? 'text-orange-600 font-semibold'
                        : ''
                    }
                  >
                    {course.seats_available} seats{' '}
                    {enrollmentAvailabilityStatus === 'limited' && 'left'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{course.view_count || 0} views</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleViewDetails}
                  className="btn-primary text-center max-w-[120px] flex items-center justify-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <ExternalLink className="w-3 h-3" />
                  Details
                </button>
                <button
                  onClick={handleEnrollClick}
                  className={`btn-secondary max-w-[140px] flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 ${
                    enrollmentAvailabilityStatus === 'sold-out'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={enrollmentAvailabilityStatus === 'sold-out'}
                >
                  {enrollmentAvailabilityStatus === 'sold-out' ? (
                    <>
                      <Award className="w-3 h-3" />
                      Sold Out
                    </>
                  ) : isEnrolled ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Continue
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Enroll Now
                    </>
                  )}
                </button>

                {/* Additional Actions - Smaller */}
                <div className="flex gap-1.5 ml-auto">
                  <button
                    onClick={toggleWishlist}
                    className={`p-1.5 rounded-lg border transition-all duration-200 ${
                      isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleDownloadSyllabus}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200"
                    title="Download Syllabus"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <AuthModal
            course={course}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        </React.Suspense>
      )}

      {/* Enrollment Flow */}
      {showEnrollment && isAuthenticated && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <EnrollmentFlow course={course} onClose={() => setShowEnrollment(false)} />
        </React.Suspense>
      )}
    </>
  )
}

export default CourseCard
