// components/communications/UserSelectionModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Search, Check, User } from 'lucide-react'
import { userAPI } from '../../services/api'

const UserSelectionModal = ({
  isOpen,
  onClose,
  socket,
  currentUserId,
  mode,
  roomId,
  onSuccess,
}) => {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await userAPI.getAllUsers({
          limit: 1000,
          sortBy: 'full_name',
          sortOrder: 'ASC',
        })
        const allUsers = response.data?.data || []
        setUsers(allUsers.filter(u => u.user_id !== currentUserId))
      } catch (err) {
        console.error('Failed to fetch users', err)
        setError('Could not load users. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen, currentUserId])

  const handleUserSelect = user => {
    setSelectedUsers(prev =>
      prev.some(u => u.user_id === user.user_id)
        ? prev.filter(u => u.user_id !== user.user_id)
        : [...prev, user]
    )
  }

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      setError('Select at least one user')
      return
    }

    const userIds = selectedUsers.map(u => u.user_id)

    if (!socket) return

    if (mode === 'create') {
      const name =
        groupName.trim() ||
        (selectedUsers.length === 1
          ? selectedUsers[0].full_name
          : `Group (${selectedUsers.length})`)
      socket.emit('create-room', { name, userIds })
    } else if (mode === 'add') {
      if (!roomId) {
        setError('Room ID is missing')
        return
      }
      socket.emit('add-members', { roomId, userIds })
    }

    onSuccess?.()
    onClose()
    setSelectedUsers([])
    setGroupName('')
    setError('')
  }

  if (!isOpen) return null

  const title = mode === 'create' ? 'New Chat' : 'Add Members'
  const submitButtonText = mode === 'create' ? 'Create' : 'Add'
  const showGroupNameInput = mode === 'create'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-h-[90vh] overflow-auto bg-white rounded-t-2xl sm:rounded-b-2xl sm:max-w-md md:max-w-lg shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          {showGroupNameInput && (
            <input
              type="text"
              placeholder="Group name (optional)"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-200 p-1.5 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          )}

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-gray-200 py-1.5 pl-8 pr-2 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>

          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
              </div>
            ) : (
              users
                .filter(
                  u =>
                    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                    u.email?.toLowerCase().includes(search.toLowerCase())
                )
                .map(user => {
                  const isSelected = selectedUsers.some(u => u.user_id === user.user_id)
                  return (
                    <div
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition min-h-[48px] ${
                        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600 text-xs">
                        {user.full_name?.[0]?.toUpperCase() || <User size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium sm:text-sm">{user.full_name}</p>
                        <p className="text-[10px] text-gray-500 sm:text-xs">{user.email}</p>
                      </div>
                      {isSelected && <Check size={16} className="text-primary-500" />}
                    </div>
                  )
                })
            )}
          </div>

          <div className="sticky bottom-0 bg-white pt-3 pb-2 flex justify-end gap-2 border-t mt-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedUsers.length === 0}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSelectionModal