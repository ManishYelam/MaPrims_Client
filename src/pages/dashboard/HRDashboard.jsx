import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, Clock, Briefcase, TrendingUp, DollarSign,
  Calendar, GraduationCap, Receipt, File, AlertCircle, RefreshCw,
  BarChart3, PieChartIcon, List, Bell, Star, Target, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  Legend,
} from 'recharts';
import { hrAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16'];

const StatCard = ({ title, value, icon: Icon, color, subtitle, loading }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 h-full flex flex-col justify-center">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-gray-500 truncate">{title}</p>
        {loading ? (
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value ?? '—'}</p>
        )}
        {!loading && subtitle && <p className="text-[9px] text-gray-400 truncate">{subtitle}</p>}
      </div>
      <div className={`p-1.5 rounded-md ${color} ml-1.5 flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  </div>
);

const HolidayItem = ({ name, date, type, color = 'blue' }) => {
  const c = { blue:'bg-blue-50 text-blue-700 border-blue-200', green:'bg-green-50 text-green-700 border-green-200', amber:'bg-amber-50 text-amber-700 border-amber-200', red:'bg-red-50 text-red-700 border-red-200', purple:'bg-purple-50 text-purple-700 border-purple-200' };
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${c[color]||c.blue}`}>
      <div>
        <p className="text-xs font-medium">{name}</p>
        <p className="text-[10px] opacity-75">{new Date(date).toLocaleDateString()}</p>
      </div>
      <span className="text-[10px] font-medium bg-white/50 px-2 py-0.5 rounded-full">{type}</span>
    </div>
  );
};

