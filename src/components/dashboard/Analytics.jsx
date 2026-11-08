// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { analyticsAPI } from '../../services/api'
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw,
  UserCheck,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  AlertCircle,
  Eye,
  Package,
  ShoppingCart,
  Truck,
  Heart,
  CheckCircle,
  Award,
  Layers,
} from 'lucide-react'

// ==================== Memoized Sub‑components ====================
const StatCard = memo(({ title, value, icon: Icon, color, change, subtitle }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-150">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-600 truncate mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        {change && (
          <div className="flex items-center mt-1 text-xs text-gray-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            {change}
          </div>
        )}
      </div>
      <div className={`p-2 rounded-md ${color} ml-3 flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
))
StatCard.displayName = 'StatCard'

const TabButton = memo(({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${active
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
  >
    {Icon && <Icon className="w-4 h-4 mr-2" />}
    {children}
  </button>
))
TabButton.displayName = 'TabButton'

const RevenueChart = memo(({ data, color = '#3B82F6' }) => (
  <ResponsiveContainer width="100%" height={200}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
      <XAxis dataKey="period" stroke="#6B7280" fontSize={11} />
      <YAxis stroke="#6B7280" fontSize={11} />
      <Tooltip
        formatter={value => [
          new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          }).format(value / 100),
          'Revenue',
        ]}
        contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
      />
      <Area type="monotone" dataKey="revenue" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={1.5} />
    </AreaChart>
  </ResponsiveContainer>
))
RevenueChart.displayName = 'RevenueChart'

const UserDistributionChart = memo(({ data, colors }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ role, count }) => `${role}: ${count}`}
        outerRadius={60}
        fill="#8884d8"
        dataKey="count"
      >
        {data?.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
))
UserDistributionChart.displayName = 'UserDistributionChart'

const CoursePerformanceChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
      <XAxis type="number" stroke="#6B7280" fontSize={11} />
      <YAxis type="category" dataKey="title" width={80} stroke="#6B7280" fontSize={11} />
      <Tooltip />
      <Bar dataKey="enrollmentCount" fill="#8B5CF6" radius={[0, 3, 3, 0]} />
    </BarChart>
  </ResponsiveContainer>
))
CoursePerformanceChart.displayName = 'CoursePerformanceChart'

const SupportChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
      <XAxis dataKey="status" stroke="#6B7280" fontSize={11} />
      <YAxis stroke="#6B7280" fontSize={11} />
      <Tooltip />
      <Bar dataKey="count" fill="#F59E0B" radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
))
SupportChart.displayName = 'SupportChart'

const ServiceRevenueTrendChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
      <XAxis dataKey="period" stroke="#6B7280" fontSize={11} />
      <YAxis stroke="#6B7280" fontSize={11} />
      <Tooltip
        formatter={value => [
          new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          }).format(value / 100),
          'Revenue',
        ]}
      />
      <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 2 }} />
    </LineChart>
  </ResponsiveContainer>
))
ServiceRevenueTrendChart.displayName = 'ServiceRevenueTrendChart'

const PlanDistributionChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data || []}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ plan_id, count }) => `${plan_id}: ${count}`}
        outerRadius={60}
        fill="#8884d8"
        dataKey="count"
      >
        {(data || []).map((entry, index) => (
          <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
))
PlanDistributionChart.displayName = 'PlanDistributionChart'

// ==================== Main Component ====================
const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('monthly')

  // Data states
  const [courseOverview, setCourseOverview] = useState(null)
  const [courseRevenue, setCourseRevenue] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [courseStats, setCourseStats] = useState(null)
  const [supportStats, setSupportStats] = useState(null)
  const [blogStats, setBlogStats] = useState(null)

  const [serviceOverview, setServiceOverview] = useState(null)
  const [serviceRevenue, setServiceRevenue] = useState(null)
  const [serviceOrders, setServiceOrders] = useState(null)
  const [servicePerformance, setServicePerformance] = useState(null)

  // Custom date range states (unchanged)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customData, setCustomData] = useState(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState('')
  const [dateSelectionType, setDateSelectionType] = useState('today')
  const [specificDate, setSpecificDate] = useState('')
  const [rangeStartCustom, setRangeStartCustom] = useState('')
  const [rangeEndCustom, setRangeEndCustom] = useState('')

  const COLORS = useMemo(() => ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], [])
  const formatCurrency = useCallback(amount => {
    if (!amount) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }, [])

  // ========== Date helpers (same as before) ==========
  const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const endOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r }
  const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r }
  const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r }
  const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  const startOfYear = date => new Date(date.getFullYear(), 0, 1)
  const endOfYear = date => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
  const formatYMD = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const parseISODate = str => { if (!str) return null; const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d) }

  const dateRangeCalculators = {
    today: today => ({ start: startOfDay(today), end: endOfDay(today) }),
    yesterday: today => ({ start: startOfDay(subDays(today, 1)), end: endOfDay(subDays(today, 1)) }),
    last7days: today => ({ start: startOfDay(subDays(today, 6)), end: endOfDay(today) }),
    monthtodate: today => ({ start: startOfMonth(today), end: endOfDay(today) }),
    'previous-month': today => ({ start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) }),
    yeartodate: today => ({ start: startOfYear(today), end: endOfDay(today) }),
    'previous-year': today => ({ start: startOfYear(subYears(today, 1)), end: endOfYear(subYears(today, 1)) }),
    'specific-date': (today, custom) => {
      if (!custom.specificDate) return null
      const date = parseISODate(custom.specificDate)
      if (!date) return null
      return { start: startOfDay(date), end: endOfDay(date) }
    },
    'date-range': (today, custom) => {
      if (!custom.rangeStartCustom || !custom.rangeEndCustom) return null
      const start = parseISODate(custom.rangeStartCustom)
      const end = parseISODate(custom.rangeEndCustom)
      if (!start || !end) return null
      return { start: startOfDay(start), end: endOfDay(end) }
    },
  }

  const updateDatesFromSelection = useCallback(() => {
    const today = new Date()
    const calculator = dateRangeCalculators[dateSelectionType]
    if (!calculator) return
    const custom = { specificDate, rangeStartCustom, rangeEndCustom }
    const range = calculator(today, custom)
    if (range) {
      setStartDate(formatYMD(range.start))
      setEndDate(formatYMD(range.end))
    } else {
      setStartDate('')
      setEndDate('')
    }
  }, [dateSelectionType, specificDate, rangeStartCustom, rangeEndCustom])

  useEffect(() => { updateDatesFromSelection() }, [updateDatesFromSelection])

  // ========== Fetch all data once ==========
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [
        overviewRes,
        revenueRes,
        userRes,
        courseAnalyticsRes,
        supportRes,
        blogRes,
        serviceOverviewRes,
        serviceRevenueRes,
        serviceOrdersRes,
        servicePerformanceRes,
      ] = await Promise.all([
        analyticsAPI.getDashboardOverview(),
        analyticsAPI.getRevenueAnalytics({ period }),
        analyticsAPI.getUserAnalytics(),
        analyticsAPI.getCourseAnalytics(),
        analyticsAPI.getSupportAnalytics(),
        analyticsAPI.getBlogAnalytics(),
        analyticsAPI.getServiceOverview(),
        analyticsAPI.getServiceRevenueAnalytics(),
        analyticsAPI.getServiceOrderAnalytics(),
        analyticsAPI.getServicePerformance(),
      ])

      if (overviewRes.data.success) setCourseOverview(overviewRes.data.data)
      if (revenueRes.data.success) setCourseRevenue(revenueRes.data.data)
      if (userRes.data.success) setUserStats(userRes.data.data)
      if (courseAnalyticsRes.data.success) setCourseStats(courseAnalyticsRes.data.data)
      if (supportRes.data.success) setSupportStats(supportRes.data.data)
      if (blogRes.data.success) setBlogStats(blogRes.data.data)

      if (serviceOverviewRes.data.success) setServiceOverview(serviceOverviewRes.data.data)
      if (serviceRevenueRes.data.success) setServiceRevenue(serviceRevenueRes.data.data)
      if (serviceOrdersRes.data.success) setServiceOrders(serviceOrdersRes.data.data)
      if (servicePerformanceRes.data.success) setServicePerformance(servicePerformanceRes.data.data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const fetchCustomAnalytics = useCallback(async () => {
    if (!startDate || !endDate) { setCustomError('Please select both start and end dates'); return }
    try {
      setCustomLoading(true)
      setCustomError('')
      const response = await analyticsAPI.getCustomAnalytics({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      })
      if (response.data.success) setCustomData(response.data.data)
      else setCustomError('Failed to fetch custom analytics data')
    } catch (err) {
      console.error('Custom analytics error:', err)
      setCustomError('Error fetching custom analytics data')
    } finally {
      setCustomLoading(false)
    }
  }, [startDate, endDate])

  // ========== Derived combined stats for Overview tab ==========
  const combinedStats = useMemo(() => {
    const course = courseOverview || {}
    const service = serviceOverview?.overview || {}
    return {
      totalUsers: course.totalUsers || 0,
      activeUsers: course.activeUsers || 0,
      totalCourses: course.totalCourses || 0,
      totalServices: service.total_services || 0,
      totalItems: (course.totalCourses || 0) + (service.total_services || 0),
      courseRevenue: course.totalRevenue || 0,
      serviceRevenue: service.total_revenue || 0,
      totalRevenue: (course.totalRevenue || 0) + (service.total_revenue || 0),
      totalEnrollments: course.totalEnrollments || 0,
      totalOrders: service.total_orders || 0,
      totalEngagements: (course.totalEnrollments || 0) + (service.total_orders || 0),
      supportTickets: course.supportTickets || 0,
      demoRequests: course.demoRequests || 0,
      totalBlogs: course.totalBlogs || 0,
    }
  }, [courseOverview, serviceOverview])

  const revenueGrowth = courseRevenue?.revenueGrowth || 0

  if (loading && activeTab === 'overview') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 flex-wrap">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Layers}>Overview (Combined)</TabButton>
          <TabButton active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={BookOpen}>Courses & Enrollments</TabButton>
          <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={Package}>Services & Orders</TabButton>
          <TabButton active={activeTab === 'custom'} onClick={() => setActiveTab('custom')} icon={Calendar}>Custom Range</TabButton>
        </div>

        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ========== Overview Tab (Combined) ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div><h1 className="text-xl font-bold text-gray-900">Combined Platform Overview</h1><p className="text-xs text-gray-600 mt-0.5">Courses + Services metrics</p></div>
              <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
                <button onClick={fetchAllData} className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"><RefreshCw className="w-3 h-3 mr-1.5" /> Refresh</button>
              </div>
            </div>

            {/* Combined Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Total Users" value={combinedStats.totalUsers} icon={Users} color="bg-blue-500" subtitle={`${combinedStats.activeUsers} active`} />
              <StatCard title="Total Items" value={combinedStats.totalItems} icon={Layers} color="bg-indigo-500" subtitle={`${combinedStats.totalCourses} courses + ${combinedStats.totalServices} services`} />
              <StatCard title="Total Revenue" value={formatCurrency(combinedStats.totalRevenue)} icon={DollarSign} color="bg-amber-500" change={`${revenueGrowth}% growth`} />
              <StatCard title="Active Users" value={combinedStats.activeUsers} icon={UserCheck} color="bg-purple-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <StatCard title="Enrollments" value={combinedStats.totalEnrollments} icon={TrendingUp} color="bg-blue-400" />
              <StatCard title="Service Orders" value={combinedStats.totalOrders} icon={ShoppingCart} color="bg-green-500" />
              <StatCard title="Total Engagements" value={combinedStats.totalEngagements} icon={CheckCircle} color="bg-teal-500" />
              <StatCard title="Support Tickets" value={combinedStats.supportTickets} icon={MessageSquare} color="bg-orange-500" />
              <StatCard title="Blog Posts" value={combinedStats.totalBlogs} icon={FileText} color="bg-pink-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" /> Course Revenue Trend</h3><RevenueChart data={courseRevenue?.revenueTrend || []} color="#3B82F6" /></div>
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-purple-600" /> Service Revenue Trend</h3><ServiceRevenueTrendChart data={serviceRevenue?.revenueTrend || []} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><PieChartIcon className="w-4 h-4 mr-1.5 text-green-600" /> User Distribution</h3><UserDistributionChart data={userStats?.userStats || []} colors={COLORS} /></div>
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><MessageSquare className="w-4 h-4 mr-1.5 text-orange-600" /> Support Tickets</h3><SupportChart data={supportStats?.ticketStats || []} /></div>
            </div>
          </div>
        )}

        {/* ========== Courses & Enrollments Tab ========== */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div><h1 className="text-xl font-bold text-gray-900">Courses & Enrollments Analytics</h1><p className="text-xs text-gray-600 mt-0.5">Detailed course performance metrics</p></div>
              <button onClick={fetchAllData} className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"><RefreshCw className="w-3 h-3 mr-1.5" /> Refresh</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Total Courses" value={courseOverview?.totalCourses || 0} icon={BookOpen} color="bg-green-500" />
              <StatCard title="Total Enrollments" value={courseOverview?.totalEnrollments || 0} icon={TrendingUp} color="bg-blue-500" />
              <StatCard title="Active Enrollments" value={courseStats?.activeEnrollments || 0} icon={CheckCircle} color="bg-teal-500" />
              <StatCard title="Completed Enrollments" value={courseStats?.completedEnrollments || 0} icon={Award} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" /> Revenue Trend (Courses)</h3><RevenueChart data={courseRevenue?.revenueTrend || []} /></div>
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><BarChart3 className="w-4 h-4 mr-1.5 text-purple-600" /> Top Courses</h3><CoursePerformanceChart data={courseStats?.courseStats?.slice(0, 5) || []} /></div>
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><PieChartIcon className="w-4 h-4 mr-1.5 text-green-600" /> User Distribution</h3><UserDistributionChart data={userStats?.userStats || []} colors={COLORS} /></div>
              <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><MessageSquare className="w-4 h-4 mr-1.5 text-orange-600" /> Support Tickets</h3><SupportChart data={supportStats?.ticketStats || []} /></div>
            </div>

            {blogStats && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><FileText className="w-4 h-4 mr-1.5 text-pink-600" /> Blog Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-md"><p className="text-lg font-bold text-gray-900">{blogStats.totalBlogs}</p><p className="text-xs text-gray-600">Total</p></div>
                  <div className="text-center p-3 bg-gray-50 rounded-md"><p className="text-lg font-bold text-gray-900">{blogStats.totalViews}</p><p className="text-xs text-gray-600">Views</p></div>
                  <div className="text-center p-3 bg-gray-50 rounded-md"><p className="text-lg font-bold text-gray-900">{Math.round(blogStats.avgViews || 0)}</p><p className="text-xs text-gray-600">Avg Views</p></div>
                  <div className="text-center p-3 bg-gray-50 rounded-md"><p className="text-lg font-bold text-gray-900">{blogStats.publishedBlogs}</p><p className="text-xs text-gray-600">Published</p></div>
                </div>
                <div><h4 className="text-xs font-semibold text-gray-900 mb-3">Popular Blogs</h4><div className="space-y-2">{blogStats.popularBlogs?.slice(0, 3).map(blog => (<div key={blog.blog_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md"><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{blog.title}</p><p className="text-xs text-gray-600 truncate">By {blog.author?.full_name}</p></div><div className="flex items-center space-x-1"><Eye className="w-3 h-3 text-gray-400" /><span className="text-xs font-medium text-gray-900">{blog.view_count}</span></div></div>))}</div></div>
              </div>
            )}
          </div>
        )}

        {/* ========== Services Tab ========== */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div><h1 className="text-xl font-bold text-gray-900">Service Analytics</h1><p className="text-xs text-gray-600 mt-0.5">Performance metrics for services</p></div>
              <button onClick={fetchAllData} className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"><RefreshCw className="w-3 h-3 mr-1.5" /> Refresh</button>
            </div>

            {serviceOverview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard title="Total Services" value={serviceOverview.overview?.total_services || 0} icon={Package} color="bg-blue-500" subtitle={`${serviceOverview.overview?.active_services || 0} active`} />
                  <StatCard title="Total Orders" value={serviceOverview.overview?.total_orders || 0} icon={ShoppingCart} color="bg-green-500" />
                  <StatCard title="Revenue" value={formatCurrency(serviceOverview.overview?.total_revenue || 0)} icon={DollarSign} color="bg-amber-500" />
                  <StatCard title="Pending Orders" value={serviceOverview.overview?.pending_orders || 0} icon={Clock} color="bg-yellow-500" subtitle={`${serviceOverview.overview?.completed_orders || 0} completed`} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatCard title="Tips Revenue" value={formatCurrency(serviceOverview.overview?.tip_revenue || 0)} icon={Heart} color="bg-pink-500" />
                  <StatCard title="Fast Delivery Orders" value={serviceOverview.overview?.fast_delivery_orders || 0} icon={Truck} color="bg-purple-500" />
                  <StatCard title="Extra Services Orders" value={serviceOverview.overview?.extra_services_orders || 0} icon={Package} color="bg-indigo-500" />
                  <StatCard title="Completed Orders" value={serviceOverview.overview?.completed_orders || 0} icon={CheckCircle} color="bg-green-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" /> Service Revenue Trend</h3><ServiceRevenueTrendChart data={serviceRevenue?.revenueTrend || []} /></div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 flex items-center"><PieChartIcon className="w-4 h-4 mr-1.5 text-green-600" /> Orders by Plan</h3><PlanDistributionChart data={serviceOrders?.planDistribution || []} /></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-amber-500" /> Revenue by Plan</h3><div className="space-y-2">{serviceRevenue?.revenueByPlan?.map(plan => (<div key={plan.plan_id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span className="text-sm font-medium capitalize">{plan.plan_id}</span><span className="text-sm font-semibold text-gray-900">{formatCurrency(plan.revenue)}</span></div>))}</div></div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><ShoppingCart className="w-4 h-4 mr-1.5 text-purple-600" /> Add‑on Usage</h3><div className="space-y-3"><div className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span className="text-sm">Orders with Tip</span><span className="text-sm font-semibold">{serviceOrders?.addonUsage?.ordersWithTip || 0}</span></div><div className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span className="text-sm">Avg Tip %</span><span className="text-sm font-semibold">{serviceOrders?.addonUsage?.avgTipPercentage?.toFixed(1) || 0}%</span></div><div className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span className="text-sm">Extra Services</span><span className="text-sm font-semibold">{serviceOrders?.addonUsage?.ordersWithExtraServices || 0}</span></div><div className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span className="text-sm">Fast Delivery</span><span className="text-sm font-semibold">{serviceOrders?.addonUsage?.ordersWithFastDelivery || 0}</span></div></div></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><BarChart3 className="w-4 h-4 mr-1.5 text-purple-600" /> Top Services by Orders</h3><div className="space-y-2">{servicePerformance?.topServicesByOrders?.slice(0, 5).map(service => (<div key={service.service_id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><div><p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{service.service?.title}</p><p className="text-xs text-gray-500">{service.orderCount} orders</p></div><span className="text-sm font-semibold text-gray-900">{formatCurrency(service.revenue)}</span></div>))}</div></div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" /> Conversion Rates (Views → Orders)</h3><div className="space-y-2">{servicePerformance?.conversionRates?.slice(0, 5).map(c => (<div key={c.service_id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><div><p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{c.title}</p><p className="text-xs text-gray-500">{c.views} views</p></div><span className="text-sm font-semibold text-green-600">{c.conversionRate}%</span></div>))}</div></div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"><Package className="w-12 h-12 text-gray-400 mx-auto mb-3" /><h3 className="text-lg font-medium text-gray-900">No service data available</h3><p className="text-gray-500">Services analytics will appear here once orders are placed.</p></div>
            )}
          </div>
        )}

        {/* ========== Custom Range Tab (unchanged) ========== */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-bold text-gray-900">Custom Date Analytics</h1><p className="text-xs text-gray-600 mt-0.5">Generate reports for specific periods</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-blue-600" /> Select Date Range</h3>
              <div className="mb-4"><label className="block text-xs font-medium text-gray-700 mb-1">Quick Select</label><select value={dateSelectionType} onChange={e => setDateSelectionType(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last7days">Last 7 days</option><option value="monthtodate">Month to date</option><option value="previous-month">Previous month</option><option value="yeartodate">Year to date</option><option value="previous-year">Previous year</option><option value="specific-date">Specific date</option><option value="date-range">Date range</option></select></div>
              {dateSelectionType === 'specific-date' && <div className="mb-4"><label className="block text-xs font-medium text-gray-700 mb-1">Choose a date</label><input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500" /></div>}
              {dateSelectionType === 'date-range' && <div className="grid grid-cols-2 gap-3 mb-4"><div><label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={rangeStartCustom} onChange={e => setRangeStartCustom(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500" /></div><div><label className="block text-xs font-medium text-gray-700 mb-1">End Date</label><input type="date" value={rangeEndCustom} onChange={e => setRangeEndCustom(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500" /></div></div>}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex-1 bg-gray-50 p-2 rounded-md"><p className="text-xs text-gray-600">From</p><p className="text-sm font-medium text-gray-900">{startDate || '—'}</p></div><div className="flex-1 bg-gray-50 p-2 rounded-md"><p className="text-xs text-gray-600">To</p><p className="text-sm font-medium text-gray-900">{endDate || '—'}</p></div><button onClick={fetchCustomAnalytics} disabled={customLoading} className="flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{customLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> : <Download className="w-3 h-3 mr-1.5" />}{customLoading ? 'Generating...' : 'Generate'}</button></div>
              {customError && <div className="flex items-center mt-3 p-2 bg-red-50 border border-red-200 rounded-md"><AlertCircle className="w-3 h-3 text-red-600 mr-1.5" /><p className="text-xs text-red-600">{customError}</p></div>}
            </div>
            {customData && <div className="space-y-4"><div className="bg-white rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4">Report Summary</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-2"><StatCard title="New Users" value={customData.newUsers} icon={Users} color="bg-blue-500" /><StatCard title="Enrollments" value={customData.newEnrollments} icon={BookOpen} color="bg-green-500" /><StatCard title="Revenue" value={formatCurrency(customData.revenue)} icon={DollarSign} color="bg-amber-500" /><StatCard title="Tickets" value={customData.supportTickets} icon={MessageSquare} color="bg-orange-500" /><StatCard title="Demos" value={customData.demoRequests} icon={Calendar} color="bg-cyan-500" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white rounded-lg border border-gray-200 p-4"><h4 className="text-xs font-semibold text-gray-900 mb-3">Additional Metrics</h4><div className="grid grid-cols-2 gap-3"><div className="text-center p-2 bg-gray-50 rounded-md"><FileText className="w-5 h-5 text-gray-600 mx-auto mb-1" /><p className="text-sm font-bold text-gray-900">{customData.blogPosts}</p><p className="text-xs text-gray-600">Blogs</p></div><div className="text-center p-2 bg-gray-50 rounded-md"><DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" /><p className="text-sm font-bold text-gray-900">{customData.payments}</p><p className="text-xs text-gray-600">Payments</p></div></div></div><div className="bg-white rounded-lg border border-gray-200 p-4"><h4 className="text-xs font-semibold text-gray-900 mb-3">Report Period</h4><div className="space-y-2"><div className="flex items-center justify-between p-2 bg-blue-50 rounded-md"><span className="text-xs text-gray-700">Start</span><span className="text-xs text-gray-900">{new Date(customData.period.startDate).toLocaleDateString()}</span></div><div className="flex items-center justify-between p-2 bg-blue-50 rounded-md"><span className="text-xs text-gray-700">End</span><span className="text-xs text-gray-900">{new Date(customData.period.endDate).toLocaleDateString()}</span></div><div className="flex items-center justify-between p-2 bg-green-50 rounded-md"><span className="text-xs text-gray-700">Days</span><span className="text-xs text-green-700 font-medium">{Math.ceil((new Date(customData.period.endDate) - new Date(customData.period.startDate)) / (1000 * 60 * 60 * 24))}</span></div></div></div></div></div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics