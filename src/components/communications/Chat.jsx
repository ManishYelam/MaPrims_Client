import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Send,
  Loader,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Search,
  Check,
  CheckCheck,
  Plus,
  UserPlus,
  ChevronLeft,
} from 'lucide-react'
import { formatTime, getDateLabel, formatMessageTime } from './utils'

export const RoomItem = React.memo(({ room, isActive, onClick, lastMessage, unread }) => (
  <div
    onClick={onClick}
    className={`group flex cursor-pointer items-center gap-2.5 py-2 px-3 transition-all duration-200 hover:bg-gray-50 ${
      isActive ? 'bg-primary-50 border-r-4 border-primary-500' : ''
    } min-h-[56px]`}
  >
    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-semibold text-white text-xs shadow-sm">
      {room.name?.[0]?.toUpperCase() || room.id}
      {room.online && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between">
        <h3 className="truncate text-xs font-medium text-gray-800">
          {room.name || `Room ${room.id}`}
        </h3>
        {lastMessage && (
          <span className="text-[10px] text-gray-400">{formatTime(lastMessage.createdAt)}</span>
        )}
      </div>
      <p className="truncate text-[11px] text-gray-500">
        {lastMessage ? lastMessage.chat_message || lastMessage.message || '' : 'No messages yet'}
      </p>
      {unread > 0 && (
        <span className="mt-0.5 inline-block rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {unread}
        </span>
      )}
    </div>
  </div>
))

export const RoomList = ({
  rooms,
  currentRoom,
  onSelect,
  messages,
  onlineUsers,
  onNewChat,
  onBack,
  isVisible,
}) => {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () =>
      rooms.filter(
        r => r.name?.toLowerCase().includes(search.toLowerCase()) || String(r.id).includes(search)
      ),
    [rooms, search]
  )

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="border-b bg-white/50 backdrop-blur-sm p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Chats</h2>
          <div className="flex items-center gap-0.5">
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="rounded-full p-1.5 transition hover:bg-gray-100"
                title="New Chat"
              >
                <Plus size={14} className="text-gray-500" />
              </button>
            )}
            <button className="rounded-full p-1.5 transition hover:bg-gray-100">
              <MoreVertical size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full bg-gray-100 py-1.5 pl-7 pr-2 text-xs transition-all focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map(room => (
          <RoomItem
            key={room.id}
            room={{ ...room, online: onlineUsers?.[room.id]?.length > 0 }}
            isActive={currentRoom === room.id}
            onClick={() => onSelect(room.id)}
            lastMessage={messages[room.id]?.[messages[room.id].length - 1] || room.last_message}
          />
        ))}
      </div>
    </div>
  )
}

