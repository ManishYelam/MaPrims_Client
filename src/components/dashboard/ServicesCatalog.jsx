// ServicesCatalog.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import {
  Briefcase,
  X,
  Clock,
  CheckCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  Table,
  User,
  Filter,
  Star,
  TrendingUp,
  DollarSign,
  Zap,
  Target,
  BarChart3,
  PlayCircle,
  Globe,
  Monitor,
  Building,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Search,
} from 'lucide-react'
import { servicesAPI } from '../../services/api'
import ServiceCard from '../../components/ui/ServiceCard'
import { AuthContext } from '../../context/AuthContext'

const ServicesCatalog = ({ sidebarCollapsed = true }) => {
  const { user } = useContext(AuthContext)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchasedServices, setPurchasedServices] = useState([])
  const [toast, setToast] = useState(null)
  const [viewMode, setViewMode] = useState('card')
  const [showMyServices, setShowMyServices] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    priceRange: 'all',
    page: 1,
    limit: 9,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    totalItems: 0,
    totalPages: 0,
  })

  const priceRanges = useMemo(
    () => [
      { value: 'all', label: 'All Prices', min: null, max: null },
      { value: 'free', label: 'Free', min: 0, max: 0 },
      { value: 'paid', label: 'Paid (₹1+)', min: 1, max: null },
      { value: '0-5000', label: '₹0 – ₹5,000', min: 0, max: 5000 },
      { value: '5001-15000', label: '₹5,001 – ₹15,000', min: 5001, max: 15000 },
      { value: '15001+', label: '₹15,001+', min: 15001, max: null },
    ],
    []
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const getUserId = useCallback(() => user?.user_id || user?.user?.user_id || null, [user])

  const fetchCatalog = useCallback(async () => {
    const payload = {
      page: filters.page,
      limit: filters.limit,
      searchFields: ['title', 'description', 'short_description'],
    }
    if (filters.search.trim()) payload.search = filters.search.trim()
    const selectedRange = priceRanges.find(r => r.value === filters.priceRange)
    if (selectedRange && selectedRange.value !== 'all') {
      payload.filters = {}
      if (selectedRange.min !== null) payload.filters.minPrice = selectedRange.min
      if (selectedRange.max !== null) payload.filters.maxPrice = selectedRange.max
    }
    try {
      setLoading(true)
      setError(null)
      const response = await servicesAPI.getAll(payload)
      const responseData = response.data
      if (responseData?.success) {
        setServices(responseData.services || [])
        setPagination(responseData.pagination || {
          page: filters.page,
          limit: filters.limit,
          totalItems: (responseData.services || []).length,
          totalPages: Math.ceil((responseData.services || []).length / filters.limit),
        })
      } else throw new Error('Invalid response')
    } catch (err) {
      setError('Failed to load services. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.limit, filters.search, filters.priceRange, priceRanges])

  const fetchMyServices = useCallback(async () => {
    const userId = getUserId()
    if (!userId) {
      setError('Please log in to view your purchased services')
      setLoading(false)
      return
    }
    const payload = { user_id: userId, page: filters.page, limit: filters.limit }
    if (filters.search.trim()) {
      payload.search = filters.search.trim()
      payload.searchFields = ['title', 'description', 'short_description']
    }
    try {
      setLoading(true)
      setError(null)
      const response = await servicesAPI.getPurchased(payload)
      const responseData = response.data
      if (responseData?.success) {
        setServices(responseData.services || [])
        setPagination(responseData.pagination || {
          page: filters.page,
          limit: filters.limit,
          totalItems: (responseData.services || []).length,
          totalPages: Math.ceil((responseData.services || []).length / filters.limit),
        })
      } else throw new Error('Invalid response')
    } catch (err) {
      setError('Failed to load your purchased services. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.limit, filters.search, getUserId])

  const fetchPurchasedStatuses = useCallback(async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      const payload = { user_id: userId, page: 1, limit: 100 }
      const response = await servicesAPI.getPurchased(payload)
      setPurchasedServices(response.data?.services || [])
    } catch (err) {
      console.error('Error fetching purchased statuses:', err)
    }
  }, [getUserId])

  const fetchData = useCallback(() => {
    if (showMyServices) return fetchMyServices()
    else return fetchCatalog()
  }, [showMyServices, fetchMyServices, fetchCatalog])

  const handleSearchChange = e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
  const handlePriceRangeChange = value => setFilters(prev => ({ ...prev, priceRange: value, page: 1 }))
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages)
      setFilters(prev => ({ ...prev, page: newPage }))
  }
  const clearAllFilters = () => {
    setFilters({ search: '', priceRange: 'all', page: 1, limit: 9 })
    showToast('All filters cleared', 'info')
  }
  const toggleMyServices = () => {
    setShowMyServices(prev => !prev)
    setFilters(prev => ({ ...prev, page: 1 }))
  }
  const hasActiveFilters = useMemo(() => filters.search !== '' || filters.priceRange !== 'all', [filters])

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchData(), 350)
    return () => clearTimeout(timeoutId)
  }, [fetchData])

  useEffect(() => {
    const userId = getUserId()
    if (userId) fetchPurchasedStatuses()
  }, [fetchPurchasedStatuses, getUserId])

  const isServicePurchased = useCallback(serviceId => purchasedServices.some(s => s.service_id === serviceId), [purchasedServices])
  const getOrderId = useCallback(serviceId => {
    const purchased = purchasedServices.find(s => s.service_id === serviceId)
    return purchased?.service_orders?.[0]?.service_order_id || null
  }, [purchasedServices])

  const FilterSection = ({ title, options, currentValue, onChange, icon: Icon }) => (
    <div className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3 h-3 text-gray-500" />
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-1">
        {options.map(option => {
          const isSelected = currentValue === option.value
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <DollarSign className={`w-3 h-3 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="font-medium">{option.label}</span>
              {isSelected && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
            </button>
          )
        })}
      </div>
    </div>
  )

  const ServiceCardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300"></div>
      <div className="p-5">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-10 bg-gray-200 rounded-xl mt-4"></div>
      </div>
    </div>
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your service catalog...</p>
        </div>
      </div>
    )
  }

  const userId = getUserId()
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please log in to explore our services.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            Refresh & Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border transform transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200'
              : toast.type === 'error'
              ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
          {toast.type === 'error' && <X className="w-6 h-6 text-red-600" />}
          {toast.type === 'info' && <Award className="w-6 h-6 text-blue-600" />}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mx-auto px-2 sm:px-3 lg:px-2">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="w-full flex items-center justify-between gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-xs"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs font-medium text-gray-900">Filters & Options</span>
              </div>
              <div className={`transform transition-transform duration-200 ${isFiltersOpen ? 'rotate-90' : '-rotate-90'}`}>
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </button>
          </div>

          {/* Sidebar Filters */}
          <div className={`lg:w-60 flex-shrink-0 transition-all duration-300 ${isFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 sticky top-4">
              <div className="mb-4 text-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                  {showMyServices ? 'My Service Portfolio' : 'Service Catalog'}
                </h1>
                <p className="text-gray-600 mt-1 text-sm">
                  {showMyServices
                    ? 'Track and manage your purchased services'
                    : 'Find the right service for your business'}
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                  <h3 className="text-base font-bold text-gray-900">Filter Services</h3>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                <FilterSection
                  title="Price Range"
                  options={priceRanges}
                  currentValue={filters.priceRange}
                  onChange={handlePriceRangeChange}
                  icon={DollarSign}
                />
              </div>

              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900">
                      {Object.values(filters).filter(v => v !== 'all' && v !== '').length} active filters
                    </span>
                    <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-800">Clear all</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {showMyServices ? '📋 My Purchased Services' : '✨ Available Services'}
                  </p>
                  <p className="text-gray-600 mt-0.5 text-xs">
                    {loading ? 'Loading services...' : `Showing ${services.length} of ${pagination.totalItems} services`}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMyServices}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${
                      showMyServices
                        ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User className={`w-3 h-3 ${showMyServices ? 'text-primary-600' : 'text-gray-600'}`} />
                    <span>{showMyServices ? 'Browse All Services' : 'View My Services'}</span>
                    {showMyServices && <Sparkles className="w-2.5 h-2.5 text-primary-500" />}
                  </button>
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Grid3X3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Table className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">Active:</span>
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-md">
                      🔍 "{filters.search}"
                      <button onClick={() => handleSearchChange({ target: { value: '' } })} className="text-blue-600">
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  )}
                  {filters.priceRange !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-md">
                      💰 {priceRanges.find(r => r.value === filters.priceRange)?.label}
                      <button onClick={() => handlePriceRangeChange('all')} className="text-green-600">
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${sidebarCollapsed ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {Array.from({ length: 6 }).map((_, idx) => <ServiceCardSkeleton key={idx} />)}
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Services</h3>
                <p className="text-gray-600 mb-6 text-lg">{error}</p>
                <button onClick={fetchData} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg">
                  Try Again
                </button>
              </div>
            ) : services.length > 0 ? (
              <>
                {viewMode === 'card' ? (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${sidebarCollapsed ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                    {services.map(service => (
                      <ServiceCard
                        key={service.service_id}
                        service={service}
                        viewMode="grid"
                        showActions={true}
                        isPurchased={isServicePurchased(service.service_id)}
                        orderId={getOrderId(service.service_id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map(service => (
                      <ServiceCard
                        key={service.service_id}
                        service={service}
                        viewMode="list"
                        showActions={true}
                        isPurchased={isServicePurchased(service.service_id)}
                        orderId={getOrderId(service.service_id)}
                      />
                    ))}
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="flex-shrink-0 border-t border-gray-200 bg-white mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <span>Showing</span>
                        <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
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
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum
                          if (pagination.totalPages <= 5) pageNum = i + 1
                          else if (filters.page <= 3) pageNum = i + 1
                          else if (filters.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
                          else pageNum = filters.page - 2 + i
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-6 h-6 text-xs rounded border transition-colors ${
                                filters.page === pageNum
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {showMyServices ? 'No Purchased Services' : 'No Services Found'}
                </h3>
                <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                  {hasActiveFilters && !showMyServices
                    ? 'No services match your current filters. Try adjusting your search criteria.'
                    : showMyServices
                    ? "You haven't purchased any services yet. Explore our catalog!"
                    : 'No published services are currently available.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {hasActiveFilters && !showMyServices && (
                    <button onClick={clearAllFilters} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium">
                      Clear Filters
                    </button>
                  )}
                  {showMyServices && (
                    <button onClick={toggleMyServices} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
                      Browse Services
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesCatalog