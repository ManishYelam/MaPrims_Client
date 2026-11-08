// hooks/useNotificationHandler.js
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from './useSocket'

export const useNotificationHandler = () => {
  const { user } = useAuth()
  const userId = user?.user?.user_id
  const { on, off, emit, isConnected } = useSocket('/private')

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Recalculate unread count from local notifications
  const updateUnreadCount = useCallback(list => {
    const newCount = list.filter(n => !n.is_read).length
    setUnreadCount(newCount)
  }, [])

  const fetchNotifications = useCallback(() => {
    if (!userId) return
    emit('get-notifications', { limit: 20, offset: 0 })
  }, [emit, userId])

  // Main socket listeners
  useEffect(() => {
    if (!userId || !isConnected) return

    emit('join-notifications')
    fetchNotifications()

    const handleList = data => {
      if (data.success) {
        const list = data.notifications || []
        setNotifications(list)
        updateUnreadCount(list)
      }
    }

    const handleNew = data => {
      const newNotification = data.notification || data
      setNotifications(prev => {
        const updated = [newNotification, ...prev]
        updateUnreadCount(updated)
        return updated
      })
    }

    const handleRead = ({ notification_id }) => {
      setNotifications(prev => {
        const updated = prev.map(n =>
          n.notification_id === notification_id ? { ...n, is_read: true } : n
        )
        updateUnreadCount(updated)
        return updated
      })
    }

    const handleReadAll = () => {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: true }))
        updateUnreadCount(updated)
        return updated
      })
    }

    const handleDelete = ({ notification_id }) => {
      setNotifications(prev => {
        const updated = prev.filter(n => n.notification_id !== notification_id)
        updateUnreadCount(updated)
        return updated
      })
    }

    const handleClearAll = () => {
      setNotifications([])
      setUnreadCount(0)
    }

    on('notifications', handleList)
    on('notification-received', handleNew)
    on('notification-read', handleRead)
    on('all-notifications-read', handleReadAll)
    on('notification-deleted', handleDelete)
    on('clear-all-notifications', handleClearAll)

    return () => {
      off('notifications', handleList)
      off('notification-received', handleNew)
      off('notification-read', handleRead)
      off('all-notifications-read', handleReadAll)
      off('notification-deleted', handleDelete)
      off('clear-all-notifications', handleClearAll)
    }
  }, [userId, isConnected, emit, on, off, fetchNotifications, updateUnreadCount])

  // Actions
  const markAsRead = useCallback(
    notification_id => {
      emit('mark-notification-read', { notification_id })
    },
    [emit]
  )

  const markAllAsRead = useCallback(() => {
    emit('mark-all-notifications-read')
  }, [emit])

  const clearAll = useCallback(() => {
    emit('clear-all-notifications')
  }, [emit])

  const deleteNotification = useCallback(
    notification_id => {
      emit('delete-notification', { notification_id })
    },
    [emit]
  )

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    fetchNotifications,
  }
}
