// utils.js

// Format time for room list (e.g., "10:30 AM" or "15 Mar")
export const formatTime = isoString => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

// Get date label for separators (Today, Yesterday, or formatted date)
export const getDateLabel = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const messageDate = new Date(date)
  messageDate.setHours(0, 0, 0, 0)

  if (messageDate.getTime() === today.getTime()) return 'Today'
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday'
  return messageDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format timestamp inside message bubble (e.g., "10:30 AM" or "Yesterday 10:30 AM")
export const formatMessageTime = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (date >= today) return timeStr
  if (date >= yesterday && date < today) return `Yesterday ${timeStr}`
  return `${timeStr}`
}
