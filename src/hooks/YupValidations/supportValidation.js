// src/utils/validationSchemas.js
import * as yup from 'yup'

export const supportValidationSchemas = {
  // Ticket creation schema
  createTicket: yup.object({
    subject: yup
      .string()
      .min(5, 'Subject must be at least 5 characters')
      .max(255, 'Subject must be less than 255 characters')
      .required('Subject is required'),
    category: yup
      .string()
      .oneOf(
        ['general', 'technical', 'billing', 'feature', 'bug', 'case_related'],
        'Invalid category'
      )
      .required('Category is required'),
    priority: yup
      .string()
      .oneOf(['low', 'medium', 'high', 'urgent'], 'Invalid priority')
      .default('medium'),
    description: yup
      .string()
      .min(10, 'Description must be at least 10 characters')
      .required('Description is required'),
    case_id: yup
      .mixed()
      .nullable()
      .transform((value, originalValue) => {
        // Handle empty strings, null, undefined
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null
        }
        // Convert to number
        const number = Number(originalValue)
        return isNaN(number) ? null : number // Return null instead of originalValue
      })
      .test('is-integer', 'Case ID must be an integer', value => {
        if (value === null || value === undefined) return true // Allow null
        return Number.isInteger(value)
      }),
  }),

  // FAQ schema
  createFAQ: yup.object({
    question: yup
      .string()
      .min(5, 'Question must be at least 5 characters')
      .max(500, 'Question must be less than 500 characters')
      .required('Question is required'),
    answer: yup
      .string()
      .min(10, 'Answer must be at least 10 characters')
      .required('Answer is required'),
    category: yup
      .string()
      .oneOf(['general', 'technical', 'billing', 'account', 'case_management'], 'Invalid category')
      .required('Category is required'),
    order: yup
      .number()
      .integer('Order must be an integer')
      .min(0, 'Order must be 0 or greater')
      .default(0),
    is_active: yup.boolean().default(true),
  }),

  // Message schema
  createMessage: yup.object({
    message: yup.string().min(1, 'Message cannot be empty').required('Message is required'),
    is_internal: yup.boolean().default(false),
  }),
}

// Helper function to format form data before submission
export const formatSupportData = {
  // Format ticket data for API - DO NOT include ticket_number
  formatTicketData: data => {
    const formatted = {
      subject: data.subject?.trim(),
      category: data.category,
      priority: data.priority,
      description: data.description?.trim(),
    }

    // Handle case_id carefully - only include if valid integer, otherwise set to null
    if (data.case_id && data.case_id !== '' && Number.isInteger(Number(data.case_id))) {
      formatted.case_id = parseInt(data.case_id, 10)
    } else {
      // Explicitly set to null for empty/invalid values
      formatted.case_id = null
    }

    // console.log('Formatted ticket data for API (no ticket_number):', formatted)
    return formatted
  },

  // Format FAQ data for API
  formatFAQData: data => ({
    question: data.question?.trim(),
    answer: data.answer?.trim(),
    category: data.category,
    order: parseInt(data.order, 10) || 0,
    is_active: Boolean(data.is_active),
  }),

  // Format message data for API
  formatMessageData: data => ({
    message: data.message?.trim(),
    is_internal: Boolean(data.is_internal),
  }),
}
