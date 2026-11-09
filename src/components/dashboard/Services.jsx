// src/pages/Services.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Briefcase,
  ChevronDown,
  RotateCcw,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  Table,
  Sparkles,
  CheckCircle,
  Globe,
  Headphones,
  Code,
  Cloud,
  Zap,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { servicesAPI } from '../../services/api'

const ServiceCard = lazy(() => import('../ui/ServiceCard'))

// ==================== HERO HIGHLIGHTS (mirrors Home hero) ====================
const HERO_HIGHLIGHTS = [
  { icon: Code, title: 'Custom Development', desc: 'Web, mobile & enterprise apps' },
  { icon: Cloud, title: 'Cloud & DevOps', desc: 'Scalable, reliable infrastructure' },
  { icon: Zap, title: 'AI & Automation', desc: 'Smart workflows & intelligent bots' },
  { icon: Headphones, title: 'Expert Support', desc: '24/7 assistance when you need it' },
]

// ==================== HERO STATS ====================
const HERO_STATS = [
  { label: 'Projects Delivered', value: '100+', icon: Briefcase },
  { label: 'Client Satisfaction', value: '98%', icon: Star },
  { label: 'Uptime Guarantee', value: '99.9%', icon: ShieldCheck },
  { label: 'Support', value: '24/7', icon: Headphones },
]

