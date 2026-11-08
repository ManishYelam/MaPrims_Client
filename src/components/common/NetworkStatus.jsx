import React, { useState, useEffect } from 'react'

export const NetworkStatus = ({ onReconnect }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [show, setShow] = useState(false)

  useEffect(() => {
    let timeoutId
    const handleOnline = () => {
      setIsOnline(true)
      setShow(true)
      timeoutId = setTimeout(() => setShow(false), 3000)
      if (onReconnect) onReconnect()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShow(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(timeoutId)
    }
  }, [onReconnect])

  if (!show) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      <div className="flex items-center space-x-2 text-white">
        <span className="text-sm font-medium">{isOnline ? 'Back online' : 'You are offline'}</span>
      </div>
    </div>
  )
}
