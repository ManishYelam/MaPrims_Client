import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Briefcase,
  ChevronDown,
  RotateCcw,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  Table,
} from 'lucide-react'
import { servicesAPI } from '../../services/api'

const ServiceCard = lazy(() => import('../ui/ServiceCard'))

const Servicess = () => {
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
      { value: '', label: 'All Prices', min: '', max: '' },
      { value: '0-500', label: 'Under ₹500', min: 0, max: 500 },
      { value: '500-1000', label: '₹500 – ₹1000', min: 500, max: 1000 },
      { value: '1000-2000', label: '₹1000 – ₹2000', min: 1000, max: 2000 },
      { value: '2000+', label: '₹2000 & above', min: 2000, max: null },
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

    if (filters.minPrice) payload.filters.minPrice = parseFloat(filters.minPrice)
    if (filters.maxPrice) payload.filters.maxPrice = parseFloat(filters.maxPrice)

    return payload
  }, [filters])

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const payload = buildApiPayload()
      const response = await servicesAPI.getAll(payload)

      const responseData = response.data?.data || response.data

      if (Array.isArray(responseData)) {
        setServices(responseData)
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: responseData.length,
          totalPages: Math.ceil(responseData.length / filters.limit),
        })
      } else if (responseData?.services && responseData?.pagination) {
        setServices(responseData.services)
        setPagination({
          page: responseData.pagination.page || 1,
          limit: responseData.pagination.limit || filters.limit,
          totalItems: responseData.pagination.totalItems || responseData.services.length,
          totalPages: responseData.pagination.totalPages || 1,
        })
      } else {
        setServices(responseData || [])
        setPagination(prev => ({
          ...prev,
          totalItems: (responseData || []).length,
          totalPages: Math.ceil((responseData || []).length / filters.limit),
        }))
      }
    } catch (err) {
      setError('Failed to load services. Please try again.')
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }, [buildApiPayload, filters.page, filters.limit])

  // Reset page when filters change (except page itself)
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }))
  }, [filters.search, filters.minPrice, filters.maxPrice, filters.sortBy, filters.sortOrder])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices()
    }, 350)
    return () => clearTimeout(timeoutId)
  }, [fetchServices])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handlePriceChange = useCallback(
    selectedValue => {
      if (!selectedValue) {
        setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))
        return
      }
      const range = priceRanges.find(r => r.value === selectedValue)
      if (range) {
        setFilters(prev => ({
          ...prev,
          minPrice: range.min !== '' ? range.min : '',
          maxPrice: range.max !== '' ? range.max : '',
        }))
      }
    },
    [priceRanges]
  )

  const handleSortChange = useCallback(value => {
    const [sortBy, sortOrder] = value.split(':')
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
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
      }
    },
    [pagination.totalPages]
  )

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.minPrice || filters.maxPrice || filters.sortBy !== 'created_at'
  }, [filters])

  const LoadingSkeleton = () => (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4'
          : 'space-y-4'
      }
    >
      {Array.from({ length: filters.limit }).map((_, index) => (
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
      {/* Hero Section — full width */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 text-white py-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-4 -left-4 w-16 h-16 bg-accent-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-8 -right-4 w-24 h-24 bg-primary-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 left-1/4 w-20 h-20 bg-accent-500/30 rounded-full blur-xl"></div>
        </div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-3">
              <Briefcase className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">Professional Services</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-display mb-2">Our Services</h1>
            <p className="text-xs text-primary-100 max-w-xl mx-auto leading-relaxed">
              Explore our range of expert services designed to help your business grow
            </p>
          </div>
        </div>
      </section>

      {/* Main Content — full width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-6">
        {/* Filters and Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-white/20 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
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
                  className="pl-7 pr-5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 appearance-none cursor-pointer min-w-[120px]"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg hover:border-primary-400 text-xs"
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

              {/* View toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Table className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter panel */}
          {(showFilters || window.innerWidth >= 1024) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 uppercase tracking-wide">
                    Price Range (Basic tier)
                  </label>
                  <div className="space-y-1">
                    {priceRanges.map(range => (
                      <button
                        key={range.value}
                        onClick={() => handlePriceChange(range.value)}
                        className={`w-full flex items-center justify-between p-1.5 rounded border text-xs ${
                          (filters.minPrice === (range.min !== '' ? range.min : '') &&
                            filters.maxPrice === (range.max !== '' ? range.max : '')) ||
                          (range.value === '' && !filters.minPrice && !filters.maxPrice)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">{range.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 uppercase tracking-wide">
                    Quick Links
                  </label>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleFilterChange('sortBy', 'view_count')}
                      className="w-full flex items-center gap-1.5 p-1.5 rounded border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                    >
                      <TrendingUp className="w-3 h-3" /> Most Popular
                    </button>
                    <button
                      onClick={() => handleFilterChange('sortBy', 'created_at')}
                      className="w-full flex items-center gap-1.5 p-1.5 rounded border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                    >
                      <Clock className="w-3 h-3" /> Newest First
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active filters */}
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
                    className="hover:text-primary-800 p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  Price:{' '}
                  {priceRanges.find(r => r.min == filters.minPrice && r.max == filters.maxPrice)
                    ?.label || 'Custom'}
                  <button
                    onClick={() => handlePriceChange('')}
                    className="hover:text-green-800 p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results header */}
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
                className="flex items-center gap-1 px-2.5 py-1 text-primary-600 hover:text-primary-700 font-medium bg-primary-50 hover:bg-primary-100 rounded text-xs"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Services grid/list */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5 text-red-500" />
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
        ) : (
          <>
            {services.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4'
                      : 'space-y-3'
                  }
                >
                  <Suspense fallback={<LoadingSkeleton />}>
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
                  <div className="border-t border-gray-200 bg-white mt-6 rounded-lg shadow-sm">
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
                          className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronsLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handlePageChange(filters.page - 1)}
                          disabled={filters.page === 1}
                          className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                          if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4)
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
                          className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={filters.page === pagination.totalPages}
                          className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronsRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
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
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Servicess