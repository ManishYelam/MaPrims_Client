import React, { useState, useEffect, useContext, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  MessageCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  X,
  Edit,
  Trash2,
  Plus,
  Search,
  BarChart,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  User,
  Paperclip,
  Download,
  Image as ImageIcon,
  File,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa'
import { AuthContext } from '../../context/AuthContext'
import { supportAPI } from '../../services/api'

const FAQModal = lazy(() => import('./FAQModal'))
const TicketModal = lazy(() => import('./TicketModal'))
const AttachmentManagerModal = lazy(() => import('./AttachmentManagerModal'))
const ImagePreviewModal = lazy(() =>
  import('./AttachmentManagerModal').then(module => ({
    default: module.ImagePreviewModal,
  }))
)
const PDFPreviewModal = lazy(() =>
  import('./AttachmentManagerModal').then(module => ({
    default: module.PDFPreviewModal,
  }))
)

const Toast = ({ toast, onClose }) => {
  if (!toast) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md shadow-lg border transform transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : toast.type === 'error'
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-blue-50 text-blue-800 border-blue-200'
      }`}
    >
      {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
      {toast.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
      {toast.type === 'info' && <HelpCircle className="w-4 h-4 text-blue-600" />}
      <span className="text-xs font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-1 text-gray-400 hover:text-gray-600">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

const FileIcon = ({ fileName, fileType, className = 'w-5 h-5' }) => {
  if (!fileName && !fileType) return <File className={`${className} text-gray-300`} />

  const lowerFileName = fileName ? fileName.toLowerCase() : ''
  const lowerFileType = fileType ? fileType.toLowerCase() : ''

  if (lowerFileName.endsWith('.pdf') || lowerFileType.includes('pdf')) {
    return <FaFilePdf className={`${className} text-red-600`} />
  }

  if (lowerFileName.endsWith('.png') || lowerFileType.includes('png')) {
    return <FaFileImage className={`${className} text-blue-600`} />
  }

  if (
    lowerFileName.endsWith('.jpg') ||
    lowerFileName.endsWith('.jpeg') ||
    lowerFileType.includes('jpeg') ||
    lowerFileType.includes('jpg')
  ) {
    return <FaFileImage className={`${className} text-green-600`} />
  }

  if (lowerFileName.endsWith('.gif') || lowerFileType.includes('gif')) {
    return <FaFileImage className={`${className} text-purple-600`} />
  }

  if (lowerFileName.endsWith('.bmp') || lowerFileType.includes('bmp')) {
    return <FaFileImage className={`${className} text-yellow-600`} />
  }

  if (lowerFileName.endsWith('.webp') || lowerFileType.includes('webp')) {
    return <FaFileImage className={`${className} text-indigo-600`} />
  }

  if (lowerFileName.endsWith('.txt') || lowerFileType.includes('text')) {
    return <FaFileAlt className={`${className} text-gray-600`} />
  }

  if (
    lowerFileName.endsWith('.doc') ||
    lowerFileName.endsWith('.docx') ||
    lowerFileType.includes('word')
  ) {
    return <FaFileAlt className={`${className} text-blue-700`} />
  }

  if (
    lowerFileName.endsWith('.xls') ||
    lowerFileName.endsWith('.xlsx') ||
    lowerFileType.includes('excel')
  ) {
    return <FaFileAlt className={`${className} text-green-700`} />
  }

  return <File className={`${className} text-gray-400`} />
}

const isImageFile = (fileName, fileType) => {
  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()
  return lowerFileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/) || lowerFileType.includes('image')
}

const isPDFFile = (fileName, fileType) => {
  const lowerFileName = (fileName || '').toLowerCase()
  const lowerFileType = (fileType || '').toLowerCase()
  return lowerFileName.endsWith('.pdf') || lowerFileType.includes('pdf')
}

const canPreviewInBrowser = (fileName, fileType) => {
  return isImageFile(fileName, fileType) || isPDFFile(fileName, fileType)
}

const getFileTypeFromUrl = url => {
  if (!url) return ''
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('.pdf')) return 'application/pdf'
  if (lowerUrl.includes('.png')) return 'image/png'
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg'
  if (lowerUrl.includes('.gif')) return 'image/gif'
  if (lowerUrl.includes('.bmp')) return 'image/bmp'
  if (lowerUrl.includes('.webp')) return 'image/webp'
  if (lowerUrl.includes('.txt')) return 'text/plain'
  if (lowerUrl.includes('.doc')) return 'application/msword'
  if (lowerUrl.includes('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lowerUrl.includes('.xls')) return 'application/vnd.ms-excel'
  if (lowerUrl.includes('.xlsx'))
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return ''
}

const formatFileSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MultiSelectSearchFields = ({ selectedFields, onFieldChange, availableFields }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleField = field => {
    if (selectedFields.includes(field)) {
      onFieldChange(selectedFields.filter(f => f !== field))
    } else {
      onFieldChange([...selectedFields, field])
    }
  }

  const selectAllFields = () => {
    onFieldChange([...availableFields])
  }

  const clearAllFields = () => {
    onFieldChange([])
  }

  const getFieldLabel = field => {
    const fieldLabels = {
      subject: 'Subject',
      description: 'Description',
      category: 'Category',
      ticket_number: 'Ticket Number',
      priority: 'Priority',
      status: 'Status',
      created_by: 'Created By',
      assigned_to: 'Assigned To',
    }
    return fieldLabels[field] || field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isActive = selectedFields.length > 0 && selectedFields.length < availableFields.length

  return (
    <div className="relative w-full">
      <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
        Search In
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-1.5 py-1 text-[11px] border rounded 
               focus:ring-1 focus:ring-primary-500 focus:border-primary-500 
               flex items-center justify-between ${
                 isActive
                   ? 'bg-blue-50 border-blue-300 text-blue-800'
                   : 'bg-white border-gray-300'
               }`}
      >
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
            {selectedFields.length === 0 ? (
              <span className="text-gray-400 whitespace-nowrap">Select fields</span>
            ) : (
              selectedFields.map(field => (
                <span
                  key={field}
                  className="inline-flex flex-shrink-0 items-center px-1 py-0 
                         bg-primary-100 text-primary-800 text-[9px] rounded 
                         border border-primary-200 whitespace-nowrap leading-tight"
                >
                  {getFieldLabel(field)}
                </span>
              ))
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-2.5 h-2.5 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-20 mt-1 w-full bg-white border border-gray-300 
                 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          <div className="p-1.5 border-b border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium text-gray-700">Search Fields</span>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={selectAllFields}
                  className="text-primary-600 hover:text-primary-800"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllFields}
                  className="text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="p-1 space-y-0">
            {availableFields.map(field => (
              <label
                key={field}
                className="flex items-center px-1.5 py-0.5 hover:bg-gray-50 
                       rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="w-2.5 h-2.5 rounded border-gray-300 
                         text-primary-600 focus:ring-1 focus:ring-primary-500"
                />
                <span className="ml-1.5 text-[10px] text-gray-700">{getFieldLabel(field)}</span>
              </label>
            ))}
          </div>

          <div className="p-1 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-1.5 py-0.5 text-[10px] bg-primary-600 text-white 
                     rounded hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const FilterSection = ({ filters, onFilterChange, isAdmin }) => {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' },
    { value: 'course', label: 'Course' },
    { value: 'account', label: 'Account' },
    { value: 'general', label: 'General' },
  ]

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ]

  const sortByOptions = [
    { value: 'created_at', label: 'Created' },
    { value: 'updated_at', label: 'Updated' },
    { value: 'resolved_at', label: 'Resolved' },
    { value: 'ticket_number', label: 'Ticket #' },
    { value: 'subject', label: 'Subject' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
  ]

  const sortOrderOptions = [
    { value: 'DESC', label: 'Newest' },
    { value: 'ASC', label: 'Oldest' },
  ]

  const availableSearchFields = [
    'subject',
    'description',
    'category',
    'ticket_number',
    'priority',
    'status',
    ...(isAdmin ? ['created_by', 'assigned_to'] : []),
  ]

  const activeInputClass = 'bg-blue-50 border-blue-300 text-blue-900'
  const defaultInputClass = 'bg-white border-gray-300 text-gray-900'
  const baseInputClass =
    'w-full px-1.5 py-1 text-[11px] border rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500'

  const isSearchActive = filters.search !== ''
  const isStatusActive = filters.status !== 'all'
  const isCategoryActive = filters.category !== 'all'
  const isPriorityActive = filters.priority !== 'all'
  const isSortByActive = filters.sortBy !== 'created_at'
  const isSortOrderActive = filters.sortOrder !== 'DESC'

  return (
    <div className="bg-gray-50 rounded-md px-2 py-1.5 mb-3 border border-gray-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-1.5">
        <div className="col-span-2 lg:col-span-2">
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Search
          </label>
          <div className="relative">
            <Search
              className={`absolute left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
                isSearchActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={e => onFilterChange('search', e.target.value)}
              className={`${baseInputClass} pl-6 ${
                isSearchActive ? activeInputClass : defaultInputClass
              }`}
            />
          </div>
        </div>

        <div className="col-span-2 lg:col-span-2">
          <MultiSelectSearchFields
            selectedFields={filters.searchFields || availableSearchFields}
            onFieldChange={fields => onFilterChange('searchFields', fields)}
            availableFields={availableSearchFields}
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Status
          </label>
          <select
            value={filters.status}
            onChange={e => onFilterChange('status', e.target.value)}
            className={`${baseInputClass} ${
              isStatusActive ? activeInputClass : defaultInputClass
            }`}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Category
          </label>
          <select
            value={filters.category}
            onChange={e => onFilterChange('category', e.target.value)}
            className={`${baseInputClass} ${
              isCategoryActive ? activeInputClass : defaultInputClass
            }`}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={e => onFilterChange('priority', e.target.value)}
            className={`${baseInputClass} ${
              isPriorityActive ? activeInputClass : defaultInputClass
            }`}
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'created_at'}
            onChange={e => onFilterChange('sortBy', e.target.value)}
            className={`${baseInputClass} ${
              isSortByActive ? activeInputClass : defaultInputClass
            }`}
          >
            {sortByOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5 leading-none">
            Order
          </label>
          <select
            value={filters.sortOrder || 'DESC'}
            onChange={e => onFilterChange('sortOrder', e.target.value)}
            className={`${baseInputClass} ${
              isSortOrderActive ? activeInputClass : defaultInputClass
            }`}
          >
            {sortOrderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:block lg:col-span-2"></div>
      </div>
    </div>
  )
}

const StatsCards = ({ stats, loading, isAdmin, compact = false }) => {
  if (loading) {
    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 ${
          compact ? 'mb-3' : 'mb-4'
        }`}
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-md border border-gray-200 px-2.5 py-1.5 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      gray: 'bg-gray-50 text-gray-600',
    }

    return (
      <div
        className="bg-white rounded-md border border-gray-200 px-2.5 py-1.5 hover:shadow-sm transition-shadow flex items-center gap-2 min-w-0"
        title={`${title}: ${value}`}
      >
        <div
          className={`w-6 h-6 ${colorClasses[color] || colorClasses.blue} rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap truncate">
            {title}
          </span>
          <span className="text-base font-bold text-gray-900 leading-none">{value}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 ${
        compact ? 'mb-3' : 'mb-4'
      }`}
    >
      <StatCard title="Total" value={stats.totalTickets || 0} icon={BarChart} color="blue" />
      <StatCard title="Open" value={stats.openTickets || 0} icon={AlertCircle} color="red" />
      <StatCard
        title="In Progress"
        value={stats.inProgressTickets || 0}
        icon={Clock}
        color="yellow"
      />
      <StatCard title="Pending" value={stats.pendingTickets || 0} icon={Clock} color="orange" />
      <StatCard
        title="Resolved"
        value={stats.resolvedTickets || 0}
        icon={CheckCircle2}
        color="green"
      />
      <StatCard title="Closed" value={stats.closedTickets || 0} icon={XCircle} color="gray" />
    </div>
  )
}

