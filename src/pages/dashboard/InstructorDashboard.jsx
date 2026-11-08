// src/pages/dashboard/InstructorDashboard.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Icons – reused from the other dashboards
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

const BarChart3 = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

const MessageCircle = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
)

const CheckCircle2 = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

const RefreshCw = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const Settings = ({ className = 'w-6 h-6' }) => (
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

const Cpu = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
    />
  </svg>
)

const AlertCircle = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const Star = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

// Pre-loaded mock data for instructor
const INSTRUCTOR_MOCK_DATA = {
  overview: {
    total_courses: 8,
    total_students: 245,
    total_revenue: 185000,
    avg_rating: 4.7,
    pending_approvals: 3,
    active_courses: 5,
    completion_rate: 72,
  },
  recent_enrollments: [
    {
      id: 1,
      User: {
        full_name: 'Rahul Sharma',
        email: 'rahul@example.com',
      },
      Course: {
        title: 'SAP ABAP Basics',
      },
      enrollment_date: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 2,
      User: {
        full_name: 'Priya Patel',
        email: 'priya@example.com',
      },
      Course: {
        title: 'Advanced ABAP Programming',
      },
      enrollment_date: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 3,
      User: {
        full_name: 'Amit Kumar',
        email: 'amit@example.com',
      },
      Course: {
        title: 'SAP Fiori Development',
      },
      enrollment_date: new Date().toISOString(),
      status: 'pending',
    },
    {
      id: 4,
      User: {
        full_name: 'Sneha Gupta',
        email: 'sneha@example.com',
      },
      Course: {
        title: 'SAP HANA Basics',
      },
      enrollment_date: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 5,
      User: {
        full_name: 'Rajesh Mehta',
        email: 'rajesh@example.com',
      },
      Course: {
        title: 'ABAP OO Programming',
      },
      enrollment_date: new Date().toISOString(),
      status: 'completed',
    },
  ],
  course_performance: [
    {
      id: 1,
      title: 'SAP ABAP Basics',
      enrollment_count: 120,
      avg_progress: 75,
      revenue: 45000,
      rating: 4.8,
    },
    {
      id: 2,
      title: 'Advanced ABAP Programming',
      enrollment_count: 85,
      avg_progress: 68,
      revenue: 38000,
      rating: 4.9,
    },
    {
      id: 3,
      title: 'SAP Fiori Development',
      enrollment_count: 65,
      avg_progress: 72,
      revenue: 32000,
      rating: 4.7,
    },
    {
      id: 4,
      title: 'SAP HANA Basics',
      enrollment_count: 45,
      avg_progress: 80,
      revenue: 28000,
      rating: 4.6,
    },
    {
      id: 5,
      title: 'ABAP OO Programming',
      enrollment_count: 35,
      avg_progress: 65,
      revenue: 25000,
      rating: 4.5,
    },
  ],
  realTime: {
    active_students: 23,
    active_courses: 8,
    today_revenue: 12500,
    today_enrollments: 7,
  },
}

// Custom hook for instructor dashboard data
const useInstructorDashboard = () => {
  const [data, setData] = useState(INSTRUCTOR_MOCK_DATA)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setData(INSTRUCTOR_MOCK_DATA)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, lastUpdate, error, refetch: fetchData }
}

// RealTimeMetrics Component (same as AdminDashboard)
const RealTimeMetrics = React.memo(({ metrics, loading }) => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
      <Cpu className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
      <span className="truncate">Real-time Metrics</span>
      {loading && (
        <div className="ml-2 flex items-center">
          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
        </div>
      )}
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold">{metrics?.active_students || 0}</div>
        <div className="text-blue-200 text-xs sm:text-sm truncate">Active Students</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold">{metrics?.active_courses || 0}</div>
        <div className="text-blue-200 text-xs sm:text-sm truncate">Active Courses</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold">
          ₹{(metrics?.today_revenue || 0).toLocaleString()}
        </div>
        <div className="text-blue-200 text-xs sm:text-sm truncate">Today's Revenue</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold">{metrics?.today_enrollments || 0}</div>
        <div className="text-blue-200 text-xs sm:text-sm truncate">New Enrollments</div>
      </div>
    </div>
  </div>
))

RealTimeMetrics.displayName = 'RealTimeMetrics'

