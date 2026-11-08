// pages/Notification.js
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaFileAlt,
  FaMoneyBillWave,
  FaClock,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa'
import { useNotificationHandler } from '../context/useNotificationHandler'

// Helper to get a human-readable type label
const getDisplayType = type => {
  const map = {
    system: 'System',
    message: 'Message',
    reminder: 'Reminder',
    schedule: 'Schedule',
    alert: 'Alert',
    case_update: 'Case Update',
    payment: 'Payment',
    document: 'Document',
  }
  return map[type] || type?.replace('_', ' ') || 'Notification'
}

const Notification = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, deleteNotification } =
    useNotificationHandler()

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Get icon based on type
  const getIcon = type => {
    const size = 'text-sm'
    switch (type) {
      case 'case_update':
        return <FaFileAlt className={`text-blue-500 ${size}`} />
      case 'payment':
        return <FaMoneyBillWave className={`text-green-500 ${size}`} />
      case 'document':
        return <FaFileAlt className={`text-purple-500 ${size}`} />
      case 'reminder':
        return <FaClock className={`text-orange-500 ${size}`} />
      case 'system':
      case 'alert':
        return <FaInfoCircle className={`text-gray-500 ${size}`} />
      default:
        return <FaBell className={`text-gray-400 ${size}`} />
    }
  }

  const formatTime = timestamp => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Filter and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesFilter =
        filter === 'all' || (filter === 'unread' && !n.is_read) || n.type === filter

      const matchesSearch =
        searchTerm === '' ||
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesFilter && matchesSearch
    })
  }, [notifications, filter, searchTerm])

  // Build filter chips from actual notification types
  const filters = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    ...Array.from(new Set(notifications.map(n => n.type)))
      .filter(t => t)
      .map(t => ({
        key: t,
        label: getDisplayType(t),
        count: notifications.filter(n => n.type === t).length,
      })),
  ]

  const handleLoadMore = () => {
    // Example: implement infinite scroll
    // You can call fetchNotifications with offset and append=true in the hook
    setLoadingMore(true)
    setTimeout(() => {
      setOffset(prev => prev + 20)
      setLoadingMore(false)
      // In production, call a paginated fetch
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaBell className="text-blue-500 text-xl" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated with your latest activity</p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition"
              >
                <FaCheck className="text-xs" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition"
              >
                <FaTrash className="text-xs" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 text-[10px] opacity-80">({f.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FaBell className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchTerm || filter !== 'all'
                  ? 'No notifications match your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div
                key={n.notification_id}
                className={`group bg-white rounded-lg border-l-4 transition-all hover:shadow-sm ${
                  n.is_read ? 'border-gray-200' : 'border-blue-500 bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3
                        className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}
                      >
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-gray-400">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    {n.meta?.link && (
                      <Link
                        to={n.meta.link}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        onClick={() => markAsRead(n.notification_id)}
                      >
                        View details →
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.notification_id)}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                        title="Mark as read"
                      >
                        <FaCheck className="text-xs" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.notification_id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More (pagination placeholder) */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loadingMore && <FaSpinner className="animate-spin inline mr-1" />}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notification
