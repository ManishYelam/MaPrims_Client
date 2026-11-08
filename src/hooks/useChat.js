// hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from 'react'

export const useChat = (socket, isConnected, userId) => {
  // Rooms
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState(null)
  const [currentRoom, setCurrentRoom] = useState(null)
  const currentRoomRef = useRef(currentRoom)

  // Messages & real-time data
  const [messages, setMessages] = useState({}) // roomId -> array
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState({}) // roomId -> array of user ids
  const [chatError, setChatError] = useState(null)
  const [chatLoading, setChatLoading] = useState(true)

  // User map for avatars (user_id -> { full_name })
  const [usersMap, setUsersMap] = useState({})

  // Keep ref in sync
  useEffect(() => {
    currentRoomRef.current = currentRoom
  }, [currentRoom])

  // Register socket event handlers
  useEffect(() => {
    if (!socket) return

    // Handle initial user rooms
    const handleUserRooms = data => {
      if (data.success && data.rooms?.RoomMembers) {
        const roomsArray = []
        const initialMessages = {}
        const userMap = {}

        data.rooms.RoomMembers.forEach(member => {
          const room = member.Room
          const roomMessages = room.ChatMessages ? [...room.ChatMessages].reverse() : []
          initialMessages[room.room_id] = roomMessages

          // Extract user info from messages
          roomMessages.forEach(msg => {
            if (msg.User?.user_id && !userMap[msg.User.user_id]) {
              userMap[msg.User.user_id] = { full_name: msg.User.full_name }
            }
          })

          roomsArray.push({
            id: room.room_id,
            name: room.name,
            type: room.type,
            role: member.role,
            last_message: roomMessages[roomMessages.length - 1] || null,
          })
        })

        setRooms(roomsArray)
        setMessages(initialMessages)
        setUsersMap(userMap)
        setRoomsLoading(false)
      } else {
        setRooms([])
        setRoomsLoading(false)
      }
    }

    // Real-time room events
    const handleRoomCreated = newRoom => setRooms(prev => [...prev, newRoom])
    const handleRoomUpdated = updatedRoom =>
      setRooms(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)))
    const handleRoomDeleted = roomId => {
      setRooms(prev => prev.filter(r => r.id !== roomId))
      if (currentRoomRef.current === roomId) setCurrentRoom(rooms[0]?.id || null)
    }

    // New message event
    const handleNewMessage = message => {
      const { room_id, sender_id, User } = message
      setMessages(prev => ({
        ...prev,
        [room_id]: [...(prev[room_id] || []), message],
      }))
      setRooms(prev => prev.map(r => (r.id === room_id ? { ...r, last_message: message } : r)))
      if (User?.user_id && !usersMap[User.user_id]) {
        setUsersMap(prev => ({ ...prev, [User.user_id]: { full_name: User.full_name } }))
      }
    }

    // Messages history
    const handleMessagesHistory = history => {
      if (!history?.length) return
      const roomId = history[0].room_id
      setMessages(prev => ({ ...prev, [roomId]: history }))
      history.forEach(msg => {
        if (msg.User?.user_id && !usersMap[msg.User.user_id]) {
          setUsersMap(prev => ({ ...prev, [msg.User.user_id]: { full_name: msg.User.full_name } }))
        }
      })
    }

    // Typing indicator
    const handleUserTyping = ({ userId: uid, isTyping }) => {
      if (uid === userId) return
      setTypingUsers(prev => (isTyping ? [...prev, uid] : prev.filter(id => id !== uid)))
    }

    // Online users
    const handleOnlineUsers = ({ room, users }) =>
      setOnlineUsers(prev => ({ ...prev, [room]: users }))

    // Error handler
    const handleError = err => {
      setChatError(err.message)
      setChatLoading(false)
    }

    socket.on('user-rooms', handleUserRooms)
    socket.on('room-created', handleRoomCreated)
    socket.on('room-updated', handleRoomUpdated)
    socket.on('room-deleted', handleRoomDeleted)
    socket.on('new-message', handleNewMessage)
    socket.on('messages-history', handleMessagesHistory)
    socket.on('user-typing', handleUserTyping)
    socket.on('online-users', handleOnlineUsers)
    socket.on('error', handleError)

    return () => {
      socket.off('user-rooms', handleUserRooms)
      socket.off('room-created', handleRoomCreated)
      socket.off('room-updated', handleRoomUpdated)
      socket.off('room-deleted', handleRoomDeleted)
      socket.off('new-message', handleNewMessage)
      socket.off('messages-history', handleMessagesHistory)
      socket.off('user-typing', handleUserTyping)
      socket.off('online-users', handleOnlineUsers)
      socket.off('error', handleError)
    }
  }, [socket, userId, usersMap])

  // Request rooms once when connected
  useEffect(() => {
    if (!socket || !isConnected) return
    socket.emit('get-user-rooms')
    setChatLoading(false)
  }, [socket, isConnected])

  // Join room when currentRoom changes
  useEffect(() => {
    if (!socket || !isConnected || !currentRoom) return
    socket.emit('join-room', currentRoom)
    socket.emit('get-online-users', currentRoom)
  }, [socket, isConnected, currentRoom])

  // Request messages for a room (updated to include userId)
  const requestMessages = useCallback(
    (roomId, limit = 50, before = null) => {
      if (!socket || !isConnected || !roomId) return
      const payload = { roomId, userId, limit }
      if (before) payload.before = before
      socket.emit('get-messages', payload)
    },
    [socket, isConnected, userId]
  )

  // Select room
  const selectRoom = useCallback(
    roomId => {
      setCurrentRoom(roomId)
      requestMessages(roomId)
    },
    [requestMessages]
  )

  // Send message
  const sendMessage = useCallback(
    (roomId, text) => {
      if (!socket || !isConnected || !text.trim()) return
      socket.emit('send-message', {
        room_id: roomId,
        chat_message: text.trim(),
        type: 'text',
        priority: 'medium',
        meta: {},
      })
    },
    [socket, isConnected]
  )

  // Typing indicator
  const sendTyping = useCallback(
    (roomId, isTyping) => {
      if (!socket || !isConnected) return
      socket.emit('typing', { room_id: roomId, isTyping })
    },
    [socket, isConnected]
  )

  // Mark room as seen
  const markRoomSeen = useCallback(
    roomId => {
      if (!socket || !isConnected) return
      socket.emit('mark-room-seen', roomId)
    },
    [socket, isConnected]
  )

  return {
    // Rooms
    rooms,
    roomsLoading,
    roomsError,
    currentRoom,
    selectRoom,
    // Messages & live data
    messages,
    typingUsers,
    onlineUsers,
    chatError,
    chatLoading,
    usersMap,
    // Actions
    sendMessage,
    sendTyping,
    markRoomSeen,
  }
}
