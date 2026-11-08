import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FaHdd as HardDrive,
  FaChartPie as PieChart,
  FaArrowUp as TrendingUp,
  FaArrowDown as TrendingDown,
  FaDownload,
  FaUpload,
  FaFile,
  FaFolder,
  FaUsers,
  FaGlobe,
  FaChartBar as BarChart,
  FaCalendarAlt as Calendar,
  FaEllipsisV as MoreVertical,
  FaRedo as RefreshCw,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTrashAlt as Trash2,
} from 'react-icons/fa'

const Storage = () => {
  const [timeRange, setTimeRange] = useState('30days')

  const storageStats = {
    total: 107374182400, // 100GB
    used: 45634027520, // 42.5GB
    available: 61740154880, // 57.5GB
    usagePercentage: 42.5,
  }

  const storageBreakdown = [
    { type: 'Documents', size: 15728640000, percentage: 34.5, color: 'bg-blue-500' },
    { type: 'Images', size: 12884901888, percentage: 28.2, color: 'bg-green-500' },
    { type: 'Videos', size: 10737418240, percentage: 23.5, color: 'bg-purple-500' },
    { type: 'Audio', size: 4294967296, percentage: 9.4, color: 'bg-orange-500' },
    { type: 'Archives', size: 2147483648, percentage: 4.7, color: 'bg-yellow-500' },
  ]

  const userQuotas = [
    { user: 'John Doe', used: 21474836480, quota: 53687091200, percentage: 40 },
    { user: 'Jane Smith', used: 10737418240, quota: 53687091200, percentage: 20 },
    { user: 'Mike Johnson', used: 32212254720, quota: 53687091200, percentage: 60 },
    { user: 'Sarah Wilson', used: 4294967296, quota: 10737418240, percentage: 40 },
    { user: 'Alex Turner', used: 8589934592, quota: 21474836480, percentage: 40 },
  ]

  const storageTrends = [
    { date: 'Jan 1', usage: 35.2 },
    { date: 'Jan 5', usage: 36.8 },
    { date: 'Jan 10', usage: 38.1 },
    { date: 'Jan 15', usage: 40.2 },
    { date: 'Jan 20', usage: 41.5 },
    { date: 'Jan 25', usage: 42.5 },
    { date: 'Jan 30', usage: 42.5 },
  ]

  const largeFiles = [
    { name: 'project_video.mp4', size: 4294967296, type: 'video', modified: '2024-01-15' },
    { name: 'database_backup.zip', size: 3221225472, type: 'archive', modified: '2024-01-14' },
    { name: 'design_assets.zip', size: 2147483648, type: 'archive', modified: '2024-01-13' },
    { name: 'meeting_recording.mov', size: 1610612736, type: 'video', modified: '2024-01-12' },
    { name: 'photo_album.zip', size: 1073741824, type: 'archive', modified: '2024-01-11' },
  ]

  const formatBytes = bytes => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatPercentage = value => {
    return value.toFixed(1) + '%'
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="text-red-500" size={16} />
    if (current < previous) return <TrendingDown className="text-green-500" size={16} />
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your storage usage</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">Last year</option>
          </select>

          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Storage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Total Storage</p>
              <p className="text-2xl font-bold">{formatBytes(storageStats.total)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{formatBytes(storageStats.used)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${storageStats.usagePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available</span>
              <span className="font-medium">{formatBytes(storageStats.available)}</span>
            </div>
          </div>
        </div>

        {/* Usage Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Usage Trend</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {formatPercentage(storageStats.usagePercentage)}
                </p>
                {getTrendIcon(42.5, 41.5)}
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <div className="h-24 flex items-end space-x-1">
            {storageTrends.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${point.usage * 2}px` }}
                />
                <span className="text-xs text-gray-500 mt-1">{point.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* File Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Files & Directories</p>
              <p className="text-2xl font-bold">12,458</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">8,924</div>
              <div className="text-sm text-gray-600">Files</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">3,534</div>
              <div className="text-sm text-gray-600">Directories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold">Storage Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {storageBreakdown.map(item => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-3`} />
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatBytes(item.size)}</div>
                      <div className="text-sm text-gray-500">
                        {formatPercentage(item.percentage)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Quotas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold">User Quotas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {userQuotas.map(user => (
                <div key={user.user} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUsers className="text-gray-400 mr-3" size={16} />
                      <span className="font-medium">{user.user}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatBytes(user.used)} / {formatBytes(user.quota)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPercentage(user.percentage)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${user.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Large Files */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Largest Files</h3>
            <button className="text-blue-600 text-sm hover:text-blue-800">View All →</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {largeFiles.map(file => (
                <tr key={file.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaFile className="text-gray-400 mr-3" size={20} />
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatBytes(file.size)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{file.modified}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaDownload size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Storage
