// src/components/ui/UserSelectionModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Search, User, Check, Shield, Mail, Phone } from 'lucide-react'
import { userAPI } from '../../services/api'

const UserSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedUserId = null,
  allowedRoles = ['admin', 'student', 'staff'],
}) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(selectedUserId)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    if (show) {
      fetchUsers(1)
      setSelectedId(selectedUserId)
    }
  }, [show, selectedUserId])

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const response = await userAPI.getDropdownList({
        role: allowedRoles.join(','),
        page: page,
        limit: 10,
        search: searchQuery || undefined,
      })

      if (response.data?.success) {
        setUsers(response.data.data || [])
        setPagination({
          currentPage: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.total || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = e => {
    setSearchQuery(e.target.value)
    clearTimeout(window.userSearchTimeout)
    window.userSearchTimeout = setTimeout(() => {
      fetchUsers(1)
    }, 300)
  }

  const handleSelect = user => {
    setSelectedId(user.id)
  }

  const handleConfirm = () => {
    if (selectedId) {
      const selectedUser = users.find(u => u.id === selectedId)
      onSelect(selectedUser)
    }
    onClose()
  }

  const handlePageChange = page => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchUsers(page)
    }
  }

  const getRoleBadgeColor = role => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border border-purple-200',
      support: 'bg-blue-100 text-blue-800 border border-blue-200',
      staff: 'bg-green-100 text-green-800 border border-green-200',
      instructor: 'bg-orange-100 text-orange-800 border border-orange-200',
      student: 'bg-gray-100 text-gray-800 border border-gray-200',
    }
    return colors[role] || colors.student
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Assign User</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a user to assign this ticket</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar - Compact */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium text-gray-700">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {searchQuery
                  ? `No users match "${searchQuery}"`
                  : `No ${allowedRoles.join('/')} users available.`}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-160px)]">
              {/* Table Container */}
              <div className="p-1">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700">Select</th>
                      <th className="text-left p-2 font-medium text-gray-700">User</th>
                      <th className="text-left p-2 font-medium text-gray-700">ID</th>
                      <th className="text-left p-2 font-medium text-gray-700">Role</th>
                      <th className="text-left p-2 font-medium text-gray-700">Contact</th>
                      <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr
                        key={user.id}
                        onClick={() => handleSelect(user)}
                        className={`cursor-pointer transition-colors ${selectedId === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        {/* Selection Radio */}
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedId === user.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}
                            >
                              {selectedId === user.id && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* User Info */}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.full_name || user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-gray-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate max-w-[150px]">
                                {user.full_name || user.name}
                              </div>
                              {user.company && (
                                <div className="text-gray-500 truncate max-w-[120px]">
                                  {user.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* User ID */}
                        <td className="p-2">
                          <span className="font-mono text-gray-700">#{user.id}</span>
                        </td>

                        {/* Role */}
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role === 'admin' && <Shield className="w-2.5 h-2.5 mr-1" />}
                            {user.role}
                          </span>
                        </td>

                        {/* Contact Info */}
                        <td className="p-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-gray-700">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </div>
                            {user.phone && user.phone !== 'N/A' && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination - Compact */}
        {users.length > 0 && (
          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalItems}{' '}
                users
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage === 1) {
                    pageNum = i + 1
                  } else if (pagination.currentPage === pagination.totalPages) {
                    pageNum = pagination.totalPages - 2 + i
                  } else {
                    pageNum = pagination.currentPage - 1 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 rounded text-xs ${pagination.currentPage === pageNum ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {pagination.totalPages > 3 && <span className="px-1 text-gray-500">...</span>}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Compact */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {selectedId ? (
                <span>
                  Selected:{' '}
                  <span className="font-medium">
                    {users.find(u => u.id === selectedId)?.full_name ||
                      users.find(u => u.id === selectedId)?.name}
                  </span>
                </span>
              ) : (
                <span>No user selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded ${selectedId ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSelectionModal
