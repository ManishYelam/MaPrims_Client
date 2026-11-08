// src/components/course/CourseSidebar.jsx
import React, { useState, useMemo } from 'react'
import {
  MessageSquare,
  Phone,
  BookOpen,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Globe,
  Video,
  SlidersHorizontal,
  Check,
  Calendar,
  Award,
  Download,
  Star,
  Heart,
  Share2,
  AlertCircle,
  ChevronRight,
  MapPin,
  Languages,
  FileText,
  BarChart3,
  Target,
  Zap,
  Bookmark,
  Loader2,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const iconMap = {
  Globe,
  Video,
  SlidersHorizontal,
}

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop'

const CourseSidebar = React.memo(
  ({
    course,
    modeInfo,
    levelInfo,
    formatPrice,
    discountPercentage,
    stats,
    onWhatsAppClick,
    onEnroll,
    onShare,
    onDownloadSyllabus,
    onToggleWishlist,
    isAuthenticated,
    isWishlisted = false,
    enrollmentStatus,
    isLoading = false,
    showEnrollment = true,
    relatedCourses = [],
    instructor,
    isEnrolled = false,
  }) => {
    const navigate = useNavigate()
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [showAllDetails, setShowAllDetails] = useState(false)
    const [isWishlistLoading, setIsWishlistLoading] = useState(false)
    const [isShareLoading, setIsShareLoading] = useState(false)
    const [isSyllabusLoading, setIsSyllabusLoading] = useState(false)

    // Memoize thumbnail URL
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

    const ModeIcon = useMemo(() => iconMap[modeInfo?.icon] || Video, [modeInfo?.icon])

    // Format duration
    const formatDuration = duration => {
      if (!duration) return 'Flexible'
      if (typeof duration === 'number') {
        return `${duration} ${duration === 1 ? 'week' : 'weeks'}`
      }
      return duration
    }

    // Get enrollment button text
    const getEnrollmentButtonText = () => {
      if (isEnrolled) return 'Go to Course Dashboard'
      if (enrollmentStatus === 'pending') return 'Payment Pending'
      if (!course?.is_active) return 'Coming Soon'
      if (course?.seats_available === 0) return 'Sold Out'
      return 'Enroll Now'
    }

    const enrollmentButtonText = getEnrollmentButtonText()
    const isEnrollmentDisabled =
      !course?.is_active ||
      course?.seats_available === 0 ||
      enrollmentStatus === 'pending' ||
      isEnrolled

    // Handle wishlist toggle
    const handleWishlistToggle = async e => {
      e?.stopPropagation()
      if (isWishlistLoading) return

      if (!isAuthenticated) {
        navigate('/login', {
          state: { from: `/courses/${course?.course_id}` },
        })
        return
      }

      setIsWishlistLoading(true)
      try {
        if (onToggleWishlist) {
          await onToggleWishlist()
        } else {
          // console.log('Toggle wishlist clicked')
          // Show toast or feedback
          const event = new CustomEvent('show-toast', {
            detail: {
              message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
              type: 'success',
            },
          })
          window.dispatchEvent(event)
        }
      } catch (error) {
        console.error('Error toggling wishlist:', error)
      } finally {
        setIsWishlistLoading(false)
      }
    }

    // Handle share
    const handleShare = async e => {
      e?.stopPropagation()
      if (isShareLoading) return

      setIsShareLoading(true)

      try {
        if (onShare) {
          await onShare()
          return
        }

        // Default share implementation
        const shareData = {
          title: course?.title || 'Check out this course',
          text: `Check out "${course?.title}" on Shirsat Tech Hub`,
          url: window.location.href,
        }

        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData)
        } else {
          // Copy to clipboard as fallback
          await navigator.clipboard.writeText(window.location.href)

          // Show success toast
          const event = new CustomEvent('show-toast', {
            detail: {
              message: 'Link copied to clipboard!',
              type: 'success',
            },
          })
          window.dispatchEvent(event)
        }
      } catch (error) {
        console.error('Error sharing:', error)
        if (error.name !== 'AbortError') {
          // Show error toast
          const event = new CustomEvent('show-toast', {
            detail: {
              message: 'Failed to share. Please try again.',
              type: 'error',
            },
          })
          window.dispatchEvent(event)
        }
      } finally {
        setIsShareLoading(false)
      }
    }

    // Handle syllabus download
    const handleDownloadSyllabus = async e => {
      e?.stopPropagation()
      if (isSyllabusLoading) return

      setIsSyllabusLoading(true)

      try {
        if (onDownloadSyllabus) {
          await onDownloadSyllabus()
          return
        }

        // Default syllabus download implementation
        const syllabusUrl = course?.syllabus_url || course?.syllabus_pdf

        if (syllabusUrl) {
          window.open(syllabusUrl, '_blank')
        } else {
          // Create a simple syllabus download
          const courseInfo = `
            Course Syllabus: ${course?.title || 'Course'}
            ============================================
            
            Course Details:
            - Title: ${course?.title}
            - Description: ${course?.description?.substring(0, 300) || 'No description available'}
            - Duration: ${formatDuration(course?.duration)}
            - Level: ${levelInfo?.label || 'Beginner'}
            - Mode: ${modeInfo?.label || 'Online'}
            
            Modules: ${course?.metadata?.modules?.length || 0}
            ${course?.metadata?.modules?.map((m, i) => `${i + 1}. ${m.title || m.name}`).join('\n') || 'No modules defined'}
            
            Price: ${formatPrice(course?.fee || 0)}
            ${discountPercentage > 0 ? `Discount: ${discountPercentage}% OFF` : ''}
            
            Contact: support@shirsattechhub.com
          `

          const blob = new Blob([courseInfo], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${course?.title?.replace(/\s+/g, '_') || 'course'}_syllabus.txt`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          // Show success toast
          const event = new CustomEvent('show-toast', {
            detail: {
              message: 'Syllabus downloaded successfully!',
              type: 'success',
            },
          })
          window.dispatchEvent(event)
        }
      } catch (error) {
        console.error('Error downloading syllabus:', error)
        const event = new CustomEvent('show-toast', {
          detail: {
            message: 'Failed to download syllabus. Please try again.',
            type: 'error',
          },
        })
        window.dispatchEvent(event)
      } finally {
        setIsSyllabusLoading(false)
      }
    }

    // Handle WhatsApp click
    const handleWhatsAppClick = e => {
      e?.stopPropagation()
      if (onWhatsAppClick) {
        onWhatsAppClick()
        return
      }

      const message = `Hi, I'm interested in the course: "${course?.title}"`
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }

    // Handle Go to Dashboard
    const handleGoToDashboard = () => {
      navigate(`/learn/${course?.course_id}`)
    }

    // Detailed course information
    const courseDetails = [
      {
        icon: BookOpen,
        label: 'Skill Level',
        value: levelInfo?.label || 'Beginner',
        color: 'text-primary-600',
      },
      {
        icon: Clock,
        label: 'Duration',
        value: formatDuration(course?.duration),
        color: 'text-amber-600',
      },
      {
        icon: ModeIcon,
        label: 'Learning Mode',
        value: modeInfo?.label || 'Self-paced',
        color: 'text-emerald-600',
      },
      {
        icon: Users,
        label: 'Available Seats',
        value: course?.seats_available || 0,
        color: course?.seats_available < 10 ? 'text-red-600' : 'text-gray-700',
        highlight: course?.seats_available < 10,
      },
      {
        icon: Calendar,
        label: 'Start Date',
        value: course?.start_date || 'Flexible',
        color: 'text-blue-600',
      },
      {
        icon: BarChart3,
        label: 'Modules',
        value: course?.metadata?.modules?.length || 0,
        color: 'text-purple-600',
      },
      {
        icon: Clock,
        label: 'Hours of Content',
        value: course?.total_hours || 'Flexible',
        color: 'text-indigo-600',
      },
      {
        icon: Languages,
        label: 'Language',
        value: course?.language || 'English',
        color: 'text-cyan-600',
      },
      {
        icon: Award,
        label: 'Certificate',
        value: course?.certificate ? 'Included' : 'Not Included',
        color: course?.certificate ? 'text-emerald-600' : 'text-gray-500',
      },
      {
        icon: Target,
        label: 'Prerequisites',
        value: course?.prerequisites || 'None',
        color: 'text-orange-600',
      },
      { icon: Globe, label: 'Access', value: 'Lifetime', color: 'text-green-600' },
      { icon: Zap, label: 'Level', value: course?.level || 'Beginner', color: 'text-pink-600' },
    ]

    // Filter details based on showAll state
    const visibleDetails = showAllDetails ? courseDetails : courseDetails.slice(0, 6)

    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Sticky Wrapper for Desktop */}
        <div className="lg:sticky lg:top-24 space-y-4 lg:space-y-6">
          {/* Course Thumbnail with Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all hover:shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-primary-50 to-accent-50 relative overflow-hidden group">
              <img
                src={thumbnailUrl}
                alt={course?.title || 'Course thumbnail'}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                {course?.featured && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    FEATURED
                  </span>
                )}

                {discountPercentage > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnail Actions */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors disabled:opacity-50"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  disabled={isShareLoading}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors disabled:opacity-50"
                  aria-label="Share course"
                >
                  {isShareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  ) : (
                    <Share2 className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{stats?.enrolled || 0}+</div>
                  <div className="text-xs text-gray-500">Enrolled</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{stats?.rating || '4.5'}/5</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {course?.total_hours || 'Flexible'}
                  </div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                Course Details
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {visibleDetails.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-')}/10`}>
                      {React.createElement(item.icon, {
                        className: `w-4 h-4 ${item.color}`,
                      })}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${item.color} ${item.highlight ? 'animate-pulse' : ''}`}
                    >
                      {item.value}
                    </span>
                    {item.highlight && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}

              {courseDetails.length > 6 && (
                <button
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className="w-full p-4 text-center text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                >
                  {showAllDetails ? 'Show Less' : `Show ${courseDetails.length - 6} More Details`}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${showAllDetails ? 'rotate-90' : ''}`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Guarantee & Success Card */}
          <div className="bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-transparent border border-primary-200 rounded-2xl p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Learning Guarantee</h4>
                <p className="text-sm text-gray-600">Get the most from your learning experience</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50">
                <div className="text-xl font-bold text-primary-600">
                  {stats?.completionRate || 95}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Completion Rate</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50">
                <div className="text-xl font-bold text-emerald-600">
                  {stats?.satisfaction || 98}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Satisfaction</div>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                '30-day money-back guarantee',
                'Certificate of completion',
                'Lifetime access to content',
                '24/7 learning support',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Enrollment Status Card */}
          {isEnrolled ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">You're Enrolled!</h4>
                  <p className="text-sm text-gray-600">
                    Access your course materials and start learning
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Go to Learning Dashboard
              </button>

              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium mb-2">
                  Your enrollment details:
                </p>
                <ul className="space-y-1 text-sm text-emerald-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Full course access granted
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Certificate upon completion
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Instructor support available
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Ready to Enroll?</h4>
                  <p className="text-sm text-gray-600">
                    Take the next step in your learning journey
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(course?.fee || 0)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(course?.original_fee || 0)}
                      </span>
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>

                {course?.seats_available !== undefined && course.seats_available < 10 && (
                  <div className="text-sm text-red-600 font-medium mb-3">
                    ⚠️ Only {course.seats_available} seats left!
                  </div>
                )}

                <button
                  onClick={onEnroll}
                  disabled={isEnrollmentDisabled || isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
                    isEnrollmentDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    enrollmentButtonText
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className="flex items-center gap-1 hover:text-primary-600 transition disabled:opacity-50"
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  )}
                  {isWishlisted ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleDownloadSyllabus}
                  disabled={isSyllabusLoading}
                  className="flex items-center gap-1 hover:text-primary-600 transition disabled:opacity-50"
                >
                  {isSyllabusLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Syllabus
                </button>
                <button
                  onClick={handleShare}
                  disabled={isShareLoading}
                  className="flex items-center gap-1 hover:text-primary-600 transition disabled:opacity-50"
                >
                  {isShareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp Support Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Need Help Deciding?</h3>
                  <p className="text-white/90 text-sm">
                    Get personalized guidance from our experts
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm">Course suitability assessment</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm">Career path consultation</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm">Payment plan options</span>
                </div>
              </div>

              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-white text-emerald-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm hover:shadow-lg active:scale-95"
              >
                <Phone className="w-4 h-4" />
                Chat with Advisor
              </button>

              <p className="text-center text-white/70 text-xs mt-3">
                Typically replies within 5 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Enroll Bar - Only show if NOT enrolled */}
        {showEnrollment && !isEnrolled && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 animate-in slide-in-from-bottom-4">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(course?.fee || 0)}
                    </span>
                    {discountPercentage > 0 && (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(course?.original_fee || 0)}
                        </span>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {course?.seats_available !== undefined && course.seats_available < 10 && (
                    <div className="text-xs text-red-600 font-medium">
                      ⚠️ Only {course.seats_available} seats left!
                    </div>
                  )}
                </div>
                <button
                  onClick={onEnroll}
                  disabled={isEnrollmentDisabled || isLoading}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                    isEnrollmentDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : enrollmentButtonText}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  )}
                  {isWishlisted ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleDownloadSyllabus}
                  disabled={isSyllabusLoading}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
                >
                  {isSyllabusLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Syllabus
                </button>
                <button
                  onClick={handleShare}
                  disabled={isShareLoading}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
                >
                  {isShareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

CourseSidebar.displayName = 'CourseSidebar'

export default CourseSidebar
