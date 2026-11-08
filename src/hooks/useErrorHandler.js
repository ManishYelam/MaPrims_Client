import { useState, useCallback } from 'react'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)

  const handleError = useCallback((err, context = '') => {
    const errorObj = {
      message: err.message || String(err),
      stack: err.stack,
      context,
      timestamp: Date.now(),
    }
    // console.error(`Error in ${context}:`, errorObj)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorObj.message,
        fatal: false,
      })
    }
    setError(errorObj)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { error, handleError, clearError }
}
