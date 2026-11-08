import React, { useState } from 'react'
import {
  Download,
  Share2,
  Copy,
  Move,
  Trash2,
  Star,
  Tag,
  Archive,
  Lock,
  Unlock,
  MoreVertical,
  ChevronDown,
  ExternalLink,
  Edit,
  Eye,
  Users,
  Mail,
  Link,
  Folder,
  X,
} from 'lucide-react'

const DirectoryOperations = ({ selectedDirectories = [], onAction, position = 'top' }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)

  if (selectedDirectories.length === 0) return null

  const operations = [
    {
      id: 'open',
      label: 'Open',
      icon: <Eye size={18} />,
      color: 'text-blue-600 hover:bg-blue-50',
      description: 'Open selected directories',
    },
    {
      id: 'share',
      label: 'Share',
      icon: <Share2 size={18} />,
      color: 'text-green-600 hover:bg-green-50',
      description: 'Share with others',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy size={18} />,
      color: 'text-purple-600 hover:bg-purple-50',
      description: 'Create copies',
    },
    {
      id: 'move',
      label: 'Move',
      icon: <Move size={18} />,
      color: 'text-orange-600 hover:bg-orange-50',
      description: 'Move to another location',
    },
    {
      id: 'favorite',
      label: 'Favorite',
      icon: <Star size={18} />,
      color: 'text-yellow-600 hover:bg-yellow-50',
      description: 'Add to favorites',
    },
    {
      id: 'compress',
      label: 'Compress',
      icon: <Archive size={18} />,
      color: 'text-indigo-600 hover:bg-indigo-50',
      description: 'Compress to archive',
    },
  ]

  const moreOperations = [
    {
      id: 'rename',
      label: 'Rename',
      icon: <Edit size={18} />,
      color: 'text-gray-600',
    },
    {
      id: 'lock',
      label: 'Lock',
      icon: <Lock size={18} />,
      color: 'text-gray-600',
    },
    {
      id: 'unlock',
      label: 'Unlock',
      icon: <Unlock size={18} />,
      color: 'text-gray-600',
    },
    {
      id: 'tag',
      label: 'Add Tags',
      icon: <Tag size={18} />,
      color: 'text-gray-600',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy size={18} />,
      color: 'text-gray-600',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={18} />,
      color: 'text-red-600',
      destructive: true,
    },
  ]

  const handleOperation = operationId => {
    switch (operationId) {
      case 'share':
        setShowShareModal(true)
        break
      case 'move':
        setShowMoveModal(true)
        break
      default:
        onAction?.(operationId, selectedDirectories)
    }
  }

  const handleBulkDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedDirectories.length} directory(ies)? This action cannot be undone.`
      )
    ) {
      onAction?.('delete', selectedDirectories)
    }
  }

  const totalSize = selectedDirectories.reduce((sum, dir) => sum + (dir.size || 0), 0)
  const totalFiles = selectedDirectories.reduce((sum, dir) => sum + (dir.fileCount || 0), 0)

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-xl shadow-lg ${position === 'top' ? 'mb-6' : 'mt-6'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{selectedDirectories.length}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedDirectories.length} directory
                  {selectedDirectories.length !== 1 ? 'ies' : ''} selected
                </h3>
                <p className="text-sm text-gray-500">
                  {formatBytes(totalSize)} • {totalFiles} files
                </p>
              </div>
            </div>
            <button
              onClick={() => onAction?.('clear', [])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {operations.map(op => (
              <button
                key={op.id}
                onClick={() => handleOperation(op.id)}
                className={`flex flex-col items-center justify-center w-24 h-24 border rounded-xl transition-all hover:shadow-md ${op.color} border-gray-200`}
                title={op.description}
              >
                <div
                  className={`p-3 rounded-lg mb-2 ${op.color.replace('text-', 'bg-').replace('hover:bg-', '')} bg-opacity-10`}
                >
                  {op.icon}
                </div>
                <span className="text-sm font-medium">{op.label}</span>
              </button>
            ))}

            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex flex-col items-center justify-center w-24 h-24 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="p-3 rounded-lg mb-2 bg-gray-100">
                  <MoreVertical size={18} className="text-gray-600" />
                </div>
                <span className="text-sm font-medium">More</span>
              </button>

              {/* More Menu Dropdown */}
              {showMoreMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="py-2">
                    {moreOperations.map(op => (
                      <button
                        key={op.id}
                        onClick={() => {
                          if (op.id === 'delete') {
                            handleBulkDelete()
                          } else {
                            handleOperation(op.id)
                          }
                          setShowMoreMenu(false)
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-3 hover:bg-gray-50 text-left ${
                          op.destructive ? 'text-red-600' : op.color
                        }`}
                      >
                        {op.icon}
                        <span>{op.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleOperation('open')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye size={16} />
                <span>Open All</span>
              </button>
              <button
                onClick={() => handleOperation('share')}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 size={16} />
                <span>Share All</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete All</span>
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedDirectories.length} directories selected
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Share Directories</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share with people
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter email addresses"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                    <option value="upload">Can upload</option>
                    <option value="admin">Admin access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Add a message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Share2 size={16} className="inline mr-2" />
                    Share Directories
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Link size={16} className="inline mr-2" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Move Directories</h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Moving {selectedDirectories.length} directory
                  {selectedDirectories.length !== 1 ? 'ies' : ''}
                </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {/* Directory tree for selecting destination */}
                  <div className="space-y-2">
                    {['Root', 'Documents', 'Images', 'Archives', 'Shared'].map(folder => (
                      <label
                        key={folder}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input type="radio" name="destination" className="text-blue-600" />
                        <Folder size={18} className="text-yellow-500" />
                        <span>{folder}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleOperation('move')
                      setShowMoveModal(false)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Move Here
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const formatBytes = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default DirectoryOperations
