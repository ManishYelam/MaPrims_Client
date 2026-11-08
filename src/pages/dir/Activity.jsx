import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity as ActivityIcon,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  User,
  File,
  Folder,
  Upload,
  Download as DownloadIcon,
  Trash2,
  Share2,
  Edit,
  Eye,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

const Activity = () => {
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  const activities = [
    {
      id: '1',
      user: 'John Doe',
      action: 'upload',
      target: 'project_document.pdf',
      type: 'file',
      timestamp: '2024-01-15T14:30:00Z',
      status: 'success',
      size: 2457600,
      details: 'Uploaded to /Documents',
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'create',
      target: 'Project Assets',
      type: 'directory',
      timestamp: '2024-01-15T13:45:00Z',
      status: 'success',
      size: 0,
      details: 'Created new directory',
    },
    {
      id: '3',
      user: 'Mike Johnson',
      action: 'share',
      target: 'Financial Reports',
      type: 'directory',
      timestamp: '2024-01-15T12:20:00Z',
      status: 'success',
      size: 0,
      details: 'Shared with 3 people',
    },
    {
      id: '4',
      user: 'Sarah Wilson',
      action: 'delete',
      target: 'old_backup.zip',
      type: 'file',
      timestamp: '2024-01-15T11:15:00Z',
      status: 'success',
      size: 1073741824,
      details: 'Moved to trash',
    },
    {
      id: '5',
      user: 'Alex Turner',
      action: 'download',
      target: 'meeting_recording.mp4',
      type: 'file',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success',
      size: 536870912,
      details: 'Downloaded to local device',
    },
    {
      id: '6',
      user: 'Emma Davis',
      action: 'rename',
      target: 'presentation_final.pptx',
      type: 'file',
      timestamp: '2024-01-15T09:45:00Z',
      status: 'success',
      size: 10485760,
      details: 'Renamed from presentation_draft.pptx',
    },
    {
      id: '7',
      user: 'System',
      action: 'backup',
      target: 'Full System Backup',
      type: 'system',
      timestamp: '2024-01-15T03:00:00Z',
      status: 'success',
      size: 15461882265,
      details: 'Weekly automated backup completed',
    },
    {
      id: '8',
      user: 'David Miller',
      action: 'upload',
      target: 'large_video_file.mov',
      type: 'file',
      timestamp: '2024-01-14T16:20:00Z',
      status: 'failed',
      size: 21474836480,
      details: 'File size exceeds limit (20GB)',
    },
    {
      id: '9',
      user: 'Lisa Brown',
      action: 'move',
      target: 'client_documents/',
      type: 'directory',
      timestamp: '2024-01-14T15:10:00Z',
      status: 'success',
      size: 0,
      details: 'Moved from /Temp to /Documents',
    },
    {
      id: '10',
      user: 'Robert Wilson',
      action: 'compress',
      target: 'project_files.zip',
      type: 'file',
      timestamp: '2024-01-14T14:30:00Z',
      status: 'success',
      size: 3221225472,
      details: 'Compressed 45 files into archive',
    },
  ]

  const filters = [
    { value: 'all', label: 'All Activities' },
    { value: 'upload', label: 'Uploads' },
    { value: 'download', label: 'Downloads' },
    { value: 'create', label: 'Creations' },
    { value: 'delete', label: 'Deletions' },
    { value: 'share', label: 'Shares' },
    { value: 'system', label: 'System' },
  ]

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: 'all', label: 'All time' },
  ]

  const getActionIcon = action => {
    switch (action) {
      case 'upload':
        return <Upload className="text-blue-500" size={16} />
      case 'download':
        return <DownloadIcon className="text-green-500" size={16} />
      case 'create':
        return <Folder className="text-yellow-500" size={16} />
      case 'delete':
        return <Trash2 className="text-red-500" size={16} />
      case 'share':
        return <Share2 className="text-purple-500" size={16} />
      case 'rename':
        return <Edit className="text-orange-500" size={16} />
      case 'move':
        return <RefreshCw className="text-indigo-500" size={16} />
      case 'compress':
        return <File className="text-pink-500" size={16} />
      case 'backup':
        return <ActivityIcon className="text-gray-500" size={16} />
      default:
        return <Eye className="text-gray-400" size={16} />
    }
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />
      case 'failed':
        return <XCircle className="text-red-500" size={16} />
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />
      default:
        return <AlertCircle className="text-gray-400" size={16} />
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBytes = bytes => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all' && activity.action !== filter) return false
    if (searchQuery && !activity.target.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  const activityStats = {
    total: activities.length,
    uploads: activities.filter(a => a.action === 'upload').length,
    downloads: activities.filter(a => a.action === 'download').length,
    successes: activities.filter(a => a.status === 'success').length,
    failures: activities.filter(a => a.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-1">Track all file and directory activities</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filters.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRanges.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
              <Download size={18} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold">{activityStats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ActivityIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Uploads</p>
              <p className="text-2xl font-bold">{activityStats.uploads}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Downloads</p>
              <p className="text-2xl font-bold">{activityStats.downloads}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DownloadIcon className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold">{activityStats.successes}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold">{activityStats.failures}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Activities</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Showing {filteredActivities.length} of {activities.length} activities
              </span>
              <button className="text-blue-600 text-sm hover:text-blue-800 flex items-center">
                <RefreshCw size={16} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.map(activity => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user}
                        <span className="ml-2 font-normal text-gray-600">
                          {activity.action === 'upload' && 'uploaded a file'}
                          {activity.action === 'download' && 'downloaded a file'}
                          {activity.action === 'create' && 'created a directory'}
                          {activity.action === 'delete' && 'deleted a file'}
                          {activity.action === 'share' && 'shared a directory'}
                          {activity.action === 'rename' && 'renamed a file'}
                          {activity.action === 'move' && 'moved a directory'}
                          {activity.action === 'compress' && 'compressed files'}
                          {activity.action === 'backup' && 'created a backup'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-900 font-medium mt-1">{activity.target}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <File size={12} className="mr-1" />
                      <span className="capitalize">{activity.type}</span>
                    </div>
                    {activity.size > 0 && (
                      <div className="flex items-center">
                        <span>{formatBytes(activity.size)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <span>{activity.details}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="py-16 text-center">
            <ActivityIcon className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">No activities found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Activity
