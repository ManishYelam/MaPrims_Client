import React, { useState, useEffect } from 'react'
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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  userAPI,
  coursesAPI,
  paymentsAPI,
  adminAPI,
  contactAPI,
  feedbackAPI,
  supportAPI,
  analyticsAPI,
} from '../../services/api'
import {
  Download,
  FileText,
  Users,
  BookOpen,
  DollarSign,
  MessageSquare,
  Mail,
  Star,
  Calendar,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  FileDown,
  BarChart2,
  LineChart as LineChartIcon,
  UserCheck,
  BookMarked,
  CreditCard,
  Headphones,
  ThumbsUp,
  Contact,
} from 'lucide-react'

// Report Categories
const REPORT_CATEGORIES = {
  USERS: 'users',
  COURSES: 'courses',
  FINANCIAL: 'financial',
  SUPPORT: 'support',
  ANALYTICS: 'analytics',
  FEEDBACK: 'feedback',
  CONTACTS: 'contacts',
}

// Report Types for each category
const REPORT_TYPES = {
  USER_LIST: 'user-list',
  USER_STATS: 'user-stats',
  USER_ENROLLMENTS: 'user-enrollments',
  COURSE_LIST: 'course-list',
  COURSE_PERFORMANCE: 'course-performance',
  COURSE_ENROLLMENTS: 'course-enrollments',
  PAYMENT_HISTORY: 'payment-history',
  REVENUE_REPORT: 'revenue-report',
  TRANSACTION_DETAILS: 'transaction-details',
  TICKET_REPORT: 'ticket-report',
  SUPPORT_STATS: 'support-stats',
  RESPONSE_TIMES: 'response-times',
  DASHBOARD_ANALYTICS: 'dashboard-analytics',
  USER_ANALYTICS: 'user-analytics',
  REVENUE_ANALYTICS: 'revenue-analytics',
  FEEDBACK_REPORT: 'feedback-report',
  RATING_ANALYSIS: 'rating-analysis',
  CONTACT_REPORT: 'contact-report',
  INQUIRY_ANALYSIS: 'inquiry-analysis',
}

// Utility Functions
const formatCurrency = amount => {
  if (!amount) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusColor = status => {
  const colors = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-red-100 text-red-800 border border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border border-blue-200',
    failed: 'bg-red-100 text-red-800 border border-red-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    open: 'bg-blue-100 text-blue-800 border border-blue-200',
    closed: 'bg-gray-100 text-gray-800 border border-gray-200',
    resolved: 'bg-green-100 text-green-800 border border-green-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border border-blue-200',
    new: 'bg-purple-100 text-purple-800 border border-purple-200',
    responded: 'bg-green-100 text-green-800 border border-green-200',
  }
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200'
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#84CC16',
]