const HRDashboard = () => {
  const { isAdmin, isHR } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrAPI.getDashboardAll();
      if (res.data?.success) setData(res.data.data);
      else throw new Error(res.data?.message || 'Failed to load dashboard');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = useMemo(() => {
    if (!data) {
      return [
        { title:'Total Employees', icon:Users, color:'bg-blue-500', loading:true },
        { title:'Active Employees', icon:UserCheck, color:'bg-emerald-500', loading:true },
        { title:'Present Today', icon:UserCheck, color:'bg-emerald-600', loading:true },
        { title:'Pending Leaves', icon:Clock, color:'bg-amber-500', loading:true },
        { title:'Attrition Rate', icon:TrendingUp, color:'bg-rose-500', loading:true },
        { title:'Open Positions', icon:Briefcase, color:'bg-purple-500', loading:true },
        { title:'Payroll Cost', icon:DollarSign, color:'bg-indigo-500', loading:true },
        { title:'New Hires', icon:Users, color:'bg-teal-500', loading:true }
      ];
    }
    const { employee, attendance, leave, payroll, recruitment } = data;
    const attrition = employee.total ? Math.round((employee.terminated/employee.total)*100) : 0;
    const attendanceRate = employee.active ? Math.round((attendance.today.present/employee.active)*100) : 0;
    return [
      { title:'Total Employees', value:employee.total.toLocaleString(), icon:Users, color:'bg-blue-500', subtitle:`+${employee.newHiresThisMonth} this month` },
      { title:'Active Employees', value:employee.active.toLocaleString(), icon:UserCheck, color:'bg-emerald-500', subtitle:`${attendanceRate}% attendance today` },
      { title:'Present Today', value:attendance.today.present, icon:UserCheck, color:'bg-emerald-600', subtitle:'Out of active employees' },
      { title:'Pending Leaves', value:leave.pending, icon:Clock, color:'bg-amber-500', subtitle:'Awaiting approval' },
      { title:'Attrition Rate', value:`${attrition}%`, icon:TrendingUp, color:'bg-rose-500', subtitle:'Year to date' },
      { title:'Open Positions', value:recruitment.openPositions, icon:Briefcase, color:'bg-purple-500', subtitle:'Needs hiring' },
      { title:'Payroll Cost', value:`₹${(payroll.summary.totalGross/100000).toFixed(1)}L`, icon:DollarSign, color:'bg-indigo-500', subtitle:'Current month' },
      { title:'New Hires (Month)', value:employee.newHiresThisMonth, icon:Users, color:'bg-teal-500', subtitle:'Last 30 days' }
    ];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return null;
    const { employee, attendance, leave, performance, payroll, recruitment, expense, goals, documents } = data;
    return {
      department: employee.departments.map(d => ({ name: d.name, count: d.count })),
      attendanceTrend: attendance.trend.map(t => ({ date: t.date, total: t.total })),
      leaveTypes: leave.typeDistribution.map(t => ({ name: t.name, count: t.count })),
      performance: performance.ratingDistribution.map(r => ({ rating: r.rating, count: r.count })),
      payrollSummary: [
        { name: 'Gross Pay', value: Number(payroll.summary.totalGross) || 0 },
        { name: 'Net Pay', value: Number(payroll.summary.totalNet) || 0 },
        { name: 'Deductions', value: Number(payroll.summary.totalDeductions) || 0 },
        { name: 'Allowances', value: Number(payroll.summary.totalAllowances) || 0 },
        { name: 'Bonuses', value: Number(payroll.summary.totalBonuses) || 0 },
      ],
      salaryDistribution: payroll.salaryDistribution.map(s => ({ name: s.range, count: s.count })),
      deptAttendance: attendance.department.map(d => ({ name: d.department, total: d.total, workedHours: d.workedHours })),
      sourceOfHire: recruitment.sourceOfHire.map(s => ({ name: s.source, count: s.count })),
      expenseCategory: expense.categoryBreakdown.map(e => ({ name: e.category, total: e.total })),
      goalsStatus: goals.byStatus.map(g => ({ name: g.status, count: g.count })),
      topPerformers: performance.topPerformers,
      shiftAssignments: data.shiftAssignments,
      lowBalanceEmployees: leave.lowBalanceEmployees,
    };
  }, [data]);

  return (
    <div className="space-y-4 pb-6 px-1 sm:px-0">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-xs text-gray-400">HRMS • Employee Management</p>
        <div className="flex gap-2">
          <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
            <Calendar className="w-3 h-3 mr-1" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Row 1: Departments, Attendance, Leave Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Departments</h3>
          <p className="text-[10px] text-gray-400">Headcount by department</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.department?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.department} layout="vertical" margin={{ top:5, right:10, left:40, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No department data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Attendance</h3>
          <p className="text-[10px] text-gray-400">Last 30 days</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.attendanceTrend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData.attendanceTrend} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize:8 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" fill="#3B82F6" stroke="#2563EB" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No attendance data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Leave Types</h3>
          <p className="text-[10px] text-gray-400">Distribution</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.leaveTypes?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData.leaveTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {chartData.leaveTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No leave data</div>}
        </div>
      </div>

      {/* Row 2: Performance, Payroll Summary, Salary Distribution, Quick Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Performance</h3>
          <p className="text-[10px] text-gray-400">Rating distribution</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.performance?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.performance} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No performance data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Payroll Summary</h3>
          <p className="text-[10px] text-gray-400">Current run totals</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.payrollSummary?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.payrollSummary} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize:8 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No payroll data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Salary Distribution</h3>
          <p className="text-[10px] text-gray-400">Employee salary ranges</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.salaryDistribution?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.salaryDistribution} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize:8 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No salary data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold mb-2">Quick Summaries</h3>
          {loading ? <div className="h-24 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
          <div className="space-y-2">
            {data?.training?.total ? (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-500"/><span className="text-xs">Training</span></div>
                <div className="flex gap-4 text-xs"><span className="font-medium">{data.training.total} Total</span><span className="text-green-600">{data.training.completed} Completed</span></div>
              </div>
            ) : <div className="p-2 bg-gray-50 rounded text-gray-400 text-xs">No training data</div>}
            {data?.expense?.total ? (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-500"/><span className="text-xs">Expenses</span></div>
                <div className="flex gap-4 text-xs"><span className="font-medium">₹{data.expense.total.toLocaleString()}</span><span className="text-amber-600">{data.expense.pending} Pending</span></div>
              </div>
            ) : <div className="p-2 bg-gray-50 rounded text-gray-400 text-xs">No expense data</div>}
            {data?.documents?.total ? (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2"><File className="w-4 h-4 text-gray-500"/><span className="text-xs">Documents</span></div>
                <div className="flex gap-4 text-xs"><span className="font-medium">{data.documents.total} Total</span><span className="text-red-600">{data.documents.expired} Expired</span></div>
              </div>
            ) : <div className="p-2 bg-gray-50 rounded text-gray-400 text-xs">No document data</div>}
          </div>}
        </div>
      </div>

      {/* Row 3: Department-wise Attendance, Recruitment Source, Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Department Attendance</h3>
          <p className="text-[10px] text-gray-400">Monthly</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.deptAttendance?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.deptAttendance} layout="vertical" margin={{ top:5, right:10, left:40, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Recruitment Source</h3>
          <p className="text-[10px] text-gray-400">Applications by source</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.sourceOfHire?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData.sourceOfHire} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {chartData.sourceOfHire.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Expense Categories</h3>
          <p className="text-[10px] text-gray-400">Total by category</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.expenseCategory?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.expenseCategory} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize:8 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>}
        </div>
      </div>

      {/* Row 4: Goals Status, Top Performers, Shift Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Goals Status</h3>
          <p className="text-[10px] text-gray-400">Distribution</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.goalsStatus?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.goalsStatus} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize:8 }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No goals data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Top Performers</h3>
          <p className="text-[10px] text-gray-400">Highest rated</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.topPerformers?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chartData.topPerformers.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs">{p.employee}</span>
                  <span className="text-xs font-medium">{p.rating}</span>
                </div>
              ))}
            </div>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Shift Assignments</h3>
          <p className="text-[10px] text-gray-400">Today</p>
          {loading ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div> :
           chartData?.shiftAssignments?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chartData.shiftAssignments.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs">{s.shift}</span>
                  <span className="text-xs font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          ) : <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>}
        </div>
      </div>

      {/* Row 5: Pending Leaves, Upcoming Holidays, Recent Hires, Low Balance Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Pending Leaves</h3>
          <p className="text-[10px] text-gray-400">Awaiting your review</p>
          <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center mt-2">
            {loading ? <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /> :
             <div className="text-center"><p className="text-3xl font-bold text-amber-600">{data?.leave?.pending ?? 0}</p><p className="text-xs text-gray-500">Pending requests</p></div>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Upcoming Holidays</h3>
          <p className="text-[10px] text-gray-400">Next events</p>
          <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
            {loading ? <div className="text-center py-6 text-sm text-gray-400">Loading...</div> :
             (data?.holidays?.upcoming?.length ? data.holidays.upcoming.slice(0,3).map((h,i) => <HolidayItem key={i} {...h} />) :
              <div className="text-center py-6 text-sm text-gray-400">No upcoming holidays</div>)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Recent Hires</h3>
          <p className="text-[10px] text-gray-400">Last 30 days</p>
          <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center mt-2">
            {loading ? <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /> :
             <p className="text-sm text-gray-500">{data?.employee?.newHiresThisMonth ? `${data.employee.newHiresThisMonth} new hires this month` : 'No recent hires'}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <h3 className="text-sm font-semibold">Low Balance Employees</h3>
          <p className="text-[10px] text-gray-400">Leave balance</p>
          <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
            {loading ? <div className="text-center py-6 text-sm text-gray-400">Loading...</div> :
             (data?.leave?.lowBalanceEmployees?.length ? data.leave.lowBalanceEmployees.slice(0,3).map((e,i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs">{e.employee}</span>
                <span className="text-xs font-medium">{e.balance}</span>
              </div>
            )) : <div className="text-center py-6 text-sm text-gray-400">No data</div>)}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => { setRefreshing(true); fetchData(); }}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;