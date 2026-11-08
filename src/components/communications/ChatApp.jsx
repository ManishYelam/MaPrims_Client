import React, { useState, useCallback } from 'react'
import { Loader, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/useSocket'
import { useChat } from '../../hooks/useChat'
import { ChatHeader, MessageInput, MessageList, RoomList } from './Chat'
import UserSelectionModal from './UserSelectionModalChat'

const ChatApp = ({ floatingIconHeight = 0 }) => {
  const { user } = useAuth()
  const { isConnected, socket } = useSocket('/private')
  const [sending, setSending] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: 'create', roomId: null })
  const [showRoomsList, setShowRoomsList] = useState(true)
  const userId = user?.user?.user_id || user?.user_id

  const {
    rooms,
    roomsLoading,
    roomsError,
    currentRoom,
    selectRoom,
    messages,
    typingUsers,
    onlineUsers,
    chatError,
    chatLoading,
    usersMap,
    sendMessage,
    sendTyping,
    markRoomSeen,
  } = useChat(socket, isConnected, userId)

  const handleRoomSelect = useCallback(
    id => {
      selectRoom(id)
      markRoomSeen(id)
      setShowRoomsList(false)
    },
    [selectRoom, markRoomSeen]
  )

  const handleSend = useCallback(
    text => {
      if (!isConnected || !currentRoom) return
      setSending(true)
      sendMessage(currentRoom, text)
      setSending(false)
    },
    [isConnected, sendMessage, currentRoom]
  )

  const handleTyping = useCallback(
    isTyping => {
      if (!currentRoom) return
      sendTyping(currentRoom, isTyping)
    },
    [sendTyping, currentRoom]
  )

  const openNewChatModal = () => setModal({ open: true, mode: 'create', roomId: null })
  const openAddMembersModal = () => setModal({ open: true, mode: 'add', roomId: currentRoom })

  const handleBackToList = () => setShowRoomsList(true)

  if (roomsLoading || chatLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (roomsError || chatError) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>Error: {roomsError || chatError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded bg-primary-500 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!rooms.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-gray-500">No rooms found. Start a new conversation!</p>
        <button
          onClick={openNewChatModal}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-white"
        >
          <Plus size={16} /> Create Room
        </button>
        <UserSelectionModal
          isOpen={modal.open && modal.mode === 'create'}
          onClose={() => setModal({ open: false, mode: 'create', roomId: null })}
          socket={socket}
          currentUserId={userId}
          mode="create"
        />
      </div>
    )
  }

  const currentRoomData = rooms.find(r => r.id === currentRoom)
  const currentMessages = messages[currentRoom] || []
  const onlineCount = onlineUsers[currentRoom]?.length || 0
  const roomType = currentRoomData?.type

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Room List */}
      <div
        className={`
          ${showRoomsList ? 'block' : 'hidden'}
          sm:block
          w-full sm:w-48 md:w-56
          flex-shrink-0 border-r border-gray-200
          h-full overflow-hidden
        `}
      >
        <RoomList
          rooms={rooms}
          currentRoom={currentRoom}
          onSelect={handleRoomSelect}
          messages={messages}
          onlineUsers={onlineUsers}
          onNewChat={openNewChatModal}
          onBack={handleBackToList}
          isVisible={showRoomsList}
        />
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col bg-white min-w-0 h-full overflow-hidden">
        <ChatHeader
          name={currentRoomData?.name}
          roomId={currentRoom}
          onlineCount={onlineCount}
          roomType={roomType}
          onAddMembers={openAddMembersModal}
          onBack={handleBackToList}
          showBackButton={!showRoomsList}
        />
        <MessageList
          messages={currentMessages}
          userId={userId}
          typingUsers={typingUsers}
          users={usersMap}
        />
        <div style={{ paddingBottom: `${floatingIconHeight}px` }} className="relative z-10">
          <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={sending} />
        </div>
      </div>

      <UserSelectionModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', roomId: null })}
        socket={socket}
        currentUserId={userId}
        mode={modal.mode}
        roomId={modal.roomId}
      />
    </div>
  )
}

export default ChatApp