// Enhanced Print function
const printReport = (title, contentId, config = {}) => {
  const printContent = document.getElementById(contentId)

  if (!printContent) {
    console.error('Print content not found')
    return
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=600')

  const now = new Date()
  const generatedDate = now.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const generatedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const contentClone = printContent.cloneNode(true)
  const elementsToRemove = contentClone.querySelectorAll('.no-print, button, [onclick]')
  elementsToRemove.forEach(el => el.remove())

  const printStyles = `
    <style>
      @media print {
        @page {
          size: A4;
          margin: 0.5in;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.4;
          color: #000;
          background: white !important;
          margin: 0;
          padding: 0;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px double #333;
        }
        
        .print-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: #1f2937;
        }
        
        .print-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 5px 0;
        }
        
        .print-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          margin-top: 10px;
        }
        
        .print-section {
          margin: 25px 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
        }
        
        th {
          background-color: #f8fafc !important;
          color: #374151;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          padding: 10px 8px;
          text-align: left;
        }
        
        td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          vertical-align: top;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin: 20px 0;
        }
        
        .stat-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
          background: #f9fafb;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .chart-container {
          margin: 20px 0;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          background: white;
        }
        
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #374151;
        }
        
        .chart-image {
          max-width: 100%;
          height: auto;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .status-active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-inactive { background: #fecaca; color: #991b1b; border: 1px solid #fca5a5; }
        .status-pending { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .status-completed { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .status-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-failed { background: #fecaca; color: #991b1b; border: 1px solid #fca5a5; }
        
        button, .btn, .actions, .pagination, .search-box {
          display: none !important;
        }
      }
      
      @media screen {
        .screen-only { display: block; }
        .print-only { display: none; }
      }
      
      @media print {
        .screen-only { display: none; }
        .print-only { display: block; }
      }
    </style>
  `

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Report</title>
        <meta charset="UTF-8">
        ${printStyles}
      </head>
      <body>
        <div class="print-header">
          <h1 class="print-title">${title}</h1>
          <div class="print-subtitle">Comprehensive Analytics Report</div>
          <div class="print-meta">
            <span>Generated on: ${generatedDate} at ${generatedTime}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
        
        <div class="print-content">
          ${contentClone.innerHTML}
        </div>
        
        <div class="footer">
          <div>Confidential Report - ${config.company || 'Learning Management System'}</div>
          <div>Generated by Admin Dashboard</div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 250);
          };
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

// Export to Excel function
const exportToExcel = (data, filename, columns) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(item => {
      const row = {}
      columns.forEach(col => {
        if (col.exportKey) {
          row[col.title] = col.exportKey.split('.').reduce((obj, key) => obj?.[key], item) || ''
        } else {
          row[col.title] = item[col.key] || ''
        }
      })
      return row
    })
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  const colWidths = columns.map(col => ({ wch: Math.max(col.title.length, 15) }))
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Chart Components
const ChartContainer = ({ title, children, className = '' }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
  >
    <h4 className="text-base font-semibold text-gray-900 mb-3">{title}</h4>
    {children}
  </div>
)

