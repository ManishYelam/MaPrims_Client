import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Share2,
  Users,
  Link as LinkIcon,
  Calendar,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Search,
  Filter,
  Plus,
  Clock,
  X,
  Mail,
  Lock,
  Globe,
  File,
  Folder,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const Sharing = () => {
  const [activeTab, setActiveTab] = useState('shared')
  const [searchQuery, setSearchQuery] = useState('')

  const sharedItems = [
    {
      id: '1',
      name: 'Project Documents',
      type: 'directory',
      sharedBy: 'John Doe',
      sharedAt: '2024-01-15T10:30:00Z',
      permissions: ['view', 'edit'],
      accessType: 'link',
      recipients: 5,
      expiresAt: '2024-02-15',
      isPublic: false,
    },
    {
      id: '2',
      name: 'Financial Report.pdf',
      type: 'file',
      sharedBy: 'Jane Smith',
      sharedAt: '2024-01-14T14:20:00Z',
      permissions: ['view'],
      accessType: 'email',
      recipients: 3,
      expiresAt: '2024-01-28',
      isPublic: false,
    },
    {
      id: '3',
      name: 'Team Photos',
      type: 'directory',
      sharedBy: 'Mike Johnson',
      sharedAt: '2024-01-13T09:15:00Z',
      permissions: ['view', 'download'],
      accessType: 'public',
      recipients: null,
      expiresAt: null,
      isPublic: true,
    },
    {
      id: '4',
      name: 'Meeting Recording.mp4',
      type: 'file',
      sharedBy: 'Sarah Wilson',
      sharedAt: '2024-01-12T16:45:00Z',
      permissions: ['view'],
      accessType: 'email',
      recipients: 8,
      expiresAt: '2024-01-26',
      isPublic: false,
    },
    {
      id: '5',
      name: 'Design Assets',
      type: 'directory',
      sharedBy: 'Alex Turner',
      sharedAt: '2024-01-11T11:30:00Z',
      permissions: ['view', 'edit', 'download'],
      accessType: 'link',
      recipients: 12,
      expiresAt: '2024-02-11',
      isPublic: false,
    },
  ]

  const pendingRequests = [
    {
      id: '1',
      user: 'Robert Davis',
      email: 'robert@example.com',
      item: 'Client Contracts',
      type: 'directory',
      requestedAt: '2024-01-15T09:20:00Z',
      message: 'Need access for client meeting preparation',
    },
    {
      id: '2',
      user: 'Lisa Brown',
      email: 'lisa@example.com',
      item: 'Budget Spreadsheet.xlsx',
      type: 'file',
      requestedAt: '2024-01-14T15:40:00Z',
      message: 'Required for quarterly review',
    },
  ]

  const accessHistory = [
    {
      id: '1',
      user: 'Emma Wilson',
      action: 'viewed',
      item: 'Project Documents',
      timestamp: '2024-01-15T14:30:00Z',
      ip: '192.168.1.100',
    },
    {
      id: '2',
      user: 'David Miller',
      action: 'downloaded',
      item: 'Financial Report.pdf',
      timestamp: '2024-01-15T13:15:00Z',
      ip: '203.0.113.42',
    },
    {
      id: '3',
      user: 'Anonymous',
      action: 'viewed',
      item: 'Team Photos',
      timestamp: '2024-01-15T11:45:00Z',
      ip: '198.51.100.23',
    },
  ]

  const tabs = [
    { id: 'shared', label: 'Shared Items', count: sharedItems.length },
    { id: 'requests', label: 'Access Requests', count: pendingRequests.length },
    { id: 'history', label: 'Access History', count: accessHistory.length },
  ]

  const formatDate = dateString => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = dateString => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`

    return formatDate(dateString)
  }

  const getItemIcon = type => {
    if (type === 'directory') return <Folder className="text-yellow-500" size={20} />
    return <File className="text-blue-500" size={20} />
  }

  const getAccessTypeIcon = type => {
    if (type === 'public') return <Globe className="text-green-500" size={16} />
    if (type === 'link') return <LinkIcon className="text-blue-500" size={16} />
    return <Mail className="text-purple-500" size={16} />
  }

  const getPermissionBadges = permissions => {
    const badgeColors = {
      view: 'bg-blue-100 text-blue-800',
      edit: 'bg-green-100 text-green-800',
      download: 'bg-purple-100 text-purple-800',
    }

    return permissions.map(perm => (
      <span key={perm} className={`px-2 py-1 text-xs font-medium rounded ${badgeColors[perm]}`}>
        {perm}
      </span>
    ))
  }

  const handleShareAction = (action, item) => {
    switch (action) {
      case 'revoke':
        if (window.confirm(`Revoke access to "${item.name}"?`)) {
          console.log('Revoke access:', item)
        }
        break
      case 'edit':
        console.log('Edit sharing settings:', item)
        break
      case 'copy':
        console.log('Copy share link:', item)
        break
    }
  }

  const handleRequestAction = (action, request) => {
    switch (action) {
      case 'approve':
        console.log('Approve request:', request)
        break
      case 'deny':
        if (window.confirm(`Deny access request from ${request.user}?`)) {
          console.log('Deny request:', request)
        }
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sharing</h1>
          <p className="text-gray-600 mt-1">Manage shared files and access permissions</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search shared items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Filters">
              <Filter size={20} />
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
              <Plus size={18} className="mr-2" />
              Share New
            </button>
          </div>
        </div>
      </div>

      {/* Sharing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Shared Items</p>
              <p className="text-2xl font-bold">{sharedItems.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Recipients</p>
              <p className="text-2xl font-bold">
                {sharedItems.reduce((sum, item) => sum + (item.recipients || 0), 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Public Links</p>
              <p className="text-2xl font-bold">
                {sharedItems.filter(item => item.isPublic).length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Shared Items */}
          {activeTab === 'shared' && (
            <div className="space-y-4">
              {sharedItems.map(item => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="pt-1">{getItemIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.isPublic && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center">
                              <Globe size={12} className="mr-1" />
                              Public
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Users size={14} className="mr-1" />
                            <span>Shared by {item.sharedBy}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{formatDate(item.sharedAt)}</span>
                          </div>
                          <div className="flex items-center">
                            {getAccessTypeIcon(item.accessType)}
                            <span className="ml-1 capitalize">{item.accessType}</span>
                          </div>
                          {item.recipients && (
                            <div className="flex items-center">
                              <span>
                                {item.recipients} recipient{item.recipients !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionBadges(item.permissions)}
                          {item.expiresAt && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded flex items-center">
                              <Clock size={12} className="mr-1" />
                              Expires {formatDate(item.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShareAction('copy', item)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Copy link"
                      >
                        <LinkIcon size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleShareAction('edit', item)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Edit sharing"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleShareAction('revoke', item)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Revoke access"
                      >
                        <X size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Access Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="pt-1">
                        <Users className="text-blue-500" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="font-medium text-gray-900">{request.user}</h4>
                          <p className="text-sm text-gray-600">{request.email}</p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            {getItemIcon(request.type)}
                            <span className="ml-2">{request.item}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span>{formatTime(request.requestedAt)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>{request.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRequestAction('approve', request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction('deny', request)}
                        className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 flex items-center"
                      >
                        <X size={16} className="mr-2" />
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Access History */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessHistory.map(access => (
                    <tr key={access.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{access.user}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                            access.action === 'viewed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {access.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{access.item}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(access.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{access.ip}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sharing