const OverviewStats = ({
  stats,
  loading,
  isAdmin,
  recentTickets,
  onOpenTicketModal,
  onNavigateToFAQ,
}) => {
  return (
    <div className="space-y-5">
      <StatsCards stats={stats} loading={loading} isAdmin={isAdmin} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            Recent Tickets
          </h3>

          <div className="space-y-2.5">
            {recentTickets && recentTickets.length > 0 ? (
              recentTickets.slice(0, 5).map((ticket, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border border-gray-100 rounded-md hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2.5 mb-2 sm:mb-0 flex-1 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        ticket.status === 'open'
                          ? 'bg-red-500'
                          : ticket.status === 'in-progress'
                          ? 'bg-yellow-500'
                          : ticket.status === 'resolved'
                          ? 'bg-green-500'
                          : ticket.status === 'pending'
                          ? 'bg-orange-500'
                          : 'bg-gray-500'
                      }`}
                    ></div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-xs truncate">{ticket.subject}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="capitalize">{ticket.category}</span>
                        <span>•</span>
                        <span>
                          {ticket.priority
                            ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)
                            : 'Medium'}
                        </span>
                        <span>•</span>
                        <span>
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap mt-1 sm:mt-0 ${
                      ticket.status === 'open'
                        ? 'bg-red-100 text-red-800'
                        : ticket.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : ticket.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : ticket.status === 'pending'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ticket.status
                      ? ticket.status.charAt(0).toUpperCase() +
                        ticket.status.slice(1).replace('-', ' ')
                      : 'Unknown'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">No recent tickets</h4>
                <p className="text-gray-500 text-xs">Create your first support ticket</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-primary-600" />
            Statistics
          </h3>

          {stats.byCategory && stats.byCategory.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1.5">By Category</h4>
              <div className="space-y-1.5">
                {stats.byCategory.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 capitalize">{item.category}</span>
                    <span className="text-xs font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.byPriority && stats.byPriority.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1.5">By Priority</h4>
              <div className="space-y-1.5">
                {stats.byPriority.map((item, index) => {
                  const priorityColors = {
                    low: 'text-green-600',
                    medium: 'text-yellow-600',
                    high: 'text-red-600',
                    urgent: 'text-red-800 font-bold',
                  }

                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span
                        className={`text-xs capitalize ${priorityColors[item.priority] || 'text-gray-600'}`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-xs font-medium text-gray-900">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" />
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={onOpenTicketModal}
              className="w-full text-left p-2.5 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Create New Ticket</p>
                  <p className="text-gray-600 text-[11px]">Submit a new support request</p>
                </div>
                <Plus className="w-4 h-4 text-primary-600" />
              </div>
            </button>
            <button
              onClick={onNavigateToFAQ}
              className="w-full text-left p-2.5 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Browse FAQs</p>
                  <p className="text-gray-600 text-[11px]">Find quick answers to common questions</p>
                </div>
                <HelpCircle className="w-4 h-4 text-primary-600" />
              </div>
            </button>
            <button
              onClick={() => {}}
              className="w-full text-left p-2.5 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Live Chat</p>
                  <p className="text-gray-600 text-[11px]">Get immediate help from our team</p>
                </div>
                <MessageCircle className="w-4 h-4 text-primary-600" />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Support Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900 text-xs">Support Team Online</p>
                  <p className="text-green-700 text-[11px]">Typically responds in 2-4 hours</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-medium text-gray-900">2 hours</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Resolution Rate</span>
                <span className="font-medium text-gray-900">94%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-gray-900">4.8/5</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-200">
              <p className="text-[11px] text-gray-600">
                <strong>Office Hours:</strong> Mon-Fri, 9:00 AM - 6:00 PM EST
              </p>
              <p className="text-[11px] text-gray-600 mt-1">
                <strong>Emergency Support:</strong> Available 24/7 for critical issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TicketTable = ({
  tickets,
  isAdmin,
  onEditTicket,
  loading,
  pagination,
  onPageChange,
  onManageAttachments,
  onPreviewAttachment,
}) => {
  const ticketStatusColors = {
    open: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-300 text-gray-600',
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    urgent: 'bg-red-600 text-white',
  }

  const getStatusDisplay = status => {
    const statusMap = {
      open: 'Open',
      'in-progress': 'In Progress',
      pending: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
    }
    return statusMap[status] || status
  }

  const getPriorityDisplay = priority => {
    const priorityMap = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    }
    return priorityMap[priority] || priority
  }

  const getSafeValue = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === 'object') {
      return JSON.stringify(value) || defaultValue
    }
    return String(value)
  }

  const getAttachmentCount = attachments => {
    if (!attachments) return 0
    if (Array.isArray(attachments)) return attachments.length
    if (typeof attachments === 'object') return Object.keys(attachments).length
    if (typeof attachments === 'string' && attachments.trim() !== '') return 1
    return 0
  }

  const getFirstAttachmentForPreview = attachments => {
    if (!attachments) return null

    if (Array.isArray(attachments) && attachments.length > 0) {
      const firstAttachment = attachments[0]

      if (typeof firstAttachment === 'string') {
        return {
          url: firstAttachment,
          name: firstAttachment.split('/').pop() || 'Attachment',
          type: getFileTypeFromUrl(firstAttachment),
        }
      }

      return {
        url:
          firstAttachment.url || firstAttachment.path || firstAttachment.fileUrl || firstAttachment,
        name: firstAttachment.name || firstAttachment.fileName || 'Attachment',
        type:
          firstAttachment.type ||
          firstAttachment.fileType ||
          getFileTypeFromUrl(firstAttachment.url || ''),
      }
    } else if (typeof attachments === 'object') {
      const keys = Object.keys(attachments)
      if (keys.length > 0) {
        const firstKey = keys[0]
        const attachmentValue = attachments[firstKey]

        if (typeof attachmentValue === 'string') {
          return {
            url: attachmentValue,
            name: firstKey,
            type: getFileTypeFromUrl(attachmentValue),
          }
        } else if (typeof attachmentValue === 'object') {
          return {
            url:
              attachmentValue.url ||
              attachmentValue.path ||
              attachmentValue.fileUrl ||
              attachmentValue,
            name: attachmentValue.name || attachmentValue.fileName || firstKey,
            type:
              attachmentValue.type ||
              attachmentValue.fileType ||
              getFileTypeFromUrl(attachmentValue.url || ''),
          }
        }
      }
    }

    return null
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formatDateTime = dateString => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 text-xs mt-1.5">Loading tickets...</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1.5">No support tickets found</h3>
        <p className="text-gray-500 text-sm">Create your first support ticket to get help</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Ticket #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Subject & Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Category
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Priority
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
              {isAdmin && (
                <>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Created By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Assigned To
                  </th>
                </>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Files
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Created
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Updated
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Resolved
              </th>
              {isAdmin && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map(ticket => {
              const ticketId = getSafeValue(ticket.support_ticket_id || ticket.id)
              const attachmentCount = getAttachmentCount(ticket.attachments)
              const hasAttachments = attachmentCount > 0
              const firstAttachment = getFirstAttachmentForPreview(ticket.attachments)
              const canPreview =
                firstAttachment && canPreviewInBrowser(firstAttachment.name, firstAttachment.type)
              const resolvedDate = ticket.resolved_at ? formatDate(ticket.resolved_at) : 'N/A'
              const updatedDate = ticket.updated_at ? formatDate(ticket.updated_at) : 'N/A'
              const createdDate = ticket.created_at ? formatDate(ticket.created_at) : 'N/A'
              const resolvedDateTime = ticket.resolved_at
                ? formatDateTime(ticket.resolved_at)
                : 'N/A'
              const updatedDateTime = ticket.updated_at ? formatDateTime(ticket.updated_at) : 'N/A'
              const subjectText = getSafeValue(ticket.subject)
              const descriptionText = getSafeValue(ticket.description, 'No description provided')
              const isSubjectTruncated = subjectText.length > 30
              const isDescriptionTruncated = descriptionText.length > 50
              const fullSubject = subjectText
              const fullDescription = descriptionText

              return (
                <tr key={ticketId} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <Link
                      to={`/dashboard/support/tickets/${ticket.support_ticket_id || ticket.id}`}
                      className="font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      {getSafeValue(ticket.ticket_number)}
                    </Link>
                    <div className="text-gray-500 text-xs mt-0.5">ID: {ticketId}</div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <div className="group relative max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {truncateText(subjectText, 30)}
                        </div>
                        {isSubjectTruncated && (
                          <div className="absolute left-0 bottom-full z-10 mb-1 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                            <div className="font-semibold">{fullSubject}</div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {truncateText(descriptionText, 50)}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900 capitalize">
                      {getSafeValue(ticket.category)}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        priorityColors[ticket.priority] || priorityColors.medium
                      }`}
                    >
                      {getPriorityDisplay(ticket.priority)}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ticketStatusColors[ticket.status] || ticketStatusColors.open
                        }`}
                      >
                        {getStatusDisplay(ticket.status)}
                      </span>
                    </div>
                  </td>

                  {isAdmin && (
                    <td className="px-3 py-2">
                      <div className="group relative">
                        <div className="text-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {getSafeValue(ticket.user?.full_name, 'N/A')}
                          </div>
                          <div className="text-gray-500 truncate">
                            {truncateText(getSafeValue(ticket.user?.email, 'N/A'), 25)}
                          </div>
                        </div>
                        {ticket.user?.email && ticket.user.email.length > 25 && (
                          <div className="absolute left-0 top-full z-10 mt-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                            {getSafeValue(ticket.user.email)}
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {isAdmin && (
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        {ticket.assigned_to && ticket.assigned_agent ? (
                          <div className="group relative">
                            <div className="font-medium text-gray-900 flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {truncateText(
                                  getSafeValue(
                                    ticket.assigned_agent.full_name,
                                    `User ${ticket.assigned_to}`
                                  ),
                                  20
                                )}
                              </span>
                            </div>
                            {ticket.assigned_agent.full_name &&
                              ticket.assigned_agent.full_name.length > 20 && (
                                <div className="absolute left-0 top-full z-10 mt-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                                  {getSafeValue(ticket.assigned_agent.full_name)}
                                </div>
                              )}
                          </div>
                        ) : ticket.assigned_to ? (
                          <>
                            <div className="font-medium text-gray-900 truncate">
                              User #{getSafeValue(ticket.assigned_to)}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs">Not assigned</span>
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex justify-center gap-1">
                      <div className="relative group">
                        <button
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (hasAttachments) {
                              if (canPreview && onPreviewAttachment) {
                                onPreviewAttachment(firstAttachment)
                              } else {
                                onManageAttachments(ticket)
                              }
                            } else {
                              onManageAttachments(ticket)
                            }
                          }}
                          className="p-1 rounded hover:bg-blue-100 transition-colors flex items-center justify-center"
                          title={
                            hasAttachments
                              ? canPreview
                                ? 'Preview this file'
                                : `Manage ${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`
                              : 'Upload attachments'
                          }
                        >
                          {hasAttachments ? (
                            <>
                              <FileIcon
                                fileName={firstAttachment?.name}
                                fileType={firstAttachment?.type}
                                className="w-4 h-4"
                              />
                              {attachmentCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {attachmentCount}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-600 rounded-full flex items-center justify-center">
                                <Plus className="w-1.5 h-1.5 text-white" />
                              </div>
                            </>
                          )}
                        </button>

                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10">
                          <div className="font-medium">
                            {hasAttachments
                              ? canPreview
                                ? 'Preview File'
                                : 'Manage Attachments'
                              : 'Upload Attachments'}
                          </div>
                          <div className="text-gray-300 mt-0.5">
                            {hasAttachments
                              ? canPreview
                                ? 'Click to preview this file'
                                : `Click to manage ${attachmentCount} file${attachmentCount > 1 ? 's' : ''}`
                              : 'Click to upload files to this ticket'}
                          </div>
                        </div>
                      </div>

                      {hasAttachments && firstAttachment && (
                        <button
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.open(firstAttachment.url, '_blank', 'noopener,noreferrer')
                          }}
                          className="group relative p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-600" />

                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10">
                            <div className="font-medium">Open in New Tab</div>
                            <div className="text-gray-300 mt-0.5">
                              Click to open this file in a new browser tab
                            </div>
                          </div>
                        </button>
                      )}

                      {(isAdmin || attachmentCount > 1) && (
                        <button
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            onManageAttachments(ticket)
                          }}
                          className="group relative p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Manage all attachments"
                        >
                          <Settings className="w-4 h-4 text-gray-600" />

                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10">
                            <div className="font-medium">Manage All Attachments</div>
                            <div className="text-gray-300 mt-0.5">
                              {hasAttachments
                                ? `View, upload, or delete all ${attachmentCount} attachments`
                                : 'Upload and manage attachments for this ticket'}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    <div className="group relative">
                      <div>{createdDate}</div>
                      {ticket.created_at && (
                        <div className="absolute left-0 top-full z-10 mt-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                          {formatDateTime(ticket.created_at)}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    <div className="group relative">
                      <div>{updatedDate}</div>
                      {ticket.updated_at && (
                        <div className="absolute left-0 top-full z-10 mt-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                          {updatedDateTime}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    <div className="group relative">
                      <div>{resolvedDate}</div>
                      {ticket.resolved_at && (
                        <div className="absolute left-0 top-full z-10 mt-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg">
                          {resolvedDateTime}
                        </div>
                      )}
                    </div>
                  </td>

                  {isAdmin && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="text-gray-600 hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-100"
                          title="Edit Ticket"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-center space-x-1 text-xs text-gray-600 mb-3 sm:mb-0">
            <span>Showing</span>
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>
            <span>to</span>
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
            </span>
            <span>of</span>
            <span className="font-medium">{pagination.totalItems}</span>
            <span>results</span>
          </div>
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {(() => {
              const pages = []
              const maxPagesToShow = 5
              let startPage = 1
              let endPage = pagination.totalPages

              if (pagination.totalPages > maxPagesToShow) {
                const half = Math.floor(maxPagesToShow / 2)
                if (pagination.currentPage <= half) {
                  startPage = 1
                  endPage = maxPagesToShow
                } else if (pagination.currentPage >= pagination.totalPages - half) {
                  startPage = pagination.totalPages - maxPagesToShow + 1
                  endPage = pagination.totalPages
                } else {
                  startPage = pagination.currentPage - half
                  endPage = pagination.currentPage + half
                }
              }

              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => onPageChange(1)}
                    className={`w-8 h-8 text-xs rounded border transition-colors ${
                      pagination.currentPage === 1
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    1
                  </button>
                )
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className="px-1 text-gray-500">
                      ...
                    </span>
                  )
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`w-8 h-8 text-xs rounded border transition-colors ${
                      pagination.currentPage === i
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {i}
                  </button>
                )
              }

              if (endPage < pagination.totalPages) {
                if (endPage < pagination.totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" className="px-1 text-gray-500">
                      ...
                    </span>
                  )
                }
                pages.push(
                  <button
                    key={pagination.totalPages}
                    onClick={() => onPageChange(pagination.totalPages)}
                    className={`w-8 h-8 text-xs rounded border transition-colors ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pagination.totalPages}
                  </button>
                )
              }

              return pages
            })()}

            <button
              onClick={() =>
                onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const FAQTable = ({ faqs, onEditFAQ, onToggleStatus, onDeleteFAQ, loading }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  const categoryColors = {
    technical: 'bg-blue-100 text-blue-800',
    billing: 'bg-purple-100 text-purple-800',
    course: 'bg-yellow-100 text-yellow-800',
    account: 'bg-red-100 text-red-800',
    general: 'bg-gray-100 text-gray-800',
  }

  const getSafeValue = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === 'object') {
      return JSON.stringify(value) || defaultValue
    }
    return String(value)
  }

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 text-xs mt-1.5">Loading FAQs...</p>
      </div>
    )
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1.5">No FAQs created yet</h3>
        <p className="text-gray-500 text-sm">Create your first FAQ to help users</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              FAQ ID
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Question & Answer
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Author
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {faqs.map(faq => {
            const faqId = getSafeValue(faq.faq_id || faq.id)

            return (
              <tr key={faqId} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <div className="font-medium">FAQ-{faqId}</div>
                  <div className="text-gray-500 text-xs mt-0.5">ID: {faqId}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="max-w-md">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {getSafeValue(faq.question)}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {getSafeValue(faq.answer, 'No answer provided')}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      categoryColors[faq.category] || categoryColors.general
                    }`}
                  >
                    {getSafeValue(faq.category, 'general').charAt(0).toUpperCase() +
                      getSafeValue(faq.category, 'general').slice(1)}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[faq.is_active ? 'active' : 'inactive']
                    }`}
                  >
                    {faq.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {getSafeValue(faq.author?.full_name, 'Unknown')}
                    </div>
                    <div className="text-gray-500 text-xs">
                      User ID: {getSafeValue(faq.created_by, 'N/A')}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  <div>
                    <div>
                      Created:{' '}
                      {faq.created_at ? new Date(faq.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    {faq.updated_at && (
                      <div className="mt-0.5">
                        Updated: {new Date(faq.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStatus(faq.faq_id || faq.id, faq.is_active)}
                      className={`transition-colors p-1 rounded hover:bg-gray-100 ${
                        faq.is_active
                          ? 'text-yellow-600 hover:text-yellow-800'
                          : 'text-green-600 hover:text-green-800'
                      }`}
                      title={faq.is_active ? 'Deactivate FAQ' : 'Activate FAQ'}
                    >
                      {faq.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onEditFAQ(faq)}
                      className="text-gray-600 hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-100"
                      title="Edit FAQ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteFAQ(faq.faq_id || faq.id)}
                      className="text-gray-600 hover:text-red-600 transition-colors p-1 rounded hover:bg-gray-100"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const HelpSupport = () => {
  const { user } = useContext(AuthContext)
  const userData = user?.user

  const [activeTab, setActiveTab] = useState('overview')
  const [userTickets, setUserTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingFaqs, setLoadingFaqs] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingRecentTickets, setLoadingRecentTickets] = useState(false)
  const [showMyTicketsOnly, setShowMyTicketsOnly] = useState(false)
  const [toast, setToast] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showAttachmentManager, setShowAttachmentManager] = useState(false)
  const [selectedTicketForManager, setSelectedTicketForManager] = useState(null)

  const [imagePreview, setImagePreview] = useState(null)
  const [pdfPreview, setPdfPreview] = useState(null)

  const [editingTicket, setEditingTicket] = useState(null)
  const [editingFAQ, setEditingFAQ] = useState(null)

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    page: 1,
    limit: 10,
    searchFields: ['subject', 'description', 'category', 'ticket_number'],
    sortBy: 'created_at',
    sortOrder: 'DESC',
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  })
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    byCategory: [],
    byPriority: [],
  })
  const [recentTickets, setRecentTickets] = useState([])

  const user_id = userData?.user_id
  const isAdmin = ['admin', 'super_admin'].includes(userData?.role)

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'my-tickets') {
      fetchStats()
    }
    if (activeTab === 'overview') {
      fetchRecentTickets()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'my-tickets') {
      fetchUserTickets()
    }
  }, [activeTab, filters, showMyTicketsOnly])

  useEffect(() => {
    if (activeTab === 'faq' || (isAdmin && activeTab === 'faq-management')) {
      fetchFAQs()
    }
  }, [activeTab])

  const buildPayload = () => {
    const payload = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      searchFields: filters.searchFields || ['subject', 'description', 'category', 'ticket_number'],
      filters: {},
      sortBy: filters.sortBy || 'created_at',
      sortOrder: filters.sortOrder || 'DESC',
    }

    if (filters.status !== 'all') payload.filters.status = filters.status
    if (filters.category !== 'all') payload.filters.category = filters.category
    if (filters.priority !== 'all') payload.filters.priority = filters.priority

    if (isAdmin && showMyTicketsOnly && user_id) {
      payload.filters.user_id = parseInt(user_id)
    }

    return payload
  }

  const fetchUserTickets = async () => {
    try {
      setLoadingTickets(true)

      const payload = buildPayload()

      let response
      if (isAdmin) {
        response = await supportAPI.getTickets(payload)
      } else {
        response = await supportAPI.getUserTickets(payload)
      }

      if (response.data?.success) {
        const responseData = response.data.data

        if (responseData && typeof responseData === 'object') {
          const ticketsData = responseData.tickets || []
          const totalItems = responseData.total || ticketsData.length
          const currentPage = responseData.page || filters.page
          const totalPages = responseData.total_pages || 1
          const limit = responseData.limit || filters.limit

          setUserTickets(ticketsData)
          setPagination({
            currentPage: parseInt(currentPage),
            totalPages: parseInt(totalPages),
            totalItems: parseInt(totalItems),
            limit: parseInt(limit),
          })
        } else {
          setUserTickets([])
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            limit: filters.limit,
          })
        }
      } else {
        setUserTickets([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: filters.limit,
        })
        showToast('Failed to load tickets', 'error')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setUserTickets([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: filters.limit,
      })
      showToast('Error loading tickets', 'error')
    } finally {
      setLoadingTickets(false)
    }
  }

  const fetchFAQs = async () => {
    try {
      setLoadingFaqs(true)
      const response = await supportAPI.getFAQs()

      if (response.data?.success) {
        const faqsData = response.data.data?.faqs ?? []
        setFaqs(faqsData)
      } else {
        setFaqs([])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      setFaqs([])
    } finally {
      setLoadingFaqs(false)
    }
  }

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      const response = await supportAPI.getStats()

      if (response.data?.success) {
        const statsData = response.data.data?.stats || {}

        const openTickets = statsData.open_tickets || 0
        const inProgressTickets = statsData.in_progress_tickets || 0
        const pendingTickets = statsData.pending_tickets || 0
        const resolvedTickets = statsData.resolved_tickets || 0
        const closedTickets = statsData.closed_tickets || 0
        const totalTickets =
          statsData.total_tickets ||
          openTickets + inProgressTickets + pendingTickets + resolvedTickets + closedTickets

        setStats({
          totalTickets,
          openTickets,
          inProgressTickets,
          pendingTickets,
          resolvedTickets,
          closedTickets,
          byCategory: statsData.tickets_by_category || [],
          byPriority: statsData.tickets_by_priority || [],
        })
      } else {
        showToast('Failed to load statistics', 'error')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      showToast('Error loading statistics', 'error')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchRecentTickets = async () => {
    try {
      setLoadingRecentTickets(true)
      const payload = {
        page: 1,
        limit: 5,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }

      let response
      if (isAdmin) {
        response = await supportAPI.getTickets(payload)
      } else {
        response = await supportAPI.getUserTickets(payload)
      }

      if (response.data?.success) {
        const responseData = response.data.data
        const ticketsData = responseData.tickets || []
        setRecentTickets(ticketsData)
      } else {
        setRecentTickets([])
        showToast('Failed to load recent tickets', 'error')
      }
    } catch (error) {
      console.error('Error fetching recent tickets:', error)
      setRecentTickets([])
      showToast('Error loading recent tickets', 'error')
    } finally {
      setLoadingRecentTickets(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const handleFilterChange = (keyOrObj, value) => {
    if (typeof keyOrObj === 'object') {
      setFilters(prev => ({ ...prev, ...keyOrObj, page: 1 }))
    } else {
      setFilters(prev => ({ ...prev, [keyOrObj]: value, page: 1 }))
    }
  }

  const handlePageChange = newPage => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleMyTicketsToggle = checked => {
    setShowMyTicketsOnly(checked)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const handleRefresh = () => {
    const defaultSearchFields = ['subject', 'description', 'category', 'ticket_number']
    if (isAdmin) {
      defaultSearchFields.push('priority', 'status', 'created_by', 'assigned_to')
    }

    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      priority: 'all',
      page: 1,
      limit: 10,
      searchFields: defaultSearchFields,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    })

    if (isAdmin) {
      setShowMyTicketsOnly(false)
    }

    fetchUserTickets()
    fetchStats()
    if (activeTab === 'overview') {
      fetchRecentTickets()
    }
    showToast('Filters cleared and refreshed', 'info')
  }

  const handleManageAttachments = ticket => {
    setSelectedTicketForManager(ticket)
    setShowAttachmentManager(true)
  }

  const handleCloseAttachmentManager = () => {
    setShowAttachmentManager(false)
    setSelectedTicketForManager(null)
  }

  const handleRefreshAttachments = () => {
    if (activeTab === 'my-tickets') {
      fetchUserTickets()
    }
    if (activeTab === 'overview') {
      fetchStats()
      fetchRecentTickets()
    }
  }

  const handlePreviewAttachment = attachment => {
    if (!attachment || !attachment.url) {
      showToast('Cannot preview this file', 'error')
      return
    }

    const fileType = attachment.type || ''
    const fileName = attachment.name || 'Attachment'

    if (isImageFile(fileName, fileType)) {
      setImagePreview({ url: attachment.url, fileName })
    } else if (isPDFFile(fileName, fileType)) {
      setPdfPreview({ url: attachment.url, fileName })
    } else {
      window.open(attachment.url, '_blank', 'noopener,noreferrer')
    }
  }

  const openTicketModal = (ticket = null) => {
    setEditingTicket(ticket)
    setShowTicketModal(true)
  }

  const openFAQModal = (faq = null) => {
    setEditingFAQ(faq)
    setShowFAQModal(true)
  }

  const closeTicketModal = () => {
    setShowTicketModal(false)
    setEditingTicket(null)
  }

  const closeFAQModal = () => {
    setShowFAQModal(false)
    setEditingFAQ(null)
  }

  const handleTicketSaved = () => {
    fetchUserTickets()
    fetchStats()
    if (activeTab === 'overview') {
      fetchRecentTickets()
    }
    showToast(
      editingTicket ? 'Ticket updated successfully!' : 'Ticket created successfully!',
      'success'
    )
  }

  const handleFAQSaved = () => {
    fetchFAQs()
    showToast(editingFAQ ? 'FAQ updated successfully!' : 'FAQ created successfully!', 'success')
  }

  const handleToggleFAQStatus = async (faqId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      await supportAPI.updateFAQ(faqId, { is_active: newStatus })
      fetchFAQs()
      showToast(`FAQ ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success')
    } catch (error) {
      console.error('Error updating FAQ status:', error)
      showToast('Failed to update FAQ status', 'error')
    }
  }

  const handleDeleteFAQ = async faqId => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await supportAPI.deleteFAQ(faqId)
        fetchFAQs()
        showToast('FAQ deleted successfully!', 'success')
      } catch (error) {
        console.error('Error deleting FAQ:', error)
        showToast('Failed to delete FAQ', 'error')
      }
    }
  }

  const handleCreateNewTicket = () => {
    openTicketModal()
  }

  const handleBrowseFAQs = () => {
    setActiveTab('faq')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    ...(isAdmin ? [{ id: 'faq-management', label: 'FAQ Management', icon: FileText }] : []),
    { id: 'my-tickets', label: isAdmin ? 'All Tickets' : 'My Tickets', icon: MessageCircle },
  ]

  return (
    <div className="mx-auto p-2 space-y-4">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-gray-600 text-sm mt-0.5">
                {isAdmin
                  ? 'Manage support tickets and FAQs'
                  : 'Get help with any issues or questions you have'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
                {tabs.map(tab => {
                  const IconComponent = tab.icon
                  const isActive = activeTab === tab.id
                  const isTicketTab = tab.id === 'my-tickets'
                  return (
                    <React.Fragment key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`group relative p-1.5 rounded-md transition-colors ${
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        title={tab.label}
                        aria-label={tab.label}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 hidden group-hover:block w-max px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded shadow-lg z-10 whitespace-nowrap">
                          {tab.label}
                        </span>
                      </button>

                      {isTicketTab && isActive && (
                        <>
                          {isAdmin && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded border border-gray-300">
                              <input
                                type="checkbox"
                                id="my-tickets-only"
                                checked={showMyTicketsOnly}
                                onChange={e => handleMyTicketsToggle(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3.5 h-3.5"
                              />
                              <label
                                htmlFor="my-tickets-only"
                                className="text-xs font-medium text-gray-700 flex items-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> My Tickets Only
                              </label>
                            </div>
                          )}

                          <button
                            onClick={handleRefresh}
                            className="group relative p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                            title="Refresh (clears filters)"
                            aria-label="Refresh"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${
                                loadingTickets || loadingStats ? 'animate-spin' : ''
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => openTicketModal()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> New Ticket
                          </button>
                        </>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              <div className="flex items-center space-x-1.5 text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Support Team Online</span>
              </div>
              <div className="text-gray-500 border-l border-gray-300 pl-3">
                Typical response: 2-4 hours
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">Support Overview</h2>
                <p className="text-gray-600 text-sm mt-0.5">
                  Quick overview of your support tickets and available help options
                </p>
              </div>

              <OverviewStats
                stats={stats}
                loading={loadingStats}
                isAdmin={isAdmin}
                recentTickets={recentTickets}
                onOpenTicketModal={handleCreateNewTicket}
                onNavigateToFAQ={handleBrowseFAQs}
              />
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Frequently Asked Questions
                </h2>
              </div>

              {loadingFaqs ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 text-xs mt-1.5">Loading FAQs...</p>
                </div>
              ) : faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs
                    .filter(faq => faq.is_active !== false)
                    .map(faq => (
                      <div
                        key={faq.faq_id || faq.id}
                        className="border border-gray-200 rounded p-3 hover:border-primary-200 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 text-sm mb-1.5">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                        {faq.category && faq.category !== 'general' && (
                          <div className="text-xs text-gray-500 mt-2">
                            Category: <span className="capitalize">{faq.category}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1.5">No FAQs available</h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Check back later for frequently asked questions
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'faq-management' && isAdmin && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h2 className="text-base font-semibold text-gray-900">FAQ Management</h2>
                <button
                  onClick={() => openFAQModal()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> New FAQ
                </button>
              </div>

              <FAQTable
                faqs={faqs}
                onEditFAQ={openFAQModal}
                onToggleStatus={handleToggleFAQStatus}
                onDeleteFAQ={handleDeleteFAQ}
                loading={loadingFaqs}
              />
            </div>
          )}

          {activeTab === 'my-tickets' && (
            <div>
              <StatsCards
                stats={stats}
                loading={loadingStats}
                isAdmin={isAdmin}
                compact={true}
              />

              <FilterSection
                filters={filters}
                onFilterChange={handleFilterChange}
                isAdmin={isAdmin}
              />

              <TicketTable
                tickets={userTickets}
                isAdmin={isAdmin}
                onEditTicket={openTicketModal}
                onManageAttachments={handleManageAttachments}
                onPreviewAttachment={handlePreviewAttachment}
                loading={loadingTickets}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={handleCreateNewTicket}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1.5">Create New Ticket</h3>
          <p className="text-gray-600 text-xs mb-2">Submit a new support request</p>
          <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center justify-center gap-1 mx-auto">
            Get Started
          </button>
        </div>

        <div
          onClick={handleBrowseFAQs}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1.5">Browse FAQs</h3>
          <p className="text-gray-600 text-xs mb-2">Find quick answers to common questions</p>
          <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center justify-center gap-1 mx-auto">
            View FAQs
          </button>
        </div>

        <a
          href="mailto:support@shirsattechhub.cloud"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1.5">Email Support</h3>
          <p className="text-gray-600 text-xs mb-2">
            Send us an email at support@shirsattechhub.cloud
          </p>
          <div className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center justify-center gap-1 mx-auto">
            Send Email
          </div>
        </a>
      </div>

      {showTicketModal && (
        <Suspense fallback={null}>
          <TicketModal
            show={showTicketModal}
            ticket={editingTicket}
            onClose={closeTicketModal}
            onSaved={handleTicketSaved}
          />
        </Suspense>
      )}

      {showFAQModal && (
        <Suspense fallback={null}>
          <FAQModal
            show={showFAQModal}
            faq={editingFAQ}
            onClose={closeFAQModal}
            onSaved={handleFAQSaved}
          />
        </Suspense>
      )}

      {showAttachmentManager && (
        <Suspense fallback={null}>
          <AttachmentManagerModal
            show={showAttachmentManager}
            ticket={selectedTicketForManager}
            onClose={handleCloseAttachmentManager}
            canUpload={true}
            onRefresh={handleRefreshAttachments}
          />
        </Suspense>
      )}

      {imagePreview && (
        <Suspense fallback={null}>
          <ImagePreviewModal
            imageUrl={imagePreview.url}
            fileName={imagePreview.fileName}
            onClose={() => setImagePreview(null)}
          />
        </Suspense>
      )}

      {pdfPreview && (
        <Suspense fallback={null}>
          <PDFPreviewModal
            pdfUrl={pdfPreview.url}
            fileName={pdfPreview.fileName}
            onClose={() => setPdfPreview(null)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default HelpSupport