const SimpleBarChart = ({ data, dataKey, nameKey = 'name' }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey={nameKey} fontSize={12} tick={{ fill: '#6b7280' }} />
      <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
      <Tooltip
        contentStyle={{
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      />
      <Legend wrapperStyle={{ fontSize: '12px' }} />
      <Bar dataKey={dataKey} fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
    </BarChart>
  </ResponsiveContainer>
)

const SimplePieChart = ({ data, dataKey, nameKey = 'name' }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={70}
        innerRadius={30}
        fill="#8884d8"
        dataKey={dataKey}
        paddingAngle={2}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      />
      <Legend wrapperStyle={{ fontSize: '12px' }} />
    </PieChart>
  </ResponsiveContainer>
)

const SimpleLineChart = ({ data, dataKey, nameKey = 'name' }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey={nameKey} fontSize={12} tick={{ fill: '#6b7280' }} />
      <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
      <Tooltip
        contentStyle={{
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      />
      <Legend wrapperStyle={{ fontSize: '12px' }} />
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke="#3B82F6"
        strokeWidth={2}
        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, fill: '#1D4ED8' }}
      />
    </LineChart>
  </ResponsiveContainer>
)

// Components
const DataTable = ({
  data = [],
  columns = [],
  title,
  exportable = true,
  printable = true,
  onExport,
  onPrint,
  summaryStats = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const filteredData = data.filter(item =>
    columns.some(col => {
      const value = col.key.includes('.')
        ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
        : item[col.key]
      return String(value || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    })
  )

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      let aValue = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
        : a[sortConfig.key]
      let bValue = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
        : b[sortConfig.key]

      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = key => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 no-print">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{sortedData.length} records found</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 transition-colors"
            />
          </div>
          {exportable && (
            <button
              onClick={onExport}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 no-print transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </button>
          )}
          {printable && (
            <button
              onClick={onPrint}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 no-print transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 no-print transition-colors"
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {sortConfig.key === column.key && column.sortable !== false && (
                      <ChevronDown
                        className={`w-3 h-3 ml-1 transition-transform ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
                  {columns.map(column => {
                    const value = column.key.includes('.')
                      ? column.key.split('.').reduce((obj, key) => obj?.[key], row)
                      : row[column.key]

                    return (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {column.render ? column.render(value, row) : value || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                    No data found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 no-print gap-3">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ title, value, icon: Icon, color, change, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-600 truncate mb-1">{title}</p>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        {change && (
          <div
            className={`flex items-center mt-1 text-xs ${change.includes('-') ? 'text-red-600' : 'text-green-600'}`}
          >
            <TrendingUp
              className={`w-3 h-3 mr-1 ${change.includes('-') ? 'transform rotate-180' : ''}`}
            />
            {change}
          </div>
        )}
      </div>
      <div
        className={`p-2 rounded-lg ${color} ml-3 flex-shrink-0 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
)

const Reports = () => {
  const [activeCategory, setActiveCategory] = useState(REPORT_CATEGORIES.USERS)
  const [activeReport, setActiveReport] = useState(REPORT_TYPES.USER_LIST)
  const [dateRange, setDateRange] = useState('last-30-days')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data states
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [payments, setPayments] = useState([])
  const [supportTickets, setSupportTickets] = useState([])
  const [feedback, setFeedback] = useState([])
  const [contacts, setContacts] = useState([])
  const [analytics, setAnalytics] = useState({})

  // Mock data for demonstration
  const mockUserStats = [
    { role: 'student', count: 1500, percentage: 75 },
    { role: 'instructor', count: 45, percentage: 2 },
    { role: 'admin', count: 8, percentage: 0.4 },
    { role: 'guest', count: 447, percentage: 22.6 },
  ]

  const mockRevenueData = [
    { period: 'Jan', revenue: 1250000, growth: 12, transactions: 45, average_order: 27778 },
    { period: 'Feb', revenue: 1450000, growth: 16, transactions: 52, average_order: 27885 },
    { period: 'Mar', revenue: 1650000, growth: 14, transactions: 58, average_order: 28448 },
    { period: 'Apr', revenue: 1850000, growth: 12, transactions: 63, average_order: 29365 },
    { period: 'May', revenue: 2100000, growth: 14, transactions: 68, average_order: 30882 },
    { period: 'Jun', revenue: 1950000, growth: -7, transactions: 61, average_order: 31967 },
  ]

  const mockCoursePerformance = [
    {
      course: 'Web Development',
      enrollments: 450,
      completion_rate: 78,
      revenue: 2250000,
      rating: 4.5,
    },
    {
      course: 'Data Science',
      enrollments: 320,
      completion_rate: 82,
      revenue: 1920000,
      rating: 4.7,
    },
    {
      course: 'Mobile Development',
      enrollments: 280,
      completion_rate: 75,
      revenue: 1680000,
      rating: 4.3,
    },
    {
      course: 'UI/UX Design',
      enrollments: 190,
      completion_rate: 85,
      revenue: 1140000,
      rating: 4.6,
    },
    {
      course: 'Digital Marketing',
      enrollments: 210,
      completion_rate: 72,
      revenue: 1260000,
      rating: 4.2,
    },
  ]

  const mockSupportStats = [
    { status: 'open', count: 12, percentage: 15 },
    { status: 'in_progress', count: 25, percentage: 31 },
    { status: 'resolved', count: 38, percentage: 48 },
    { status: 'closed', count: 5, percentage: 6 },
  ]

  // Load data based on category
  useEffect(() => {
    loadCategoryData(activeCategory)
  }, [activeCategory])

  const loadCategoryData = async category => {
    try {
      setLoading(true)
      setError('')

      // Simulate API calls with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      switch (category) {
        case REPORT_CATEGORIES.USERS:
          setUsers(
            Array.from({ length: 50 }, (_, i) => ({
              user_id: `USR${1000 + i}`,
              full_name: `User ${i + 1}`,
              email: `user${i + 1}@example.com`,
              role: i < 40 ? 'student' : i < 48 ? 'instructor' : 'admin',
              phone_number: `+91 ${Math.random().toString().slice(2, 12)}`,
              status: Math.random() > 0.1 ? 'active' : 'inactive',
              createdAt: new Date(
                Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }))
          )
          break

        case REPORT_CATEGORIES.COURSES:
          setCourses(
            Array.from({ length: 20 }, (_, i) => ({
              course_id: `CRS${100 + i}`,
              title: `Course ${i + 1}`,
              fee: [19900, 29900, 39900, 49900][i % 4],
              duration: `${[4, 6, 8, 12][i % 4]} weeks`,
              mode: ['online', 'offline', 'hybrid'][i % 3],
              level: ['beginner', 'intermediate', 'advanced'][i % 3],
              is_active: Math.random() > 0.2,
            }))
          )
          break

        case REPORT_CATEGORIES.FINANCIAL:
          setPayments(
            Array.from({ length: 100 }, (_, i) => ({
              payment_id: `PAY${1000 + i}`,
              rzp_order_id: `order_${Math.random().toString(36).substr(2, 9)}`,
              amount: [19900, 29900, 39900, 49900][i % 4],
              status: ['success', 'failed', 'pending'][i % 3],
              method: ['card', 'upi', 'netbanking'][i % 3],
              user: { full_name: `User ${i + 1}` },
              course: { title: `Course ${(i % 20) + 1}` },
              createdAt: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }))
          )
          break

        case REPORT_CATEGORIES.SUPPORT:
          setSupportTickets(
            Array.from({ length: 30 }, (_, i) => ({
              ticket_number: `TKT${1000 + i}`,
              subject: `Support Issue ${i + 1}`,
              category: ['technical', 'billing', 'general', 'feedback'][i % 4],
              priority: ['high', 'medium', 'low'][i % 3],
              status: ['open', 'in_progress', 'resolved', 'closed'][i % 4],
              user: { full_name: `User ${i + 1}` },
              created_at: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              resolved_at:
                i > 15
                  ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
                  : null,
            }))
          )
          break

        case REPORT_CATEGORIES.FEEDBACK:
          setFeedback(
            Array.from({ length: 25 }, (_, i) => ({
              feedback_id: `FB${100 + i}`,
              user: { full_name: `User ${i + 1}` },
              rating: Math.floor(Math.random() * 5) + 1,
              category: ['course', 'platform', 'support', 'content'][i % 4],
              status: ['new', 'reviewed', 'actioned'][i % 3],
              message: `This is feedback message ${i + 1}`,
              createdAt: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }))
          )
          break

        case REPORT_CATEGORIES.CONTACTS:
          setContacts(
            Array.from({ length: 15 }, (_, i) => ({
              contact_id: `CON${100 + i}`,
              name: `Contact ${i + 1}`,
              email: `contact${i + 1}@example.com`,
              status: ['new', 'responded', 'resolved'][i % 3],
              priority: ['high', 'medium', 'low'][i % 3],
              message: `This is contact message ${i + 1}`,
              createdAt: new Date(
                Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }))
          )
          break

        case REPORT_CATEGORIES.ANALYTICS:
          setAnalytics({
            totalUsers: 2000,
            activeCourses: 45,
            monthlyRevenue: 1950000,
            supportTickets: 80,
            courseCompletion: 72,
          })
          break
      }
    } catch (err) {
      setError(`Failed to load ${category} data`)
      console.error('Data load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Report configurations
  const reportConfigs = {
    // User Reports
    [REPORT_TYPES.USER_LIST]: {
      title: 'User List Report',
      columns: [
        { key: 'user_id', title: 'ID', sortable: true },
        { key: 'full_name', title: 'Name', sortable: true },
        { key: 'email', title: 'Email', sortable: true },
        { key: 'role', title: 'Role', sortable: true },
        { key: 'phone_number', title: 'Phone' },
        {
          key: 'status',
          title: 'Status',
          render: (value, row) => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value || 'Active'}
            </span>
          ),
        },
        { key: 'createdAt', title: 'Joined', render: formatDate },
      ],
      data: users,
      exportKey: 'users',
    },

    [REPORT_TYPES.USER_STATS]: {
      title: 'User Statistics Report',
      columns: [
        {
          key: 'role',
          title: 'Role',
          render: value => <span className="capitalize font-medium">{value}</span>,
        },
        {
          key: 'count',
          title: 'Count',
          render: value => (
            <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
          ),
        },
        {
          key: 'percentage',
          title: 'Percentage',
          render: (_, row) => {
            const percentage = row.percentage
            return (
              <div className="flex items-center">
                <span className="w-12 text-sm font-medium">{percentage}%</span>
                <div className="flex-1 ml-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          },
        },
      ],
      data: mockUserStats,
      exportKey: 'user-stats',
      charts: [
        {
          type: 'pie',
          title: 'User Distribution by Role',
          data: mockUserStats,
          dataKey: 'count',
          nameKey: 'role',
        },
      ],
    },

    // Course Reports
    [REPORT_TYPES.COURSE_LIST]: {
      title: 'Course List Report',
      columns: [
        { key: 'course_id', title: 'ID', sortable: true },
        { key: 'title', title: 'Course Title', sortable: true },
        { key: 'fee', title: 'Fee', render: formatCurrency },
        { key: 'duration', title: 'Duration' },
        { key: 'mode', title: 'Mode' },
        { key: 'level', title: 'Level' },
        {
          key: 'is_active',
          title: 'Status',
          render: value => (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${value ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}
            >
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ],
      data: courses,
      exportKey: 'courses',
    },

    [REPORT_TYPES.COURSE_PERFORMANCE]: {
      title: 'Course Performance Report',
      columns: [
        { key: 'course', title: 'Course Name', sortable: true },
        { key: 'enrollments', title: 'Enrollments', sortable: true },
        {
          key: 'completion_rate',
          title: 'Completion Rate',
          render: value => (
            <div className="flex items-center">
              <span className="font-medium mr-2">{value}%</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ),
        },
        { key: 'revenue', title: 'Revenue', render: formatCurrency, sortable: true },
        {
          key: 'rating',
          title: 'Rating',
          render: value => (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{value}/5</span>
            </div>
          ),
        },
      ],
      data: mockCoursePerformance,
      exportKey: 'course-performance',
      charts: [
        {
          type: 'bar',
          title: 'Course Enrollments',
          data: mockCoursePerformance,
          dataKey: 'enrollments',
          nameKey: 'course',
        },
        {
          type: 'bar',
          title: 'Course Revenue',
          data: mockCoursePerformance,
          dataKey: 'revenue',
          nameKey: 'course',
        },
      ],
    },

    // Financial Reports
    [REPORT_TYPES.PAYMENT_HISTORY]: {
      title: 'Payment History Report',
      columns: [
        { key: 'payment_id', title: 'Payment ID', sortable: true },
        { key: 'rzp_order_id', title: 'Order ID' },
        { key: 'amount', title: 'Amount', render: formatCurrency, sortable: true },
        {
          key: 'status',
          title: 'Status',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value}
            </span>
          ),
        },
        { key: 'method', title: 'Method' },
        { key: 'user.full_name', title: 'User', sortable: true },
        { key: 'course.title', title: 'Course', sortable: true },
        { key: 'createdAt', title: 'Date', render: formatDateTime, sortable: true },
      ],
      data: payments,
      exportKey: 'payments',
    },

    [REPORT_TYPES.REVENUE_ANALYTICS]: {
      title: 'Revenue Analytics Report',
      columns: [
        { key: 'period', title: 'Period', sortable: true },
        {
          key: 'revenue',
          title: 'Revenue',
          render: formatCurrency,
          sortable: true,
        },
        {
          key: 'growth',
          title: 'Growth',
          render: value => (
            <span
              className={`flex items-center font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {value >= 0 ? '↗' : '↘'} {Math.abs(value)}%
            </span>
          ),
        },
        { key: 'transactions', title: 'Transactions', sortable: true },
        { key: 'average_order', title: 'Average Order', render: formatCurrency, sortable: true },
      ],
      data: mockRevenueData,
      exportKey: 'revenue-analytics',
      charts: [
        {
          type: 'line',
          title: 'Monthly Revenue Trend',
          data: mockRevenueData,
          dataKey: 'revenue',
          nameKey: 'period',
        },
        {
          type: 'bar',
          title: 'Monthly Transactions',
          data: mockRevenueData,
          dataKey: 'transactions',
          nameKey: 'period',
        },
      ],
    },

    // Support Reports
    [REPORT_TYPES.TICKET_REPORT]: {
      title: 'Support Tickets Report',
      columns: [
        { key: 'ticket_number', title: 'Ticket No', sortable: true },
        { key: 'subject', title: 'Subject', sortable: true },
        { key: 'category', title: 'Category' },
        {
          key: 'priority',
          title: 'Priority',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value}
            </span>
          ),
        },
        {
          key: 'status',
          title: 'Status',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value.replace('_', ' ')}
            </span>
          ),
        },
        { key: 'user.full_name', title: 'User', sortable: true },
        { key: 'created_at', title: 'Created', render: formatDateTime, sortable: true },
        { key: 'resolved_at', title: 'Resolved', render: formatDateTime },
      ],
      data: supportTickets,
      exportKey: 'support-tickets',
    },

    [REPORT_TYPES.SUPPORT_STATS]: {
      title: 'Support Statistics Report',
      columns: [
        {
          key: 'status',
          title: 'Status',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value.replace('_', ' ').toUpperCase()}
            </span>
          ),
        },
        { key: 'count', title: 'Count', sortable: true },
        {
          key: 'percentage',
          title: 'Percentage',
          render: value => (
            <div className="flex items-center">
              <span className="w-12 font-medium">{value}%</span>
              <div className="flex-1 ml-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ),
        },
      ],
      data: mockSupportStats,
      exportKey: 'support-stats',
      charts: [
        {
          type: 'pie',
          title: 'Ticket Status Distribution',
          data: mockSupportStats,
          dataKey: 'count',
          nameKey: 'status',
        },
      ],
    },

    // Feedback Reports
    [REPORT_TYPES.FEEDBACK_REPORT]: {
      title: 'Feedback Report',
      columns: [
        { key: 'feedback_id', title: 'ID', sortable: true },
        { key: 'user.full_name', title: 'User', sortable: true },
        {
          key: 'rating',
          title: 'Rating',
          render: value => (
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 font-medium">({value}/5)</span>
            </div>
          ),
        },
        { key: 'category', title: 'Category' },
        {
          key: 'status',
          title: 'Status',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value}
            </span>
          ),
        },
        { key: 'message', title: 'Message' },
        { key: 'createdAt', title: 'Submitted', render: formatDateTime, sortable: true },
      ],
      data: feedback,
      exportKey: 'feedback',
    },

    // Contact Reports
    [REPORT_TYPES.CONTACT_REPORT]: {
      title: 'Contact Inquiries Report',
      columns: [
        { key: 'contact_id', title: 'ID', sortable: true },
        { key: 'name', title: 'Name', sortable: true },
        { key: 'email', title: 'Email', sortable: true },
        {
          key: 'status',
          title: 'Status',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value}
            </span>
          ),
        },
        {
          key: 'priority',
          title: 'Priority',
          render: value => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
              {value}
            </span>
          ),
        },
        { key: 'message', title: 'Message' },
        { key: 'createdAt', title: 'Submitted', render: formatDateTime, sortable: true },
      ],
      data: contacts,
      exportKey: 'contacts',
    },

    // Analytics Reports
    [REPORT_TYPES.DASHBOARD_ANALYTICS]: {
      title: 'Dashboard Analytics Report',
      columns: [
        { key: 'metric', title: 'Metric', sortable: true },
        { key: 'current', title: 'Current', sortable: true },
        { key: 'previous', title: 'Previous', sortable: true },
        {
          key: 'growth',
          title: 'Growth',
          render: value => (
            <span
              className={`flex items-center font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {value >= 0 ? '↗' : '↘'} {Math.abs(value)}%
            </span>
          ),
        },
      ],
      data: [
        { metric: 'Total Users', current: 2000, previous: 1800, growth: 11 },
        { metric: 'Active Courses', current: 45, previous: 42, growth: 7 },
        { metric: 'Monthly Revenue', current: 1950000, previous: 1850000, growth: 5 },
        { metric: 'Support Tickets', current: 80, previous: 95, growth: -16 },
        { metric: 'Course Completion', current: 72, previous: 68, growth: 6 },
      ],
      exportKey: 'dashboard-analytics',
    },
  }

  const currentReport = reportConfigs[activeReport] || {
    title: '',
    columns: [],
    data: [],
    charts: [],
  }

  const handleExport = () => {
    exportToExcel(currentReport.data, currentReport.title, currentReport.columns)
  }

  const handlePrint = () => {
    printReport(currentReport.title, 'report-content', {
      company: 'Learning Management System',
    })
  }

  const renderChart = (chartConfig, index) => {
    switch (chartConfig.type) {
      case 'bar':
        return (
          <ChartContainer key={index} title={chartConfig.title} className="mb-4">
            <SimpleBarChart
              data={chartConfig.data}
              dataKey={chartConfig.dataKey}
              nameKey={chartConfig.nameKey}
            />
          </ChartContainer>
        )
      case 'pie':
        return (
          <ChartContainer key={index} title={chartConfig.title} className="mb-4">
            <SimplePieChart
              data={chartConfig.data}
              dataKey={chartConfig.dataKey}
              nameKey={chartConfig.nameKey}
            />
          </ChartContainer>
        )
      case 'line':
        return (
          <ChartContainer key={index} title={chartConfig.title} className="mb-4">
            <SimpleLineChart
              data={chartConfig.data}
              dataKey={chartConfig.dataKey}
              nameKey={chartConfig.nameKey}
            />
          </ChartContainer>
        )
      default:
        return null
    }
  }

  const categoryConfigs = {
    [REPORT_CATEGORIES.USERS]: {
      icon: Users,
      label: 'Users',
      color: 'bg-blue-500',
      reports: [
        { type: REPORT_TYPES.USER_LIST, label: 'User List' },
        { type: REPORT_TYPES.USER_STATS, label: 'User Statistics' },
        { type: REPORT_TYPES.USER_ENROLLMENTS, label: 'User Enrollments' },
      ],
    },
    [REPORT_CATEGORIES.COURSES]: {
      icon: BookOpen,
      label: 'Courses',
      color: 'bg-green-500',
      reports: [
        { type: REPORT_TYPES.COURSE_LIST, label: 'Course List' },
        { type: REPORT_TYPES.COURSE_PERFORMANCE, label: 'Course Performance' },
        { type: REPORT_TYPES.COURSE_ENROLLMENTS, label: 'Course Enrollments' },
      ],
    },
    [REPORT_CATEGORIES.FINANCIAL]: {
      icon: DollarSign,
      label: 'Financial',
      color: 'bg-emerald-500',
      reports: [
        { type: REPORT_TYPES.PAYMENT_HISTORY, label: 'Payment History' },
        { type: REPORT_TYPES.REVENUE_REPORT, label: 'Revenue Report' },
        { type: REPORT_TYPES.REVENUE_ANALYTICS, label: 'Revenue Analytics' },
      ],
    },
    [REPORT_CATEGORIES.SUPPORT]: {
      icon: MessageSquare,
      label: 'Support',
      color: 'bg-purple-500',
      reports: [
        { type: REPORT_TYPES.TICKET_REPORT, label: 'Ticket Report' },
        { type: REPORT_TYPES.SUPPORT_STATS, label: 'Support Statistics' },
        { type: REPORT_TYPES.RESPONSE_TIMES, label: 'Response Times' },
      ],
    },
    [REPORT_CATEGORIES.ANALYTICS]: {
      icon: BarChart3,
      label: 'Analytics',
      color: 'bg-orange-500',
      reports: [
        { type: REPORT_TYPES.DASHBOARD_ANALYTICS, label: 'Dashboard Analytics' },
        { type: REPORT_TYPES.USER_ANALYTICS, label: 'User Analytics' },
        { type: REPORT_TYPES.REVENUE_ANALYTICS, label: 'Revenue Analytics' },
      ],
    },
    [REPORT_CATEGORIES.FEEDBACK]: {
      icon: Star,
      label: 'Feedback',
      color: 'bg-yellow-500',
      reports: [
        { type: REPORT_TYPES.FEEDBACK_REPORT, label: 'Feedback Report' },
        { type: REPORT_TYPES.RATING_ANALYSIS, label: 'Rating Analysis' },
      ],
    },
    [REPORT_CATEGORIES.CONTACTS]: {
      icon: Mail,
      label: 'Contacts',
      color: 'bg-indigo-500',
      reports: [
        { type: REPORT_TYPES.CONTACT_REPORT, label: 'Contact Report' },
        { type: REPORT_TYPES.INQUIRY_ANALYSIS, label: 'Inquiry Analysis' },
      ],
    },
  }

  if (loading) {
    return
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comprehensive Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate detailed reports from all system data
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 no-print transition-colors"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="all-time">All Time</option>
            </select>
            <button
              onClick={() => loadCategoryData(activeCategory)}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 no-print transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg no-print">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h3>
              <div className="space-y-2">
                {Object.entries(categoryConfigs).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCategory(key)
                      setActiveReport(config.reports[0].type)
                    }}
                    className={`flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeCategory === key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }`}
                  >
                    <config.icon className="w-4 h-4 mr-3" />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Types */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4 shadow-sm no-print">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
              <div className="space-y-1">
                {categoryConfigs[activeCategory]?.reports.map(report => (
                  <button
                    key={report.type}
                    onClick={() => setActiveReport(report.type)}
                    className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      activeReport === report.type
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {report.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div id="report-content">
              {/* Report Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentReport.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Generated on {formatDate(new Date())}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 no-print">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {currentReport.data.length} records
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              {currentReport.charts && currentReport.charts.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {currentReport.charts.map((chartConfig, index) =>
                      renderChart(chartConfig, index)
                    )}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <DataTable {...currentReport} onExport={handleExport} onPrint={handlePrint} />
            </div>

            {/* Quick Stats */}
            {currentReport.data.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 no-print">
                <StatCard
                  title="Total Records"
                  value={currentReport.data.length.toLocaleString()}
                  icon={FileText}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Last Updated"
                  value={formatDate(new Date())}
                  icon={Calendar}
                  color="bg-green-500"
                />
                {activeCategory === REPORT_CATEGORIES.FINANCIAL && (
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(
                      currentReport.data.reduce(
                        (sum, item) => sum + (item.amount || item.revenue || 0),
                        0
                      )
                    )}
                    icon={DollarSign}
                    color="bg-emerald-500"
                  />
                )}
                <StatCard
                  title="Export Ready"
                  value="Excel/PDF"
                  icon={DownloadCloud}
                  color="bg-purple-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
