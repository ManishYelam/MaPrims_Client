import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Users,
  Clock,
  Star,
  Heart,
  Share2,
  Download,
  Sparkles,
  BookOpen,
  TrendingUp,
  Zap,
  Globe,
  Video,
  SlidersHorizontal,
  Loader2,
  Check,
  AlertCircle,
  FileText,
  PlayCircle,
} from 'lucide-react'

const iconMap = {
  BookOpen,
  TrendingUp,
  Zap,
  Globe,
  Video,
  SlidersHorizontal,
}

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop'

const CourseHero = React.memo(
  ({
    course,
    stats,
    levelInfo,
    modeInfo,
    discountPercentage,
    formatPrice,
    isWishlisted,
    onNavigateBack,
    onEnroll,
    onToggleWishlist,
    onShare,
    onDownloadSyllabus,
    isAuthenticated,
    isLoading = false,
    enrollmentStatus,
    showCountdown = false,
    countdownEndDate,
  }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [downloadingSyllabus, setDownloadingSyllabus] = useState(false)

    // Memoize thumbnail URL to prevent unnecessary recalculations
    const thumbnailUrl = useMemo(() => {
      if (imageError) return DEFAULT_THUMBNAIL

      if (!course?.thumbnail_image) {
        return DEFAULT_THUMBNAIL
      }

      if (course.thumbnail_image.startsWith('http')) {
        return course.thumbnail_image
      }

      if (course.thumbnail_image.startsWith('/')) {
        const baseUrl = import.meta.env.VITE_API_URL || ''
        return `${baseUrl}${course.thumbnail_image}`
      }

      return `/images/courses/${course.thumbnail_image}`
    }, [course?.thumbnail_image, imageError])

    // Memoize level and mode icons
    const LevelIcon = useMemo(() => iconMap[levelInfo?.icon] || BookOpen, [levelInfo?.icon])
    const ModeIcon = useMemo(() => iconMap[modeInfo?.icon] || Video, [modeInfo?.icon])

    // Check if user is enrolled (based on actual API status values)
    const isEnrolled = useMemo(() => {
      // API returns 'active' for enrolled users, not 'enrolled'
      return (
        enrollmentStatus === 'active' ||
        enrollmentStatus === 'enrolled' ||
        enrollmentStatus === 'completed'
      )
    }, [enrollmentStatus])

    // Get enrollment button text and status
    const getEnrollmentStatus = () => {
      if (isEnrolled) {
        return {
          text: 'Start Learning',
          variant: 'success',
          icon: PlayCircle,
          action: 'start',
        }
      }
      if (enrollmentStatus === 'pending') {
        return {
          text: 'Payment Pending',
          variant: 'warning',
          action: 'pending',
        }
      }
      if (!course?.is_active) {
        return {
          text: 'Coming Soon',
          variant: 'disabled',
          action: 'disabled',
        }
      }
      if (course?.seats_available === 0) {
        return {
          text: 'Sold Out',
          variant: 'disabled',
          action: 'disabled',
        }
      }
      return {
        text: 'Enroll Now',
        variant: 'primary',
        action: 'enroll',
      }
    }

    const enrollmentInfo = getEnrollmentStatus()
    const StartIcon = enrollmentInfo.icon || PlayCircle

    // Handle enroll click with feedback
    const handleEnrollClick = async () => {
      if (isEnrolled) {
        // Navigate to learning page with course ID
        window.location.href = `/dashboard/learning/course/${course.course_id || course.id}`
        return
      }

      if (onEnroll) {
        const success = await onEnroll()
        if (success) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }
      }
    }

    // Format duration for display
    const formatDuration = duration => {
      if (!duration) return 'Flexible'
      if (typeof duration === 'number') {
        return `${duration} ${duration === 1 ? 'week' : 'weeks'}`
      }
      return duration
    }

    // Handle wishlist click with feedback
    const handleWishlistClick = async () => {
      if (onToggleWishlist) {
        const success = await onToggleWishlist()
        // Could add toast notification here
      }
    }

    // Handle syllabus download
    const handleSyllabusDownload = async () => {
      if (!onDownloadSyllabus) return

      setDownloadingSyllabus(true)
      try {
        await onDownloadSyllabus()
      } catch (error) {
        console.error('Failed to download syllabus:', error)
        // Could show error toast here
      } finally {
        setDownloadingSyllabus(false)
      }
    }

    // Get syllabus download text
    const getSyllabusButtonText = () => {
      if (downloadingSyllabus) return 'Downloading...'
      if (course?.syllabus_url || course?.syllabus_file) return 'Syllabus'
      return 'View Syllabus'
    }

    // Check if syllabus is available
    const hasSyllabus = course?.syllabus_url || course?.syllabus_file || course?.metadata?.syllabus

    return (
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background Gradient Layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-primary-900/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full translate-y-48 -translate-x-48 blur-3xl"></div>
        </div>

        {/* Thumbnail Background */}
        {!imageError && (
          <div className="absolute inset-0 z-0 transition-opacity duration-500">
            <img
              src={thumbnailUrl}
              alt={course?.title || 'Course thumbnail'}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-15' : 'opacity-0'
              }`}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/95 via-primary-700/95 to-primary-800/95"></div>
          </div>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 z-10">
          {/* Header Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <button
              onClick={onNavigateBack}
              className="group flex items-center gap-2 text-white/90 hover:text-white transition-all bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/15 text-sm font-medium hover:shadow-lg hover:-translate-x-1"
              aria-label="Back to courses"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Courses</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {course?.featured && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
              {levelInfo && (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm shadow-sm ${levelInfo.color}`}
                >
                  {LevelIcon && <LevelIcon className="w-3 h-3" />}
                  {levelInfo.label}
                </span>
              )}
              {course?.certificate && (
                <span className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  Certificate
                </span>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Course Info */}
            <div className="space-y-6">
              {/* Title and Badge */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                    {course?.title || 'Course Title'}
                  </h1>
                  {course?.best_seller && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Bestseller
                    </span>
                  )}
                </div>

                {/* Instructor Info */}
                {course?.instructor && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {course.instructor.name?.charAt(0) || 'I'}
                      </span>
                    </div>
                    <span className="text-white/80 text-sm">
                      By {course.instructor.name}
                      {course.instructor.title && `, ${course.instructor.title}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-white/85 text-base lg:text-lg leading-relaxed">
                {course?.short_description || course?.description || 'No description available'}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 lg:gap-6 py-2">
                <div className="flex items-center gap-2 text-white/90 group">
                  <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{stats?.enrolled || 0}+</div>
                    <div className="text-xs text-white/70">Enrolled</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/90 group">
                  <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{formatDuration(course?.duration)}</div>
                    <div className="text-xs text-white/70">Duration</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/90 group">
                  <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors">
                    <Star className="w-4 h-4 text-yellow-300 fill-current" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{stats?.rating || '4.5'}/5</div>
                    <div className="text-xs text-white/70">Rating</div>
                  </div>
                </div>

                {course?.lessons_count && (
                  <div className="flex items-center gap-2 text-white/90 group">
                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{course.lessons_count}</div>
                      <div className="text-xs text-white/70">Lessons</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags and Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {modeInfo && (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${modeInfo.bgColor} ${modeInfo.color}`}
                  >
                    {ModeIcon && <ModeIcon className="w-4 h-4" />}
                    {modeInfo.label}
                  </span>
                )}

                {course?.seats_available !== undefined && (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      course.seats_available < 10
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>{course.seats_available} Seats Left</span>
                    {course.seats_available < 10 && course.seats_available > 0 && (
                      <span className="ml-1 animate-pulse">⚠️</span>
                    )}
                  </span>
                )}

                {course?.language && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    <Globe className="w-4 h-4" />
                    {course.language}
                  </span>
                )}

                {hasSyllabus && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <FileText className="w-4 h-4" />
                    Syllabus Available
                  </span>
                )}
              </div>
            </div>

            {/* Right Column - Pricing & Actions */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 lg:p-8">
              {/* Price Section - Hide for enrolled users */}
              {!isEnrolled && (
                <div className="mb-6">
                  {discountPercentage > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl lg:text-4xl font-bold text-white">
                            {formatPrice(course?.fee || 0)}
                          </span>
                          <span className="text-sm text-white/70 ml-2">inc. tax</span>
                        </div>
                        <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                          {discountPercentage}% OFF
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base text-white/70 line-through">
                          {formatPrice(course?.original_fee || 0)}
                        </span>
                        <span className="text-sm font-medium text-green-300 bg-green-900/30 px-2 py-1 rounded">
                          Save{' '}
                          {formatPrice(
                            parseFloat(course?.original_fee || 0) - parseFloat(course?.fee || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {parseFloat(course?.fee || 0) === 0
                          ? 'Free Forever'
                          : formatPrice(course?.fee || 0)}
                      </div>
                      {parseFloat(course?.fee || 0) > 0 && (
                        <span className="text-sm text-white/70">inc. tax</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Countdown Timer - Hide for enrolled users */}
              {showCountdown && countdownEndDate && !isEnrolled && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-white text-sm font-medium">🕒 Offer ends in</div>
                    <div className="text-white font-bold">{countdownEndDate}</div>
                  </div>
                </div>
              )}

              {/* Enrollment Status Message for enrolled users */}
              {isEnrolled && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-300" />
                    <div>
                      <div className="text-white font-medium">You're enrolled in this course!</div>
                      <div className="text-white/70 text-sm">Start your learning journey now</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enrollment Button */}
              <button
                onClick={handleEnrollClick}
                disabled={
                  enrollmentInfo.action === 'disabled' ||
                  isLoading ||
                  (enrollmentInfo.action === 'enroll' &&
                    (!course?.is_active || course?.seats_available === 0))
                }
                className={`w-full py-4 rounded-xl font-bold text-base mb-4 transition-all duration-300 relative overflow-hidden group ${
                  enrollmentInfo.variant === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 hover:shadow-2xl hover:scale-[1.02] active:scale-95'
                    : enrollmentInfo.variant === 'warning'
                      ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-2xl'
                      : enrollmentInfo.variant === 'disabled'
                        ? 'bg-gray-400/30 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-white to-gray-100 text-primary-600 hover:shadow-2xl hover:scale-[1.02] active:scale-95'
                } ${showSuccess ? 'bg-emerald-500' : ''}`}
              >
                <span
                  className={`flex items-center justify-center gap-2 transition-all ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {enrollmentInfo.text}
                  {enrollmentInfo.variant === 'success' && <StartIcon className="w-5 h-5" />}
                  {enrollmentInfo.variant === 'primary' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </span>

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}

                {showSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500">
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Enrollment Successful!
                    </span>
                  </div>
                )}
              </button>

              {/* Guarantee Badge - Hide for enrolled users */}
              {course?.money_back_guarantee && !isEnrolled && (
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1 text-sm text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
                    <Check className="w-4 h-4 text-green-400" />
                    30-Day Money-Back Guarantee
                  </span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleWishlistClick}
                  disabled={!isAuthenticated && !onToggleWishlist}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    isWishlisted
                      ? 'bg-red-500/30 border-red-400/50 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-red-500/20 disabled:hover:bg-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    className={`w-5 h-5 mb-1 ${isWishlisted ? 'fill-current animate-pulse' : ''}`}
                  />
                  <span className="text-xs font-medium">{isWishlisted ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={onShare}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-blue-500/20 transition-all group"
                  aria-label="Share course"
                >
                  <Share2 className="w-5 h-5 mb-1 group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-medium">Share</span>
                </button>

                {/* Syllabus Download Button - NEVER DISABLED */}
                <button
                  onClick={handleSyllabusDownload}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    downloadingSyllabus
                      ? 'bg-emerald-500/40 border-emerald-400/50 text-white'
                      : hasSyllabus
                        ? 'bg-white/10 border-white/20 text-white hover:bg-emerald-500/20'
                        : 'bg-white/10 border-white/20 text-white/70 hover:bg-emerald-500/20 hover:text-white'
                  }`}
                  aria-label="Download syllabus"
                >
                  {downloadingSyllabus ? (
                    <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mb-1" />
                  )}
                  <span className="text-xs font-medium">{getSyllabusButtonText()}</span>
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Access on mobile and desktop</span>
                  </li>
                  {course?.certificate && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Certificate of completion</span>
                    </li>
                  )}
                  {hasSyllabus && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Detailed syllabus available</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Successfully enrolled!</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

// Display name for debugging
CourseHero.displayName = 'CourseHero'

export default CourseHero
