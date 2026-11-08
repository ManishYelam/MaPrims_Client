import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FaArchive as BackupIcon,
  FaClock,
  FaDownload,
  FaRedo as RefreshCw,
  FaTrashAlt as Trash2,
  FaEllipsisV as MoreVertical,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaExclamationCircle as AlertCircle,
  FaHdd as HardDrive,
  FaCalendarAlt as Calendar,
  FaFileAlt as FileText,
  FaPlus,
  FaSearch,
  FaFilter,
} from 'react-icons/fa'

const Backups = () => {
  const [selectedBackups, setSelectedBackups] = useState([])
  const [showCreateBackup, setShowCreateBackup] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const backups = [
    {
      id: '1',
      name: 'Full System Backup',
      type: 'full',
      size: 15461882265,
      createdAt: '2024-01-15T10:30:00Z',
      scheduled: 'Weekly',
      status: 'completed',
      files: 1245,
      directories: 89,
      retention: '30 days',
    },
    {
      id: '2',
      name: 'Documents Backup',
      type: 'incremental',
      size: 2147483648,
      createdAt: '2024-01-14T14:20:00Z',
      scheduled: 'Daily',
      status: 'completed',
      files: 234,
      directories: 12,
      retention: '7 days',
    },
    {
      id: '3',
      name: 'Media Backup',
      type: 'full',
      size: 53687091200,
      createdAt: '2024-01-13T18:45:00Z',
      scheduled: 'Monthly',
      status: 'completed',
      files: 5678,
      directories: 45,
      retention: '90 days',
    },
    {
      id: '4',
      name: 'Database Backup',
      type: 'incremental',
      size: 1073741824,
      createdAt: '2024-01-15T08:15:00Z',
      scheduled: 'Hourly',
      status: 'running',
      files: 12,
      directories: 3,
      retention: '24 hours',
    },
    {
      id: '5',
      name: 'Configuration Backup',
      type: 'full',
      size: 536870912,
      createdAt: '2024-01-12T22:10:00Z',
      scheduled: 'Manual',
      status: 'failed',
      files: 89,
      directories: 7,
      retention: '14 days',
    },
    {
      id: '6',
      name: 'User Data Backup',
      type: 'incremental',
      size: 3221225472,
      createdAt: '2024-01-11T11:30:00Z',
      scheduled: 'Daily',
      status: 'completed',
      files: 456,
      directories: 23,
      retention: '7 days',
    },
  ]

  const backupSchedules = [
    {
      id: '1',
      name: 'Daily Documents',
      frequency: 'Daily',
      time: '02:00 AM',
      lastRun: '2024-01-15',
      nextRun: '2024-01-16',
      enabled: true,
    },
    {
      id: '2',
      name: 'Weekly Full Backup',
      frequency: 'Weekly',
      time: 'Sunday, 03:00 AM',
      lastRun: '2024-01-14',
      nextRun: '2024-01-21',
      enabled: true,
    },
    {
      id: '3',
      name: 'Monthly Archives',
      frequency: 'Monthly',
      time: '1st, 04:00 AM',
      lastRun: '2024-01-01',
      nextRun: '2024-02-01',
      enabled: false,
    },
  ]

  const handleSelectBackup = backupId => {
    setSelectedBackups(prev =>
      prev.includes(backupId) ? prev.filter(id => id !== backupId) : [...prev, backupId]
    )
  }

  const handleBackupAction = (action, backup) => {
    switch (action) {
      case 'restore':
        // console.log('Restore backup:', backup)
        break
      case 'download':
        // console.log('Download backup:', backup)
        break
      case 'delete':
        if (window.confirm(`Delete backup "${backup.name}"?`)) {
          // console.log('Delete backup:', backup)
        }
        break
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const getStatusIcon = status => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" size={16} />
      case 'running':
        return <RefreshCw className="text-blue-500 animate-spin" size={16} />
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />
      default:
        return <FaClock className="text-gray-500" size={16} />
    }
  }

  const totalBackupSize = backups.reduce((sum, backup) => sum + backup.size, 0)
  const completedBackups = backups.filter(b => b.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backups</h1>
          <p className="text-gray-600 mt-1">Manage your file backups and schedules</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search backups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Filters">
              <FaFilter size={20} />
            </button>
            <button
              onClick={() => setShowCreateBackup(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <FaPlus size={18} className="mr-2" />
              Create Backup
            </button>
          </div>
        </div>
      </div>

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Backups</p>
              <p className="text-2xl font-bold">{backups.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BackupIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Size</p>
              <p className="text-2xl font-bold">{formatBytes(totalBackupSize)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold">{completedBackups}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaCheckCircle className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Schedules</p>
              <p className="text-2xl font-bold">{backupSchedules.filter(s => s.enabled).length}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaClock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Schedules - Left Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Backup Schedules</h3>
                <button className="text-blue-600 text-sm hover:text-blue-800">
                  <FaPlus size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {backupSchedules.map(schedule => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{schedule.name}</h4>
                    <div
                      className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Frequency:</span>
                      <span className="font-medium">{schedule.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{schedule.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Run:</span>
                      <span className="font-medium">{schedule.nextRun}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100">
                      {schedule.enabled ? 'Pause' : 'Enable'}
                    </button>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backup List - Right Column */}
        <div className="lg:col-span-2">
          {/* Selected Backups Actions */}
          {selectedBackups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-blue-800">
                    {selectedBackups.length} backup{selectedBackups.length !== 1 ? 's' : ''}{' '}
                    selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center">
                      <FaDownload size={16} className="mr-2" />
                      Download
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center">
                      <RefreshCw size={16} className="mr-2" />
                      Restore
                    </button>
                    <button className="px-3 py-1.5 bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 flex items-center">
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBackups([])}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}

          {/* Backup List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedBackups.length === backups.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedBackups(backups.map(b => b.id))
                          } else {
                            setSelectedBackups([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Backup Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map(backup => (
                    <tr
                      key={backup.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedBackups.includes(backup.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectBackup(backup.id)}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBackups.includes(backup.id)}
                          onChange={() => handleSelectBackup(backup.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BackupIcon className="text-gray-400 mr-3" size={20} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                            <div className="text-sm text-gray-500">
                              {backup.type} • {backup.files} files • {backup.directories} dirs
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatBytes(backup.size)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(backup.status)}
                          <span className="ml-2 text-sm capitalize">{backup.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(backup.createdAt)}</div>
                        <div className="text-xs text-gray-500">Retention: {backup.retention}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleBackupAction('restore', backup)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Restore"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleBackupAction('download', backup)
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Download"
                          >
                            <FaDownload size={16} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleBackupAction('delete', backup)
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
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
      </div>
    </div>
  )
}

export default Backups
