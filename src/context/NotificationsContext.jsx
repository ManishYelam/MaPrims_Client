// context/NotificationsContext.jsx
import React, { createContext, useContext, useEffect } from 'react'
import { useNotificationHandler } from '../hooks/useNotificationHandler'

const NotificationsContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

export const NotificationsProvider = ({ children }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useNotificationHandler()

  // Optionally, you can add any extra logic or refetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
