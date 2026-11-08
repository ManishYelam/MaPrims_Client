// src/pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../services/api';
import {
  Users, BookOpen, CreditCard, TrendingUp, BarChart3, PieChart as PieChartIcon,
  MessageSquare, Settings, AlertCircle, Layers,
  DollarSign, Clock, Package, ShoppingCart, Activity, Calendar,
  CheckCircle, FileText
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────
const formatCurrency = (amountInPaise) => {
  if (!amountInPaise && amountInPaise !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amountInPaise / 100);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ─── Date Utilities ──────────────────────────────────────
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
const formatYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseISODate = (str) => { if (!str) return null; const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const PLAN_COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

// ─── Components ──────────────────────────────────────────

const TabButton = memo(({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5 mr-1" />}
    {children}
  </button>
));

const RevenueChart = memo(({ data, title, strokeColor = '#3B82F6', fillColor = '#3B82F6' }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
    <h3 className="text-[11px] font-semibold text-gray-900 mb-1.5 flex items-center">
      <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-600" />
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis dataKey="period" stroke="#6B7280" fontSize={9} />
        <YAxis stroke="#6B7280" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
        <Tooltip formatter={(v) => formatCurrency(v)} />
        <Area type="monotone" dataKey="revenue" stroke={strokeColor} fill={fillColor} fillOpacity={0.1} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
));

const CoursePerformanceChart = memo(({ data }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
    <h3 className="text-[11px] font-semibold text-gray-900 mb-1.5 flex items-center">
      <BarChart3 className="w-3.5 h-3.5 mr-1 text-purple-600" />
      Top Courses by Enrollment
    </h3>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis type="number" stroke="#6B7280" fontSize={9} />
        <YAxis type="category" dataKey="title" width={80} stroke="#6B7280" fontSize={9} />
        <Tooltip />
        <Bar dataKey="enrollment_count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
));

const UserDistributionChart = memo(({ data }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
    <h3 className="text-[11px] font-semibold text-gray-900 mb-1.5 flex items-center">
      <PieChartIcon className="w-3.5 h-3.5 mr-1 text-green-600" />
      User Distribution
    </h3>
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ role, count }) => `${role}: ${count}`} outerRadius={50} dataKey="count">
          {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
));

const PlanDistributionChart = memo(({ data }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
    <h3 className="text-[11px] font-semibold text-gray-900 mb-1.5 flex items-center">
      <Layers className="w-3.5 h-3.5 mr-1 text-indigo-600" />
      Orders by Plan
    </h3>
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ plan_id, count }) => `${plan_id}: ${count}`} outerRadius={50} dataKey="count">
          {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={PLAN_COLORS[idx % PLAN_COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
));

const StatCard = memo(({ title, value, icon: Icon, color, change, subtitle, href }) => {
  const CardWrapper = href ? Link : 'div';
  return (
    <CardWrapper to={href || '#'} className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-gray-600 truncate">{title}</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
          {subtitle && <p className="text-[9px] text-gray-500 truncate">{subtitle}</p>}
          {change && <p className="text-[9px] text-green-600 mt-0.5 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />{change}</p>}
        </div>
        <div className={`p-1.5 rounded-md ${color} ml-2 flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </CardWrapper>
  );
});

const QuickActionsGrid = memo(({ actions, loading }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs font-semibold text-gray-900">Quick Actions</h2>
      {loading && <Activity className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
    </div>
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={idx}
            to={action.href}
            className="flex flex-col items-center p-2 border border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
          >
            <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform`}>
              <Icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <p className="font-medium text-gray-700 text-[10px] group-hover:text-primary-600">{action.name}</p>
            {action.count > 0 && (
              <span className="mt-0.5 text-[9px] px-1 py-0.5 bg-red-100 text-red-800 rounded-full">{action.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  </div>
));

const CustomRangeReport = memo(({ startDate, endDate, data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
        <Activity className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500">Fetching data for {startDate} → {endDate}...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-1" />
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border text-center text-gray-500 text-xs">
        Select a date range to see the report.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <StatCard title="New Users" value={data.newUsers} icon={Users} color="bg-blue-500" />
        <StatCard title="Enrollments" value={data.newEnrollments} icon={BookOpen} color="bg-green-500" />
        <StatCard title="Revenue" value={formatCurrency(data.revenue)} icon={DollarSign} color="bg-amber-500" />
        <StatCard title="Support Tickets" value={data.supportTickets} icon={MessageSquare} color="bg-orange-500" />
        <StatCard title="Demo Requests" value={data.demoRequests} icon={Calendar} color="bg-cyan-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <h4 className="text-[11px] font-semibold text-gray-900 mb-2">Additional Metrics</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-md">
              <FileText className="w-4 h-4 text-gray-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-gray-900">{data.blogPosts}</p>
              <p className="text-[10px] text-gray-600">Blogs</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-md">
              <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-gray-900">{data.payments}</p>
              <p className="text-[10px] text-gray-600">Payments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <h4 className="text-[11px] font-semibold text-gray-900 mb-2">Report Period</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between p-1.5 bg-blue-50 rounded-md">
              <span className="text-gray-700">Start</span>
              <span className="text-gray-900">{startDate}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-blue-50 rounded-md">
              <span className="text-gray-700">End</span>
              <span className="text-gray-900">{endDate}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-green-50 rounded-md">
              <span className="text-gray-700">Days</span>
              <span className="text-green-700 font-medium">
                {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const DateRangePicker = memo(({ dateSelectionType, setDateSelectionType, specificDate, setSpecificDate, rangeStartCustom, setRangeStartCustom, rangeEndCustom, setRangeEndCustom, startDate, endDate }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-wrap items-center gap-1.5">
    <select
      value={dateSelectionType}
      onChange={(e) => setDateSelectionType(e.target.value)}
      className="px-1.5 py-0.5 text-[10px] border rounded-md"
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="last7days">Last 7 days</option>
      <option value="monthtodate">Month to date</option>
      <option value="previous-month">Previous month</option>
      <option value="yeartodate">Year to date</option>
      <option value="previous-year">Previous year</option>
      <option value="specific-date">Specific date</option>
      <option value="date-range">Date range</option>
    </select>

    {dateSelectionType === 'specific-date' && (
      <input
        type="date"
        value={specificDate}
        onChange={(e) => setSpecificDate(e.target.value)}
        className="px-1.5 py-0.5 text-[10px] border rounded-md"
      />
    )}
    {dateSelectionType === 'date-range' && (
      <>
        <input
          type="date"
          value={rangeStartCustom}
          onChange={(e) => setRangeStartCustom(e.target.value)}
          className="px-1.5 py-0.5 text-[10px] border rounded-md"
          placeholder="Start"
        />
        <span className="text-gray-400 text-[10px]">—</span>
        <input
          type="date"
          value={rangeEndCustom}
          onChange={(e) => setRangeEndCustom(e.target.value)}
          className="px-1.5 py-0.5 text-[10px] border rounded-md"
          placeholder="End"
        />
      </>
    )}
    <div className="text-[10px] text-gray-500 ml-1">
      {startDate && endDate ? `${startDate} to ${endDate}` : 'Select date range'}
    </div>
  </div>
));

// ─── Main Component ──────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [dateSelectionType, setDateSelectionType] = useState('last7days');
  const [specificDate, setSpecificDate] = useState('');
  const [rangeStartCustom, setRangeStartCustom] = useState('');
  const [rangeEndCustom, setRangeEndCustom] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [customData, setCustomData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState('');

  const [courseOverview, setCourseOverview] = useState(null);
  const [courseRevenue, setCourseRevenue] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [serviceOverview, setServiceOverview] = useState(null);
  const [serviceRevenue, setServiceRevenue] = useState(null);
  const [serviceOrders, setServiceOrders] = useState(null);

  const userData = user?.user || user || {};

  const dateRangeCalculators = {
    today: (today) => ({ start: startOfDay(today), end: endOfDay(today) }),
    yesterday: (today) => ({ start: startOfDay(subDays(today, 1)), end: endOfDay(subDays(today, 1)) }),
    last7days: (today) => ({ start: startOfDay(subDays(today, 6)), end: endOfDay(today) }),
    monthtodate: (today) => ({ start: startOfMonth(today), end: endOfDay(today) }),
    'previous-month': (today) => ({ start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) }),
    yeartodate: (today) => ({ start: startOfYear(today), end: endOfDay(today) }),
    'previous-year': (today) => ({ start: startOfYear(subYears(today, 1)), end: endOfYear(subYears(today, 1)) }),
    'specific-date': (today, custom) => {
      if (!custom.specificDate) return null;
      const date = parseISODate(custom.specificDate);
      if (!date) return null;
      return { start: startOfDay(date), end: endOfDay(date) };
    },
    'date-range': (today, custom) => {
      if (!custom.rangeStartCustom || !custom.rangeEndCustom) return null;
      const start = parseISODate(custom.rangeStartCustom);
      const end = parseISODate(custom.rangeEndCustom);
      if (!start || !end) return null;
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  };

  const updateDatesFromSelection = useCallback(() => {
    const today = new Date();
    const calculator = dateRangeCalculators[dateSelectionType];
    if (!calculator) return;
    const custom = { specificDate, rangeStartCustom, rangeEndCustom };
    const range = calculator(today, custom);
    if (range) {
      setStartDate(formatYMD(range.start));
      setEndDate(formatYMD(range.end));
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [dateSelectionType, specificDate, rangeStartCustom, rangeEndCustom]);

  useEffect(() => {
    updateDatesFromSelection();
  }, [updateDatesFromSelection]);

  const fetchCustomAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setCustomLoading(true);
      setCustomError('');
      const response = await analyticsAPI.getCustomAnalytics({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      if (response.data.success) {
        setCustomData(response.data.data);
      } else {
        setCustomError('Failed to fetch custom analytics data');
      }
    } catch (err) {
      console.error(err);
      setCustomError('Error fetching custom analytics data');
    } finally {
      setCustomLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'custom' && startDate && endDate) {
      fetchCustomAnalytics();
    }
  }, [activeTab, startDate, endDate, fetchCustomAnalytics]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewRes, revenueRes, userRes, courseAnalyticsRes, serviceOverviewRes, serviceRevenueRes, serviceOrdersRes] =
        await Promise.all([
          analyticsAPI.getDashboardOverview(),
          analyticsAPI.getRevenueAnalytics({ period: 'monthly' }),
          analyticsAPI.getUserAnalytics(),
          analyticsAPI.getCourseAnalytics(),
          analyticsAPI.getServiceOverview(),
          analyticsAPI.getServiceRevenueAnalytics(),
          analyticsAPI.getServiceOrderAnalytics(),
        ]);

      if (overviewRes.data.success) setCourseOverview(overviewRes.data.data);
      if (revenueRes.data.success) setCourseRevenue(revenueRes.data.data);
      if (userRes.data.success) setUserStats(userRes.data.data);
      if (courseAnalyticsRes.data.success) setCourseStats(courseAnalyticsRes.data.data);
      if (serviceOverviewRes.data.success) setServiceOverview(serviceOverviewRes.data.data);
      if (serviceRevenueRes.data.success) setServiceRevenue(serviceRevenueRes.data.data);
      if (serviceOrdersRes.data.success) setServiceOrders(serviceOrdersRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'custom') {
      fetchDashboardData();
    }
  }, [activeTab, fetchDashboardData]);

  const combinedStats = useMemo(() => {
    const course = courseOverview || {};
    const service = serviceOverview?.overview || {};
    return {
      totalStudents: course.totalUsers || 0,
      activeUsers: course.activeUsers || 0,
      totalCourses: course.totalCourses || 0,
      totalServices: service.total_services || 0,
      totalRevenue: (course.totalRevenue || 0) + (service.total_revenue || 0),
      totalEnrollments: course.totalEnrollments || 0,
      totalOrders: service.total_orders || 0,
      pendingApprovals: course.pendingApprovals || 0,
      supportTickets: course.supportTickets || 0,
    };
  }, [courseOverview, serviceOverview]);

  const overviewStatsCards = useMemo(() => [
    { title: 'Students', value: combinedStats.totalStudents.toLocaleString(), icon: Users, color: 'bg-blue-500', href: '/dashboard/students', subtitle: `${combinedStats.activeUsers} active` },
    { title: 'Courses', value: combinedStats.totalCourses, icon: BookOpen, color: 'bg-green-500', href: '/dashboard/courses' },
    { title: 'Services', value: combinedStats.totalServices, icon: Package, color: 'bg-purple-500', href: '/dashboard/services' },
    { title: 'Revenue', value: formatCurrency(combinedStats.totalRevenue), icon: CreditCard, color: 'bg-amber-500', href: '/dashboard/payments', change: `${courseRevenue?.revenueGrowth || 0}%` },
    { title: 'Enrollments', value: combinedStats.totalEnrollments, icon: TrendingUp, color: 'bg-indigo-500', href: '/dashboard/enrollments' },
    { title: 'Orders', value: combinedStats.totalOrders, icon: ShoppingCart, color: 'bg-cyan-500', href: '/dashboard/service-orders' },
    { title: 'Pending', value: combinedStats.pendingApprovals, icon: Clock, color: 'bg-yellow-500', href: '/dashboard/students?filter=pending' },
    { title: 'Support', value: combinedStats.supportTickets, icon: MessageSquare, color: 'bg-orange-500', href: '/dashboard/support' },
  ], [combinedStats, courseRevenue]);

  const coursesStatsCards = useMemo(() => [
    { title: 'Total Courses', value: courseOverview?.totalCourses || 0, icon: BookOpen, color: 'bg-green-500', href: '/dashboard/courses' },
    { title: 'Total Enrollments', value: courseOverview?.totalEnrollments || 0, icon: TrendingUp, color: 'bg-indigo-500', href: '/dashboard/enrollments' },
    { title: 'Active Enrollments', value: courseStats?.activeEnrollments || 0, icon: Activity, color: 'bg-teal-500' },
    { title: 'Course Revenue', value: formatCurrency(courseOverview?.totalRevenue || 0), icon: DollarSign, color: 'bg-amber-500', href: '/dashboard/payments' },
  ], [courseOverview, courseStats]);

  const servicesStatsCards = useMemo(() => [
    { title: 'Total Services', value: serviceOverview?.overview?.total_services || 0, icon: Package, color: 'bg-purple-500', href: '/dashboard/services' },
    { title: 'Active Services', value: serviceOverview?.overview?.active_services || 0, icon: Activity, color: 'bg-green-500' },
    { title: 'Total Orders', value: serviceOverview?.overview?.total_orders || 0, icon: ShoppingCart, color: 'bg-cyan-500', href: '/dashboard/service-orders' },
    { title: 'Service Revenue', value: formatCurrency(serviceOverview?.overview?.total_revenue || 0), icon: DollarSign, color: 'bg-amber-500', href: '/dashboard/payments' },
    { title: 'Pending Orders', value: serviceOverview?.overview?.pending_orders || 0, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Completed Orders', value: serviceOverview?.overview?.completed_orders || 0, icon: CheckCircle, color: 'bg-blue-500' },
  ], [serviceOverview]);

  const quickActions = useMemo(() => [
    { name: 'Users', icon: Users, bgColor: 'bg-blue-50', color: 'text-blue-600', href: '/dashboard/users', count: combinedStats.pendingApprovals },
    { name: 'Courses', icon: BookOpen, bgColor: 'bg-green-50', color: 'text-green-600', href: '/dashboard/courses', count: 0 },
    { name: 'Services', icon: Package, bgColor: 'bg-purple-50', color: 'text-purple-600', href: '/dashboard/services', count: 0 },
    { name: 'Settings', icon: Settings, bgColor: 'bg-gray-50', color: 'text-gray-600', href: '/dashboard/system', count: 0 },
  ], [combinedStats.pendingApprovals]);

  const revenueTrendData = courseRevenue?.revenueTrend || [];
  const coursePerformanceData = courseStats?.courseStats?.slice(0, 5) || [];
  const userDistributionData = userStats?.userStats || [];
  const serviceRevenueData = serviceRevenue?.revenueTrend || [];
  const planDistributionData = serviceOrders?.planDistribution || [];
  const recentEnrollments = courseStats?.recentEnrollments || [];

  if (error && !courseOverview && activeTab !== 'custom') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-1" />
          <h3 className="font-semibold text-red-800 text-sm">Failed to load</h3>
          <p className="text-red-600 text-xs my-1">{error}</p>
          <button onClick={fetchDashboardData} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4 px-1 sm:px-0">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex space-x-0.5 bg-white rounded-lg border border-gray-200 p-1">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Layers}>Overview</TabButton>
          <TabButton active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={BookOpen}>Courses</TabButton>
          <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={Package}>Services</TabButton>
          <TabButton active={activeTab === 'custom'} onClick={() => setActiveTab('custom')} icon={Calendar}>Custom</TabButton>
        </div>

        {activeTab === 'custom' && (
          <DateRangePicker
            dateSelectionType={dateSelectionType}
            setDateSelectionType={setDateSelectionType}
            specificDate={specificDate}
            setSpecificDate={setSpecificDate}
            rangeStartCustom={rangeStartCustom}
            setRangeStartCustom={setRangeStartCustom}
            rangeEndCustom={rangeEndCustom}
            setRangeEndCustom={setRangeEndCustom}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {overviewStatsCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <RevenueChart data={revenueTrendData} title="Course Revenue Trend" />
            <RevenueChart data={serviceRevenueData} title="Service Revenue Trend" strokeColor="#8B5CF6" fillColor="#8B5CF6" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CoursePerformanceChart data={coursePerformanceData} />
            <UserDistributionChart data={userDistributionData} />
          </div>
          {planDistributionData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <PlanDistributionChart data={planDistributionData} />
              <div className="bg-white rounded-lg p-2 shadow-sm border">
                <h3 className="text-[11px] font-semibold mb-1.5 flex items-center"><Package className="w-3.5 h-3.5 mr-1 text-purple-600" /> Service Overview</h3>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Services</span><span className="font-semibold">{serviceOverview?.overview?.total_services || 0}</span></div>
                  <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Active</span><span>{serviceOverview?.overview?.active_services || 0}</span></div>
                  <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Orders</span><span>{serviceOverview?.overview?.total_orders || 0}</span></div>
                  <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Pending Orders</span><span className="text-yellow-600">{serviceOverview?.overview?.pending_orders || 0}</span></div>
                </div>
              </div>
            </div>
          )}
          <QuickActionsGrid actions={quickActions} loading={loading} />
          <div className="bg-white rounded-lg p-2 shadow-sm border">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-semibold">Recent Enrollments</h2>
              <Link to="/dashboard/enrollments" className="text-primary-600 text-[10px]">View all</Link>
            </div>
            {loading ? (
              <div className="space-y-1.5">{[...Array(3)].map((_,i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse"></div>)}</div>
            ) : recentEnrollments.length ? (
              <div className="space-y-1.5">
                {recentEnrollments.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white flex items-center justify-center text-[10px] font-semibold">
                        {e.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium">{e.user?.full_name}</p>
                        <p className="text-[9px] text-gray-500">{e.course?.title}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getStatusColor(e.status)}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">No recent enrollments</div>
            )}
          </div>
        </>
      )}

      {activeTab === 'courses' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {coursesStatsCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <RevenueChart data={revenueTrendData} title="Course Revenue Trend" />
            <CoursePerformanceChart data={coursePerformanceData} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <UserDistributionChart data={userDistributionData} />
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <h3 className="text-[11px] font-semibold mb-1.5">Course Overview</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Courses</span><span>{courseOverview?.totalCourses || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Enrollments</span><span>{courseOverview?.totalEnrollments || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Completion Rate</span><span>{courseOverview?.completionRate || 0}%</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Active Enrollments</span><span>{courseStats?.activeEnrollments || 0}</span></div>
              </div>
            </div>
          </div>
          <QuickActionsGrid actions={quickActions} loading={loading} />
        </>
      )}

      {activeTab === 'services' && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {servicesStatsCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <RevenueChart data={serviceRevenueData} title="Service Revenue Trend" strokeColor="#8B5CF6" fillColor="#8B5CF6" />
            <PlanDistributionChart data={planDistributionData} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <h3 className="text-[11px] font-semibold mb-1.5 flex items-center"><Package className="w-3.5 h-3.5 mr-1 text-purple-600" /> Service Details</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Services</span><span>{serviceOverview?.overview?.total_services || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Active Services</span><span>{serviceOverview?.overview?.active_services || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Total Orders</span><span>{serviceOverview?.overview?.total_orders || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Pending Orders</span><span className="text-yellow-600">{serviceOverview?.overview?.pending_orders || 0}</span></div>
                <div className="flex justify-between p-1.5 bg-gray-50 rounded"><span>Completed Orders</span><span className="text-green-600">{serviceOverview?.overview?.completed_orders || 0}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border">
              <h3 className="text-[11px] font-semibold mb-1.5 flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1 text-amber-600" /> Revenue Breakdown</h3>
              <div className="space-y-1.5 text-[11px]">
                {serviceRevenue?.revenueByPlan?.map((plan, idx) => (
                  <div key={idx} className="flex justify-between p-1.5 bg-gray-50 rounded">
                    <span className="capitalize">{plan.plan_id}</span>
                    <span className="font-semibold">{formatCurrency(plan.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <QuickActionsGrid actions={quickActions} loading={loading} />
        </>
      )}

      {activeTab === 'custom' && (
        <CustomRangeReport
          startDate={startDate}
          endDate={endDate}
          data={customData}
          loading={customLoading}
          error={customError}
        />
      )}
    </div>
  );
};

export default React.memo(AdminDashboard);