const MessageBubble = React.memo(
  ({ message, isOwn, isSameSender, senderName, showAvatar, formattedTime, marginTopClass }) => {
    const text = message.chat_message || message.message || ''
    const status = message.status

    const bubbleBg = isOwn
      ? 'bg-primary-600 text-white'
      : 'bg-gray-50 text-gray-800 border border-gray-200'

    const bubbleCorner = isOwn ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'

    const outerClasses = `flex ${isOwn ? 'justify-end' : 'flex-col items-start'} ${marginTopClass}`

    if (isOwn) {
      return (
        <div className={outerClasses}>
          <div className={`max-w-[85%] px-3 py-1.5 shadow-sm ${bubbleBg} ${bubbleCorner}`}>
            <p className="break-words text-xs leading-tight sm:text-sm">{text}</p>
            <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5 text-primary-100">
              <span>{formattedTime}</span>
              <span>
                {status === 'seen' ? <CheckCheck size={10} /> : <Check size={10} />}
              </span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={outerClasses}>
        {showAvatar && senderName && (
          <div className="mb-0.5 ml-1 text-[10px] font-medium text-gray-500">{senderName}</div>
        )}
        <div className={`max-w-[85%] px-3 py-1.5 shadow-sm ${bubbleBg} ${bubbleCorner}`}>
          <p className="break-words text-xs leading-tight sm:text-sm">{text}</p>
          <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5 text-gray-400">
            <span>{formattedTime}</span>
            {isOwn && (
              <span className="text-primary-100">
                {status === 'seen' ? <CheckCheck size={10} /> : <Check size={10} />}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
)

export const MessageList = ({ messages = [], userId, typingUsers = [], users }) => {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const groupedItems = useMemo(() => {
    const items = []
    let lastDateKey = null

    messages.forEach((msg, idx) => {
      const createdAt = msg.createdAt
      if (!createdAt) return
      const msgDate = new Date(createdAt)
      if (isNaN(msgDate.getTime())) return

      const normalizedDate = new Date(msgDate)
      normalizedDate.setHours(0, 0, 0, 0)
      const dateKey = normalizedDate.toISOString().split('T')[0]

      if (lastDateKey !== dateKey) {
        items.push({
          type: 'date',
          date: createdAt,
          key: `date-${dateKey}`,
        })
        lastDateKey = dateKey
      }

      items.push({
        type: 'message',
        message: msg,
        key: msg.chat_message_id || idx,
      })
    })

    return items
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-2 sm:p-3">
      {groupedItems.map(item => {
        if (item.type === 'date') {
          const dateLabel = getDateLabel(item.date)
          return (
            <div key={item.key} className="flex justify-center my-2">
              <div className="bg-gray-200 px-2.5 py-1 rounded-full text-[10px] text-gray-600 sm:text-xs">
                {dateLabel}
              </div>
            </div>
          )
        }

        const msg = item.message
        const isOwn = msg.sender_id === userId
        const currentIndex = messages.findIndex(m => m.chat_message_id === msg.chat_message_id)
        const prevMsg = currentIndex > 0 ? messages[currentIndex - 1] : null
        const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id

        let marginTopClass = ''
        if (currentIndex === 0) {
          marginTopClass = ''
        } else if (isSameSender) {
          marginTopClass = 'mt-0.5'
        } else {
          marginTopClass = 'mt-2'
        }

        const showAvatar = !isOwn && !isSameSender
        const senderName = users?.[msg.sender_id]?.full_name || 'User'
        const formattedTime = formatMessageTime(msg.createdAt)

        return (
          <MessageBubble
            key={item.key}
            message={msg}
            isOwn={isOwn}
            isSameSender={isSameSender}
            senderName={senderName}
            showAvatar={showAvatar}
            formattedTime={formattedTime}
            marginTopClass={marginTopClass}
          />
        )
      })}
      {typingUsers.length > 0 && (
        <div className="flex justify-start mt-2">
          <div className="rounded-full bg-gray-200 px-2.5 py-1 text-[10px] text-gray-500 sm:text-xs">
            Typing...
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

export const MessageInput = ({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState('')
  const timeout = useRef()

  const handleChange = e => {
    setText(e.target.value)
    if (timeout.current) clearTimeout(timeout.current)
    onTyping(true)
    timeout.current = setTimeout(() => onTyping(false), 3000)
  }

  const send = () => {
    if (!text.trim() || disabled) return
    onSend(text)
    setText('')
    onTyping(false)
    if (timeout.current) clearTimeout(timeout.current)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="border-t bg-white p-2 sm:p-3">
      <div className="flex items-center gap-1.5">
        {/* Send button on the LEFT */}
        <button
          onClick={send}
          disabled={disabled || !text.trim()}
          className="rounded-full bg-primary-600 p-1.5 text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
        >
          {disabled ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
        </button>

        {/* Attachment button */}
        <button className="rounded-full p-1.5 transition hover:bg-gray-100">
          <Paperclip size={16} className="text-gray-500" />
        </button>

        {/* Text input */}
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder="Message"
          rows={1}
          className="flex-1 resize-none rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs transition-all focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200 sm:text-sm"
        />
      </div>
    </div>
  )
}

export const ChatHeader = ({
  name,
  roomId,
  onlineCount,
  roomType,
  onAddMembers,
  onBack,
  showBackButton = false,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-between border-b bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={onBack}
            className="rounded-full p-1.5 transition hover:bg-gray-100 sm:hidden"
            aria-label="Back to chats"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-semibold text-white text-xs shadow-sm">
          {name?.[0]?.toUpperCase() || roomId}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{name || `Room ${roomId}`}</h2>
          <p className="text-[10px] text-gray-500">
            {onlineCount > 0 ? (
              <span className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                </span>
                {onlineCount} online
              </span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-1 relative">
        {roomType === 'group' && (
          <button
            onClick={onAddMembers}
            className="rounded-full p-1.5 transition hover:bg-gray-100"
            title="Add members"
          >
            <UserPlus size={16} className="text-gray-600" />
          </button>
        )}
        <button className="rounded-full p-1.5 transition hover:bg-gray-100">
          <Phone size={16} className="text-gray-600" />
        </button>
        <button className="rounded-full p-1.5 transition hover:bg-gray-100">
          <Video size={16} className="text-gray-600" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-full p-1.5 transition hover:bg-gray-100"
          >
            <MoreVertical size={16} className="text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border z-50">
              <div className="py-1"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}