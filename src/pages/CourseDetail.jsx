import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { coursesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSkeleton from '../components/ui/CourseDetails/LoadingSkeleton'
import ErrorState from '../components/ui/CourseDetails/ErrorState'
import CourseHero from '../components/ui/CourseDetails/CourseHero'
import CourseCurriculum from '../components/ui/CourseDetails/CourseCurriculum'
import CourseSidebar from '../components/ui/CourseDetails/CourseSidebar'
import MobileAccordion from '../components/ui/CourseDetails/MobileAccordion'
import CourseOverview from '../components/ui/CourseDetails/CourseOverview'
import CourseOutcomes from '../components/ui/CourseDetails/CourseOutcomes'
import InstructorProfile from '../components/ui/CourseDetails/InstructorProfile'

const EnrollmentFlow = lazy(() => import('../components/enrollment/EnrollmentFlow'))

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919527512770'
const WHATSAPP_MESSAGE = `Hi, I'm interested in the course: `

const CourseDetail = () => {
  const { course_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  // State management
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [expandedModules, setExpandedModules] = useState(new Set())
  const [enrollmentStatus, setEnrollmentStatus] = useState(null)
  const [stats] = useState({
    enrolled: Math.floor(Math.random() * 500) + 100,
    completionRate: 92,
    satisfaction: 97,
    rating: 4.8,
  })

  // Helper function to get user ID
  const getUserId = useCallback(user => {
    if (!user) return null
    if (user.user_id) return user.user_id
    if (user.user && user.user.user_id) return user.user.user_id
    return null
  }, [])

  // Fetch enrollment status for the current user and course
  useEffect(() => {
    const fetchEnrollmentStatus = async () => {
      if (!isAuthenticated || !user || !course_id) {
        setEnrollmentStatus(null)
        return
      }

      try {
        const userId = getUserId(user)
        const payload = {
          user_id: userId,
          page: 1,
          limit: 10, // Increased limit to get more courses
          filters: {}, // Removed course_id filter
        }

        const response = await coursesAPI.getEnrolled(payload)

        // console.log('All enrolled courses:', response.data?.courses[0])
        // console.log('Current course_id from URL:', course_id)
        // console.log('User ID:', userId)

        if (response.data?.success && response.data.courses?.length > 0) {
          // Find if any of the enrolled courses matches the current course_id
          const enrolledCourse = response.data.courses.find(course => {
            // Convert both to string for safe comparison
            return course.course_id?.toString() === course_id.toString()
          })

          // console.log('Found matching course:', enrolledCourse)

          if (enrolledCourse) {
            const status = enrolledCourse.enrollments?.[0]?.status
            // console.log('Enrollment status found:', status)
            setEnrollmentStatus(status) // This will be 'active' if enrolled
          } else {
            // console.log('No matching course found in enrolled courses')
            setEnrollmentStatus(null)
          }
        } else {
          // console.log('No enrolled courses found or API returned error')
          setEnrollmentStatus(null)
        }
      } catch (err) {
        console.error('Error fetching enrollment status:', err)
        setEnrollmentStatus(null)
      }
    }

    fetchEnrollmentStatus()
  }, [isAuthenticated, user, course_id, getUserId])

  // Memoized derived data
  const discountPercentage = useMemo(() => {
    if (!course || !course.original_fee || !course.fee) return 0
    const original = parseFloat(course.original_fee)
    const current = parseFloat(course.fee)
    if (isNaN(original) || isNaN(current) || original <= current) return 0
    return Math.round(((original - current) / original) * 100)
  }, [course])

  const levelInfo = useMemo(() => {
    const levels = {
      beginner: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        gradient: 'from-emerald-400 to-emerald-600',
        label: 'Beginner',
        icon: 'BookOpen',
      },
      intermediate: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        gradient: 'from-blue-400 to-blue-600',
        label: 'Intermediate',
        icon: 'TrendingUp',
      },
      advanced: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        gradient: 'from-purple-400 to-purple-600',
        label: 'Advanced',
        icon: 'Zap',
      },
    }
    return levels[course?.level] || levels.beginner
  }, [course?.level])

  const modeInfo = useMemo(() => {
    const modes = {
      online_live: {
        label: 'Live Online',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: 'Globe',
        description: 'Interactive live sessions',
      },
      online_self_paced: {
        label: 'Self Paced',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: 'Video',
        description: 'Learn at your own pace',
      },
      hybrid: {
        label: 'Hybrid',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: 'SlidersHorizontal',
        description: 'Mix of live and self-paced',
      },
    }
    return modes[course?.mode] || modes.online_live
  }, [course?.mode])

  // Memoized formatting functions
  const formatPrice = useCallback(price => {
    if (!price && price !== 0) return 'Free'
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return 'Free'

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numPrice)
  }, [])

  // Event handlers
  const handleEnroll = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${course_id}` } })
      return
    }
    setShowEnrollment(true)
  }, [isAuthenticated, navigate, course_id])

  const toggleWishlist = useCallback(() => {
    setIsWishlisted(prev => !prev)
    // TODO: API call with debouncing
  }, [])

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: course?.title || 'Course',
        text: course?.short_description || 'Check out this course',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }, [course])

  const handleDownloadSyllabus = useCallback(() => {
    if (course?.syllabus_pdf) {
      window.open(course.syllabus_pdf, '_blank')
    } else {
      alert('Syllabus is not available for this course yet.')
    }
  }, [course])

  const handleWhatsAppClick = useCallback(() => {
    const message = encodeURIComponent(`${WHATSAPP_MESSAGE}${course?.title || ''}`)
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }, [course?.title])

  const toggleModule = useCallback(moduleIndex => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }, [])

  // Fetch course data
  useEffect(() => {
    let mounted = true

    const fetchCourse = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await coursesAPI.getById(course_id)

        if (!mounted) return

        if (response && response.data) {
          let courseData = null

          if (response.data.success && response.data.data) {
            courseData = response.data.data
          } else if (response.data.title || response.data.course_id) {
            courseData = response.data
          }

          if (courseData) {
            courseData.metadata = courseData.metadata || {
              modules: [],
              curriculum: [],
              prerequisites: [],
              learning_objectives: [],
            }
            setCourse(courseData)
          } else {
            setError('Course data format is unexpected.')
          }
        } else {
          setError('Course not found. It may have been removed.')
        }
      } catch (err) {
        if (!mounted) return

        console.error('Error fetching course:', err)
        setError(
          err.response?.status === 404
            ? 'Course not found. Please check the URL.'
            : 'Failed to load course. Please try again later.'
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchCourse()

    return () => {
      mounted = false
    }
  }, [course_id, location.state])

  // Preload enrollment component when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      import('../components/enrollment/EnrollmentFlow')
    }
  }, [isAuthenticated])

  // Loading state
  if (loading) {
    return <LoadingSkeleton type="course-detail" />
  }

  // Error state
  if (error && !course) {
    return (
      <ErrorState
        title="Course Not Found"
        message={error}
        actions={[
          {
            label: 'Browse Courses',
            onClick: () => navigate('/courses'),
            variant: 'primary',
          },
          {
            label: 'Try Again',
            onClick: () => window.location.reload(),
            variant: 'secondary',
          },
        ]}
      />
    )
  }

  if (!course) return null

  // Helper to determine if user is enrolled
  const isEnrolled = enrollmentStatus === 'active'
  // console.log('Is user enrolled?', isEnrolled, 'Status:', enrollmentStatus)

  // Tab configuration
  const tabConfig = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'BookOpen',
      content: (
        <CourseOverview course={course} levelInfo={levelInfo} stats={stats} modeInfo={modeInfo} />
      ),
    },
    {
      id: 'curriculum',
      label: 'Curriculum',
      icon: 'Code',
      content: (
        <CourseCurriculum
          curriculum={course.metadata?.curriculum}
          modules={course.metadata?.modules}
          expandedModules={expandedModules}
          onToggleModule={toggleModule}
        />
      ),
    },
    {
      id: 'outcomes',
      label: 'Outcomes',
      icon: 'Target',
      content: <CourseOutcomes course={course} />,
    },
    {
      id: 'instructor',
      label: 'Instructor',
      icon: 'User',
      content: <InstructorProfile />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <CourseHero
        course={course}
        stats={stats}
        levelInfo={levelInfo}
        modeInfo={modeInfo}
        discountPercentage={discountPercentage}
        formatPrice={formatPrice}
        isWishlisted={isWishlisted}
        onNavigateBack={() =>
          isAuthenticated ? navigate('/dashboard/courses') : navigate('/courses')
        }
        onEnroll={handleEnroll}
        onToggleWishlist={toggleWishlist}
        onShare={handleShare}
        onDownloadSyllabus={handleDownloadSyllabus}
        isAuthenticated={isAuthenticated}
        enrollmentStatus={enrollmentStatus}
        isEnrolled={isEnrolled}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Desktop Tabs */}
            <div className="hidden lg:block">
              <div className="flex overflow-x-auto border-b border-gray-200 mb-6 scrollbar-hide">
                {tabConfig.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon === 'BookOpen' && <span className="text-lg">📚</span>}
                    {tab.icon === 'Code' && <span className="text-lg">💻</span>}
                    {tab.icon === 'Target' && <span className="text-lg">🎯</span>}
                    {tab.icon === 'User' && <span className="text-lg">👨‍🏫</span>}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-fadeIn">
                {tabConfig.find(tab => tab.id === activeTab)?.content}
              </div>
            </div>

            {/* Mobile Accordion */}
            <div className="lg:hidden">
              <MobileAccordion tabs={tabConfig} />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <CourseSidebar
            course={course}
            modeInfo={modeInfo}
            levelInfo={levelInfo}
            formatPrice={formatPrice}
            discountPercentage={discountPercentage}
            stats={stats}
            onWhatsAppClick={handleWhatsAppClick}
            onEnroll={handleEnroll}
            isAuthenticated={isAuthenticated}
            enrollmentStatus={enrollmentStatus}
            isEnrolled={isEnrolled}
          />
        </div>
      </div>

      {/* Enrollment Flow Modal */}
      {showEnrollment && isAuthenticated && !isEnrolled && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          }
        >
          <EnrollmentFlow course={course} onClose={() => setShowEnrollment(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default React.memo(CourseDetail)
