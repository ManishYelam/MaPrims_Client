import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export const useSocket = (namespace = '/private') => {
  const { user, isAuthenticated } = useAuth()
  const token = user?.token
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  // Socket connection effect
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    const newSocket = io(`${BACKEND_URL}${namespace}`, {
      auth: { token },
      transports: ['websocket', 'polling'], // ✅ correct order
    })

    newSocket.on('connect', () => {
      // console.log(`Socket connected to ${BACKEND_URL}${namespace}`)
      setIsConnected(true)
      setConnectionError(null)
    })

    newSocket.on('connect_error', err => {
      // console.error(`Socket connection error: ${err.message}`)
      setIsConnected(false)
      setConnectionError(err.message)
    })

    newSocket.on('disconnect', () => {
      // console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketRef.current = newSocket

    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, token, namespace])

  // Memoized emit – depends on isConnected so it's updated when connection status changes
  const emit = useCallback(
    (event, ...args) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, ...args)
      } else {
        console.warn(`Socket not connected, cannot emit ${event}`)
      }
    },
    [isConnected]
  )

  // Memoized on – attaches event listener (no dependencies, stable)
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler)
    }
  }, [])

  // Memoized off – removes event listener (stable)
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
  }
}
