// src/pages/Courses.jsx
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import {
  Search,
  Filter,
  Grid,
  List,
  X,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  ChevronDown,
  RotateCcw,
  Zap,
  Target,
  Heart,
} from 'lucide-react'
import { coursesAPI } from '../services/api'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

// Lazy load CourseCard for better performance
const CourseCard = lazy(() => import('../components/ui/CourseCard'))

const Courses = () => {
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    mode: '',
    featured: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
  })
  const [viewMode, setViewMode] = useState('grid')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  })

  // Memoized filter options
  const levels = useMemo(
    () => [
      { value: '', label: 'All Levels', icon: BookOpen, count: 0, color: 'text-gray-600' },
      { value: 'beginner', label: 'Beginner', icon: BookOpen, color: 'text-emerald-500', count: 8 },
      {
        value: 'intermediate',
        label: 'Intermediate',
        icon: TrendingUp,
        color: 'text-blue-500',
        count: 12,
      },
      { value: 'advanced', label: 'Advanced', icon: Zap, color: 'text-purple-500', count: 6 },
    ],
    []
  )

  const modes = useMemo(
    () => [
      { value: '', label: 'All Modes', icon: Clock, count: 0, color: 'text-gray-600' },
      {
        value: 'online_live',
        label: 'Live Online',
        icon: Clock,
        color: 'text-orange-500',
        count: 15,
      },
      {
        value: 'online_self_paced',
        label: 'Self Paced',
        icon: BookOpen,
        color: 'text-green-500',
        count: 8,
      },
      {
        value: 'hybrid',
        label: 'Hybrid',
        icon: SlidersHorizontal,
        color: 'text-blue-500',
        count: 3,
      },
    ],
    []
  )

  const featuredOptions = useMemo(
    () => [
      { value: '', label: 'All Courses', count: 0 },
      { value: 'true', label: 'Featured', icon: Sparkles, color: 'text-yellow-500', count: 5 },
      { value: 'false', label: 'Regular', count: 21 },
    ],
    []
  )

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:DESC', label: 'Newest', field: 'created_at', order: 'DESC' },
      { value: 'created_at:ASC', label: 'Oldest', field: 'created_at', order: 'ASC' },
      { value: 'fee:ASC', label: 'Price: Low to High', field: 'fee', order: 'ASC' },
      { value: 'fee:DESC', label: 'Price: High to Low', field: 'fee', order: 'DESC' },
      { value: 'title:ASC', label: 'Title: A-Z', field: 'title', order: 'ASC' },
      { value: 'title:DESC', label: 'Title: Z-A', field: 'title', order: 'DESC' },
      { value: 'view_count:DESC', label: 'Most Popular', field: 'view_count', order: 'DESC' },
    ],
    []
  )

  const buildApiPayload = useCallback(() => {
    const payload = {
      page: pagination.page,
      limit: pagination.limit,
      filters: { status: 'published' },
    }

    if (filters.search.trim()) {
      payload.search = filters.search.trim()
      payload.searchFields = 'title,description,short_description'
    }

    if (filters.sortBy) {
      payload.sortBy = filters.sortBy
      payload.sortOrder = filters.sortOrder
    }

    if (filters.level) payload.filters.level = filters.level
    if (filters.mode) payload.filters.mode = filters.mode
    if (filters.featured) payload.filters.featured = filters.featured === 'true'

    return payload
  }, [filters, pagination.page, pagination.limit])

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const payload = buildApiPayload()
      const response = await coursesAPI.getAll(payload)

      const responseData = response.data?.data || response.data

      if (Array.isArray(responseData)) {
        setCourses(responseData)
        setPagination(prev => ({
          ...prev,
          total: responseData.length,
          totalPages: 1,
        }))
      } else if (responseData?.courses) {
        setCourses(responseData.courses)
        setPagination({
          page: responseData.currentPage || 1,
          limit: responseData.limit || 100,
          total: responseData.total || 0,
          totalPages: responseData.totalPages || 1,
        })
      } else {
        setCourses(responseData || [])
      }
    } catch (err) {
      setError('Failed to load courses. Please try again.')
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }, [buildApiPayload])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [
    filters.search,
    filters.level,
    filters.mode,
    filters.featured,
    filters.sortBy,
    filters.sortOrder,
  ])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCourses()
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [fetchCourses])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSortChange = useCallback(value => {
    const [sortBy, sortOrder] = value.split(':')
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      level: '',
      mode: '',
      featured: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
    })
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.level ||
      filters.mode ||
      filters.featured ||
      filters.sortBy !== 'created_at'
    )
  }, [filters])

  const LoadingSkeleton = () => (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4'
          : 'space-y-4'
      }
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 overflow-hidden ${
            viewMode === 'list' ? 'flex' : 'flex flex-col'
          } animate-pulse`}
        >
          <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-36 w-full" />
          <div className="p-3 flex-1">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-2.5 bg-gray-200 rounded w-full mb-1" />
            <div className="h-2.5 bg-gray-200 rounded w-4/5 mb-3" />
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-8 bg-gray-200 rounded-lg w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Hero Section (Same as About and Contact) */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 text-white py-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-4 -left-4 w-16 h-16 bg-accent-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-8 -right-4 w-24 h-24 bg-primary-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 left-1/4 w-20 h-20 bg-accent-500/30 rounded-full blur-xl"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-3">
              <Heart className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">Comprehensive Learning</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-display mb-2">Expert Courses</h1>
            <p className="text-xs text-primary-100 max-w-xl mx-auto leading-relaxed">
              Discover comprehensive courses designed for career growth and skill development
            </p>
          </div>
        </div>
      </section>

      {/* Main Content — full width with generous padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-6">
        {/* Compact Filters and Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-white/20 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            {/* Search Section */}
            <div className="flex-1 w-full lg:max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={`${filters.sortBy}:${filters.sortOrder}`}
                  onChange={e => handleSortChange(e.target.value)}
                  className="pl-7 pr-5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer min-w-[120px]"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>

              {/* Filter Toggle for Mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg hover:border-primary-400 transition-colors text-xs"
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-primary-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {
                      Object.values(filters).filter(v => v && v !== 'created_at' && v !== 'DESC')
                        .length
                    }
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  title="List View"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Compact Filters Panel */}
          {(showFilters || window.innerWidth >= 1024) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Level Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 uppercase tracking-wide">
                    Skill Level
                  </label>
                  <div className="space-y-1">
                    {levels.map(level => (
                      <button
                        key={level.value}
                        onClick={() => handleFilterChange('level', level.value)}
                        className={`w-full flex items-center justify-between p-1.5 rounded border transition-all duration-200 text-xs ${
                          filters.level === level.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {level.icon && <level.icon className={`w-3 h-3 ${level.color}`} />}
                          <span className="font-medium">{level.label}</span>
                        </div>
                        {level.value && level.count > 0 && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded-full min-w-[18px] text-center">
                            {level.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 uppercase tracking-wide">
                    Learning Mode
                  </label>
                  <div className="space-y-1">
                    {modes.map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => handleFilterChange('mode', mode.value)}
                        className={`w-full flex items-center justify-between p-1.5 rounded border transition-all duration-200 text-xs ${
                          filters.mode === mode.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {mode.icon && <mode.icon className={`w-3 h-3 ${mode.color}`} />}
                          <span className="font-medium">{mode.label}</span>
                        </div>
                        {mode.value && mode.count > 0 && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded-full min-w-[18px] text-center">
                            {mode.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 uppercase tracking-wide">
                    Course Type
                  </label>
                  <div className="space-y-1">
                    {featuredOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('featured', option.value)}
                        className={`w-full flex items-center justify-between p-1.5 rounded border transition-all duration-200 text-xs ${
                          filters.featured === option.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {option.icon && <option.icon className={`w-3 h-3 ${option.color}`} />}
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {option.value && option.count > 0 && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded-full min-w-[18px] text-center">
                            {option.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Active Filters */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Filter className="w-3 h-3" />
                <span className="font-medium">Active:</span>
              </div>
              {filters.search && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200">
                  "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:text-primary-800 transition-colors p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {filters.level && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {levels.find(l => l.value === filters.level)?.label}
                  <button
                    onClick={() => handleFilterChange('level', '')}
                    className="hover:text-blue-800 transition-colors p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {filters.mode && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  {modes.find(m => m.value === filters.mode)?.label}
                  <button
                    onClick={() => handleFilterChange('mode', '')}
                    className="hover:text-green-800 transition-colors p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {filters.featured && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  {featuredOptions.find(f => f.value === filters.featured)?.label}
                  <button
                    onClick={() => handleFilterChange('featured', '')}
                    className="hover:text-purple-800 transition-colors p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Compact Results Header */}
        {!loading && !error && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {courses.length} Course{courses.length !== 1 ? 's' : ''} Found
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {hasActiveFilters
                  ? 'Filtered results based on your selection'
                  : 'Browse all available courses'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-primary-600 hover:text-primary-700 font-medium bg-primary-50 hover:bg-primary-100 rounded transition-colors duration-200 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Courses Grid/List */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Courses</h3>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={fetchCourses}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs font-medium"
              >
                Try Again
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {courses.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4'
                    : 'space-y-3'
                }
              >
                <Suspense fallback={<LoadingSkeleton />}>
                  {courses.map(course => (
                    <CourseCard
                      key={course.course_id || course.id}
                      course={course}
                      viewMode={viewMode}
                    />
                  ))}
                </Suspense>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Courses Found</h3>
                <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'No courses match your current filters. Try adjusting your search criteria.'
                    : 'No courses available at the moment. Please check back later.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Compact Load More */}
        {!loading && courses.length > 0 && pagination.totalPages > pagination.page && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-primary-400 hover:text-primary-600 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
            >
              Load More Courses
            </button>
          </div>
        )}
      </div>
      {/* WhatsApp Floating Icon */}
      <WhatsAppFloatingIcon />
    </div>
  )
}

export default Courses
