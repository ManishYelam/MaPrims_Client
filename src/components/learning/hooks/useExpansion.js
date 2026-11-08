import { useState, useCallback } from 'react'

export const useExpansion = (key = null, defaultState = false) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (key && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`expand_${key}`)
      return saved !== null ? JSON.parse(saved) : defaultState
    }
    return defaultState
  })

  const toggle = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev
      if (key && typeof window !== 'undefined') {
        localStorage.setItem(`expand_${key}`, JSON.stringify(newState))
      }
      return newState
    })
  }, [key])

  const expand = useCallback(() => {
    setIsExpanded(true)
    if (key && typeof window !== 'undefined') {
      localStorage.setItem(`expand_${key}`, JSON.stringify(true))
    }
  }, [key])

  const collapse = useCallback(() => {
    setIsExpanded(false)
    if (key && typeof window !== 'undefined') {
      localStorage.setItem(`expand_${key}`, JSON.stringify(false))
    }
  }, [key])

  return { isExpanded, toggle, expand, collapse }
}
