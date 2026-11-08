// src/hooks/useSupport.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { supportAPI } from '../services/supportService'
import {
  supportValidationSchemas,
  formatSupportData,
} from '../hooks/YupValidations/supportValidation'

export const useSupport = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: '',
    case_id: '', // Change from null to empty string for better form handling
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [faqs, setFaqs] = useState([])
  const [loadingFaqs, setLoadingFaqs] = useState(false)
  const [userTickets, setUserTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [stats, setStats] = useState(null)

  // Use refs to track loaded data to prevent re-fetching
  const loadedRef = useRef({
    faqs: false,
    tickets: false,
    stats: false,
  })

  // Validation function
  const validateForm = useCallback(async data => {
    try {
      await supportValidationSchemas.createTicket.validate(data, { abortEarly: false })
      setValidationErrors({})
      return true
    } catch (error) {
      const errors = {}
      error.inner.forEach(err => {
        errors[err.path] = err.message
      })
      setValidationErrors(errors)
      return false
    }
  }, [])

  // Memoized fetch functions
  const fetchFAQs = useCallback(async (force = false) => {
    if (loadedRef.current.faqs && !force) return

    try {
      setLoadingFaqs(true)
      const response = await supportAPI.getFAQs()
      if (response.data.success) {
        setFaqs(response.data.data.faqs)
        loadedRef.current.faqs = true
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      setFaqs([])
    } finally {
      setLoadingFaqs(false)
    }
  }, [])

  const fetchUserTickets = useCallback(async (force = false) => {
    if (loadedRef.current.tickets && !force) return

    try {
      setLoadingTickets(true)
      const response = await supportAPI.getUserTickets()
      if (response.data.success) {
        setUserTickets(response.data.data.tickets || [])
        loadedRef.current.tickets = true
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error)
      setUserTickets([])
    } finally {
      setLoadingTickets(false)
    }
  }, [])

  const fetchUserStats = useCallback(async (force = false) => {
    if (loadedRef.current.stats && !force) return

    try {
      const response = await supportAPI.getStats()
      if (response.data.success) {
        setStats(response.data.data.stats)
        loadedRef.current.stats = true
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Submit ticket function with enhanced error handling
  const submitTicket = useCallback(
    async ticketData => {
      // Validate data first
      const isValid = await validateForm(ticketData)
      if (!isValid) {
        return { success: false, error: 'Validation failed' }
      }

      setIsSubmitting(true)
      setSubmitStatus('')

      try {
        // Format data before sending - DO NOT include ticket_number
        const formattedData = formatSupportData.formatTicketData(ticketData)

        // console.log('Submitting ticket data to API:', formattedData)

        const response = await supportAPI.createTicket(formattedData)

        if (response.data.success) {
          setSubmitStatus('success')
          // Refresh stats and mark as stale to force refetch
          loadedRef.current.stats = false
          await fetchUserStats(true)
          return { success: true, data: response.data }
        } else {
          throw new Error(response.data.message || 'Failed to create ticket')
        }
      } catch (error) {
        console.error('Error creating ticket:', error)

        // Handle specific backend errors
        let errorMessage =
          error.response?.data?.message || error.message || 'Failed to create support ticket'

        // Check for foreign key constraint error
        if (
          errorMessage.includes('foreign key constraint fails') ||
          errorMessage.includes('case_id')
        ) {
          errorMessage =
            'The provided Case ID does not exist. Please check the Case ID or leave it empty if not related to a case.'
        }

        // Check for ticket_number null error specifically
        if (errorMessage.includes('ticket_number cannot be null')) {
          errorMessage = 'System error: Ticket number generation failed. Please try again.'
        }

        setSubmitStatus(`error: ${errorMessage}`)
        return { success: false, error: errorMessage }
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateForm, fetchUserStats]
  )

  // Refresh specific data
  const refreshData = useCallback(
    type => {
      loadedRef.current[type] = false
      switch (type) {
        case 'faqs':
          return fetchFAQs(true)
        case 'tickets':
          return fetchUserTickets(true)
        case 'stats':
          return fetchUserStats(true)
        default:
          break
      }
    },
    [fetchFAQs, fetchUserTickets, fetchUserStats]
  )

  // Clear validation errors
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  // Clear form
  const clearForm = useCallback(() => {
    setFormData({
      subject: '',
      category: 'general',
      priority: 'medium',
      description: '',
      case_id: '', // Reset to empty string
    })
    setValidationErrors({})
    setSubmitStatus('')
  }, [])

  return {
    formData,
    setFormData,
    isSubmitting,
    submitStatus,
    setSubmitStatus,
    validationErrors,
    setValidationErrors,
    clearValidationErrors,
    clearForm,
    faqs,
    loadingFaqs,
    userTickets,
    loadingTickets,
    stats,
    submitTicket,
    fetchFAQs,
    fetchUserTickets,
    fetchUserStats,
    refreshData,
    validateForm,
  }
}