const Services = () => {
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    page: 1,
    limit: 20,
  })
  const [viewMode, setViewMode] = useState('grid')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  })

  const priceRanges = useMemo(
    () => [
      { value: '', label: 'All Prices', min: null, max: null },
      { value: '0-500', label: 'Under ₹500', min: 0, max: 500 },
      { value: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
      { value: '1000-2000', label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
      { value: '2000+', label: '₹2,000 & above', min: 2000, max: null },
    ],
    []
  )

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:DESC', label: 'Newest', field: 'created_at', order: 'DESC' },
      { value: 'created_at:ASC', label: 'Oldest', field: 'created_at', order: 'ASC' },
      { value: 'title:ASC', label: 'Title: A-Z', field: 'title', order: 'ASC' },
      { value: 'title:DESC', label: 'Title: Z-A', field: 'title', order: 'DESC' },
      { value: 'view_count:DESC', label: 'Most Popular', field: 'view_count', order: 'DESC' },
    ],
    []
  )

  const buildApiPayload = useCallback(() => {
    const payload = {
      page: filters.page,
      limit: filters.limit,
      filters: {},
    }

    if (filters.search.trim()) {
      payload.search = filters.search.trim()
      payload.searchFields = ['title', 'description', 'short_description']
    }

    if (filters.sortBy) {
      payload.sortBy = filters.sortBy
      payload.sortOrder = filters.sortOrder
    }

    if (filters.minPrice !== '' && filters.minPrice != null) {
      payload.filters.minPrice = parseFloat(filters.minPrice)
    }
    if (filters.maxPrice !== '' && filters.maxPrice != null) {
      payload.filters.maxPrice = parseFloat(filters.maxPrice)
    }

    return payload
  }, [filters])

  const fetchServices = useCallback(async () => {
    let cancelled = false
    try {
      setLoading(true)
      setError(null)

      const payload = buildApiPayload()
      const response = await servicesAPI.getAll(payload)
      if (cancelled) return

      const responseData = response?.data?.data ?? response?.data

      if (Array.isArray(responseData)) {
        setServices(responseData)
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: responseData.length,
          totalPages: Math.max(1, Math.ceil(responseData.length / filters.limit)),
        })
      } else if (responseData?.services && responseData?.pagination) {
        setServices(responseData.services)
        setPagination({
          page: responseData.pagination.page || 1,
          limit: responseData.pagination.limit || filters.limit,
          totalItems:
            responseData.pagination.totalItems ?? responseData.services.length,
          totalPages: Math.max(1, responseData.pagination.totalPages || 1),
        })
      } else {
        const arr = Array.isArray(responseData) ? responseData : []
        setServices(arr)
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: arr.length,
          totalPages: Math.max(1, Math.ceil(arr.length / filters.limit)),
        })
      }
    } catch (err) {
      if (!cancelled) {
        setError('Failed to load services. Please try again.')
        console.error('Error fetching services:', err)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [buildApiPayload, filters.page, filters.limit])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices()
    }, 350)
    return () => clearTimeout(timeoutId)
  }, [fetchServices])

  useEffect(() => {
    setFilters(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.minPrice, filters.maxPrice, filters.sortBy, filters.sortOrder])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handlePriceChange = useCallback(
    selectedValue => {
      if (!selectedValue) {
        setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '', page: 1 }))
        return
      }
      const range = priceRanges.find(r => r.value === selectedValue)
      if (range) {
        setFilters(prev => ({
          ...prev,
          minPrice: range.min != null ? range.min : '',
          maxPrice: range.max != null ? range.max : '',
          page: 1,
        }))
      }
    },
    [priceRanges]
  )

  const handleSortChange = useCallback(value => {
    const [sortBy, sortOrder] = value.split(':')
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }, [])

  const handleQuickSort = useCallback((sortBy, sortOrder = 'DESC') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
      page: 1,
      limit: 20,
    })
  }, [])

  const handlePageChange = useCallback(
    newPage => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setFilters(prev => ({ ...prev, page: newPage }))
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    },
    [pagination.totalPages]
  )

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.minPrice !== '' ||
        filters.maxPrice !== '' ||
        filters.sortBy !== 'created_at' ||
        filters.sortOrder !== 'DESC'
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.minPrice !== '' || filters.maxPrice !== '') count++
    if (filters.sortBy !== 'created_at' || filters.sortOrder !== 'DESC') count++
    return count
  }, [filters])

  const activePriceLabel = useMemo(() => {
    const found = priceRanges.find(
      r =>
        String(r.min ?? '') === String(filters.minPrice ?? '') &&
        String(r.max ?? '') === String(filters.maxPrice ?? '')
    )
    return found?.label || 'Custom'
  }, [filters.minPrice, filters.maxPrice, priceRanges])

  const activeSortLabel = useMemo(() => {
    const found = sortOptions.find(
      o => o.field === filters.sortBy && o.order === filters.sortOrder
    )
    return found?.label || 'Custom'
  }, [filters.sortBy, filters.sortOrder, sortOptions])

  const LoadingSkeleton = () => (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
          : 'space-y-4'
      }
    >
      {Array.from({ length: Math.min(filters.limit, 12) }).map((_, index) => (
        <div
          key={index}
          className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
      {/* ============================================================
          HERO — mirrors Home hero language & structure
          ============================================================ */}
      <section className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[11px] sm:text-xs font-bold">
              <Sparkles size={13} />
              Professional Services
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-primary-900">
              Build Your Digital Future with
              <span className="block text-primary-600">Expert Services</span>
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-gray-600 max-w-2xl mx-auto">
              From web apps to enterprise software and domain registration — explore
              MaPrims services designed to accelerate your business growth.
            </p>

            {/* Highlights (mirrors Home hero grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6 w-full text-left">
              {HERO_HIGHLIGHTS.map((item, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-2.5">
                  <div className="shrink-0 p-2 rounded-lg bg-primary-100 text-primary-600">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-primary-900">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-gradient-to-r from-primary-900 to-primary-600 rounded-lg sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
            {HERO_STATS.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-200" />
                </div>
                <div>
                  <div className="text-sm sm:text-xl font-black">{stat.value}</div>
                  <div className="text-[8px] sm:text-[10px] text-primary-200 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TOOLBAR (search + sort + view) — NOT a filter
          ============================================================ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 pt-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search services by name or description..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  value={`${filters.sortBy}:${filters.sortOrder}`}
                  onChange={e => handleSortChange(e.target.value)}
                  className="pl-8 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer min-w-[140px] font-medium text-gray-700"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <TrendingUp className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 text-sm font-medium text-gray-700"
                aria-expanded={showFilters}
                aria-controls="service-filters-panel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-transparent text-gray-600 hover:bg-white'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-transparent text-gray-600 hover:bg-white'
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            FILTER PANEL — two distinct visual styles:
            LEFT: Price Range → neutral pill list
            RIGHT: Quick Links → accent chip buttons
            ============================================================ */}
        <div
          id="service-filters-panel"
          className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* --- Price Range (neutral pill list) --- */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                    Price Range
                  </h3>
                  <p className="text-[10px] text-gray-500">Basic tier pricing</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {priceRanges.map(range => {
                  const isActive =
                    String(range.min ?? '') === String(filters.minPrice ?? '') &&
                    String(range.max ?? '') === String(filters.maxPrice ?? '')
                  return (
                    <button
                      key={range.value || 'all'}
                      onClick={() => handlePriceChange(range.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {isActive && <CheckCircle className="w-3 h-3" />}
                      {range.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* --- Quick Links (accent chip buttons) --- */}
            <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-4 border border-accent-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent-200/60">
                <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-accent-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-accent-900 uppercase tracking-wide">
                    Quick Links
                  </h3>
                  <p className="text-[10px] text-accent-700/70">Popular sorts</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickSort('view_count', 'DESC')}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    filters.sortBy === 'view_count'
                      ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                      : 'bg-white/70 text-accent-800 border-accent-200 hover:bg-white hover:border-accent-300'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Most Popular
                </button>
                <button
                  onClick={() => handleQuickSort('created_at', 'DESC')}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    filters.sortBy === 'created_at' && filters.sortOrder === 'DESC'
                      ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                      : 'bg-white/70 text-accent-800 border-accent-200 hover:bg-white hover:border-accent-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Newest First
                </button>
                <button
                  onClick={() => handleQuickSort('title', 'ASC')}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    filters.sortBy === 'title' && filters.sortOrder === 'ASC'
                      ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                      : 'bg-white/70 text-accent-800 border-accent-200 hover:bg-white hover:border-accent-300'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Title A-Z
                </button>
                <button
                  onClick={() => handleQuickSort('title', 'DESC')}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    filters.sortBy === 'title' && filters.sortOrder === 'DESC'
                      ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                      : 'bg-white/70 text-accent-800 border-accent-200 hover:bg-white hover:border-accent-300'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Title Z-A
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center bg-white rounded-lg p-2.5 border border-gray-200">
              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                <SlidersHorizontal className="w-3 h-3" />
                Active:
              </div>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-100 text-primary-700 border border-primary-200">
                  "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:text-primary-900"
                    aria-label="Clear search filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {(filters.minPrice !== '' || filters.maxPrice !== '') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 border border-green-200">
                  Price: {activePriceLabel}
                  <button
                    onClick={() => handlePriceChange('')}
                    className="hover:text-green-900"
                    aria-label="Clear price filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {(filters.sortBy !== 'created_at' || filters.sortOrder !== 'DESC') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-100 text-accent-700 border border-accent-200">
                  Sort: {activeSortLabel}
                  <button
                    onClick={() => handleSortChange('created_at:DESC')}
                    className="hover:text-accent-900"
                    aria-label="Clear sort"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 ml-auto"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            RESULTS HEADER
            ============================================================ */}
        {!loading && !error && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {pagination.totalItems} Service{pagination.totalItems !== 1 ? 's' : ''} Found
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {hasActiveFilters
                  ? 'Filtered results based on your selection'
                  : 'Browse all available services'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-primary-600 hover:text-primary-700 font-medium bg-primary-50 hover:bg-primary-100 rounded-lg text-xs self-start"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>
        )}

        {/* ============================================================
            SERVICES GRID / LIST
            ============================================================ */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <X className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Services</h3>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={fetchServices}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-xs font-medium"
              >
                Try Again
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
              {hasActiveFilters
                ? 'No services match your current filters. Try adjusting your search criteria.'
                : 'No services available at the moment. Please check back later.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-xs font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                  : 'space-y-3'
              }
            >
              <Suspense
                fallback={
                  <div className="col-span-full">
                    <LoadingSkeleton />
                  </div>
                }
              >
                {services.map(service => (
                  <ServiceCard
                    key={service.service_id || service.id}
                    service={service}
                    viewMode={viewMode}
                  />
                ))}
              </Suspense>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="border border-gray-100 bg-white mt-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <span>Showing</span>
                    <span className="font-medium">
                      {(filters.page - 1) * filters.limit + 1}
                    </span>
                    <span>to</span>
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, pagination.totalItems)}
                    </span>
                    <span>of</span>
                    <span className="font-medium">{pagination.totalItems}</span>
                    <span>results</span>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={filters.page === 1}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    {(() => {
                      const pages = []
                      const totalPages = pagination.totalPages
                      const currentPage = filters.page
                      let startPage = Math.max(1, currentPage - 2)
                      let endPage = Math.min(totalPages, currentPage + 2)
                      if (currentPage <= 3) endPage = Math.min(5, totalPages)
                      if (currentPage >= totalPages - 2)
                        startPage = Math.max(1, totalPages - 4)
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-6 h-6 text-xs rounded border transition-colors ${
                              filters.page === i
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                            aria-label={`Page ${i}`}
                            aria-current={filters.page === i ? 'page' : undefined}
                          >
                            {i}
                          </button>
                        )
                      }
                      return pages
                    })()}
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={filters.page === pagination.totalPages}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Services