// QuickActionsGrid Component (customised for instructor)
const QuickActionsGrid = React.memo(({ actions, loading }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h2>
      {loading && (
        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <Link
            key={index}
            to={action.href}
            className="flex flex-col items-center p-4 sm:p-5 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Go to ${action.name}`}
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${action.color}`} />
            </div>
            <p className="font-semibold text-gray-700 text-base sm:text-lg group-hover:text-primary-600 mb-1 truncate w-full">
              {action.name}
            </p>
            <p className="text-sm text-gray-500 mb-2 truncate w-full">{action.description}</p>
            {action.count !== undefined && action.count > 0 && (
              <span
                className={`mt-1 text-xs px-2 py-1 rounded-full ${
                  action.count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {action.count} {action.count === 1 ? 'item' : 'items'}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  </div>
))

QuickActionsGrid.displayName = 'QuickActionsGrid'

// Error Boundary Component (simplified)
const DashboardError = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
    <p className="text-red-600 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      Try Again
    </button>
  </div>
)

const InstructorDashboard = () => {
  const { user } = useAuth()
  const { data: dashboardData, loading, lastUpdate, error, refetch } = useInstructorDashboard()
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Auto-refresh implementation
  useEffect(() => {
    let intervalId
    if (autoRefresh) {
      intervalId = setInterval(() => {
        refetch(true)
      }, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refetch])

  const userData = user?.user || user || {}
  const { overview, recent_enrollments, course_performance, realTime } = dashboardData || {}

  const stats = useMemo(
    () => [
      {
        name: 'Total Courses',
        value: overview?.total_courses?.toLocaleString() || '0',
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        change: '+2',
        changeType: 'positive',
        realTime: realTime?.active_courses || 0,
        realTimeLabel: 'Active',
        href: '/dashboard/instructor/courses',
      },
      {
        name: 'Total Students',
        value: overview?.total_students?.toLocaleString() || '0',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: '+15',
        changeType: 'positive',
        realTime: realTime?.active_students || 0,
        realTimeLabel: 'Online',
        href: '/dashboard/instructor/students',
      },
      {
        name: 'Total Revenue',
        value: `₹${(overview?.total_revenue || 0).toLocaleString()}`,
        icon: CreditCard,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        change: '+12%',
        changeType: 'positive',
        realTime: `₹${(realTime?.today_revenue || 0).toLocaleString()}`,
        realTimeLabel: 'Today',
        href: '/dashboard/instructor/earnings',
      },
      {
        name: 'Avg. Rating',
        value: overview?.avg_rating?.toFixed(1) || '0',
        icon: Star,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        change: '+0.2',
        changeType: 'positive',
        realTime: '4.9',
        realTimeLabel: 'Best course',
        href: '/dashboard/instructor/reviews',
      },
    ],
    [overview, realTime]
  )

  const quickActions = useMemo(
    () => [
      {
        name: 'Create Course',
        description: 'Add new course content',
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        href: '/dashboard/instructor/courses/create',
      },
      {
        name: 'Manage Students',
        description: 'View and manage enrollments',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        href: '/dashboard/instructor/students',
        count: overview?.pending_approvals || 0,
      },
      {
        name: 'Analytics',
        description: 'Course performance insights',
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        href: '/dashboard/instructor/analytics',
      },
      {
        name: 'Upload Materials',
        description: 'Add resources & assignments',
        icon: Play,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        href: '/dashboard/instructor/materials',
      },
    ],
    [overview]
  )

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserInitials = user => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.name) return user.name.charAt(0).toUpperCase()
    return 'I'
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <DashboardError message={error} onRetry={() => refetch(true)} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0 pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 space-y-2 sm:space-y-0">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mr-3 truncate">
                Welcome back, {userData?.full_name || userData?.name || 'Instructor'}! 👋
              </h1>
              {loading && (
                <div className="flex items-center text-primary-200">
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  <span className="text-xs sm:text-sm">Updating...</span>
                </div>
              )}
            </div>
            <p className="text-primary-100 text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl">
              Manage your courses and track student progress. Here's your overview.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-0">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-300 flex-shrink-0" />
                <span className="font-medium truncate">
                  Completion Rate: {overview?.completion_rate || 72}%
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 flex-shrink-0" />
                <span className="font-medium truncate">
                  {overview?.total_students || 245} Total Students
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-0">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 flex-shrink-0" />
                <span className="font-medium truncate">
                  Avg. Rating: {overview?.avg_rating || 4.7} ★
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 lg:ml-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold">{overview?.total_courses || 8}</div>
              <div className="text-primary-200 text-xs sm:text-sm">Active Courses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealTimeMetrics metrics={realTime} loading={loading} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              to={stat.href}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={`View ${stat.name}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                    {stat.name}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">
                    {stat.value}
                  </p>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p
                      className={`text-xs sm:text-sm font-medium truncate ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change} from last month
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {stat.realTimeLabel}: {stat.realTime}
                    </p>
                  </div>
                </div>
                <div
                  className={`p-2 sm:p-3 rounded-xl ${stat.bgColor} transition-transform duration-300 hover:scale-110 ml-2 sm:ml-3 flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid actions={quickActions} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Recent Enrollments
            </h2>
            <Link
              to="/dashboard/instructor/students"
              className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="View all students"
            >
              <span className="hidden sm:inline">View all</span>
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : recent_enrollments?.length > 0 ? (
              recent_enrollments.slice(0, 5).map(enrollment => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 group min-w-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                      {getUserInitials(enrollment.User)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate group-hover:text-primary-600 transition-colors">
                        {enrollment.User.full_name || 'Unknown User'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {enrollment.User.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-0">
                    <p
                      className="font-medium text-gray-900 text-xs sm:text-sm truncate"
                      title={enrollment.Course.title}
                    >
                      {enrollment.Course.title}
                    </p>
                    <div className="flex items-center space-x-1 sm:space-x-2 mt-0.5 sm:mt-1 justify-end">
                      <span
                        className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full truncate ${getStatusColor(
                          enrollment.status
                        )}`}
                      >
                        {enrollment.status}
                      </span>
                      <p className="text-xs text-gray-500 hidden sm:block">
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">No recent enrollments</div>
            )}
          </div>
        </div>

        {/* Course Performance */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Your Course Performance
            </h2>
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : course_performance?.length > 0 ? (
              course_performance.slice(0, 5).map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors duration-200 min-w-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate"
                        title={course.title}
                      >
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {course.enrollment_count} students • {Math.round(course.avg_progress)}% avg
                        progress
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base sm:text-lg font-bold text-primary-600 truncate">
                      ₹{course.revenue?.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm text-gray-500">{course.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No course performance data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error display for partial errors */}
      {error && dashboardData && (
        <div className="mt-4">
          <DashboardError message={error} onRetry={() => refetch(true)} />
        </div>
      )}
    </div>
  )
}

export default React.memo(InstructorDashboard)
